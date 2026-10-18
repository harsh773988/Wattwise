/**
 * /api/import endpoint — processes CSV uploads via multipart/form-data or JSON payload.
 * Validates file type, payload size limits, invokes importService, and persists valid readings.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseCsv, parseAndValidateCsv } from "@/services/importService";
import { getRepository } from "@/infra";
import { withApi } from "@/lib/apiWrapper";
import { ApiErrors } from "@/lib/apiError";
import { MAX_CSV_SIZE_BYTES } from "@/lib/config";
import type { DuplicateMergeRule } from "@/domain/types";

const importJsonSchema = z.object({
  spaceId: z.string().min(1).default("default"),
  csvContent: z.string().optional(),
  rows: z.array(z.record(z.string(), z.string())).optional(),
  mergeRule: z.enum(["latest", "sum", "average"]).default("sum"),
});

export const POST = withApi(async (req: NextRequest) => {
  const contentType = req.headers.get("content-type") || "";

  let spaceId = "default";
  let mergeRule: DuplicateMergeRule = "sum";
  let csvContent: string | null = null;
  let rows: Record<string, string>[] | null = null;
  let fileName: string | undefined = undefined;
  let mimeType: string | undefined = undefined;

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const file = formData.get("file");
      spaceId = (formData.get("spaceId") as string) || "default";
      mergeRule = ((formData.get("mergeRule") as DuplicateMergeRule) || "sum");

      if (!file || typeof file === "string") {
        return ApiErrors.badRequest("No CSV file attached to form data");
      }

      const fileObj = file as File;
      fileName = fileObj.name;
      mimeType = fileObj.type;

      // File size guard
      if (fileObj.size > MAX_CSV_SIZE_BYTES) {
        return ApiErrors.payloadTooLarge(MAX_CSV_SIZE_BYTES);
      }

      // File type guard
      if (!fileName.toLowerCase().endsWith(".csv") && !fileName.toLowerCase().endsWith(".txt")) {
        return ApiErrors.unsupportedMediaType("Only .csv or .txt files are supported");
      }

      csvContent = await fileObj.text();
    } catch {
      return ApiErrors.badRequest("Failed to parse multipart form data");
    }
  } else if (contentType.includes("application/json")) {
    try {
      const body = await req.json();
      const parsed = importJsonSchema.safeParse(body);
      if (!parsed.success) {
        return ApiErrors.badRequest(parsed.error.issues.map((i) => i.message).join(", "));
      }
      spaceId = parsed.data.spaceId;
      mergeRule = parsed.data.mergeRule;
      csvContent = parsed.data.csvContent ?? null;
      rows = parsed.data.rows ?? null;
    } catch {
      return ApiErrors.badRequest("Invalid JSON body");
    }
  } else {
    return ApiErrors.unsupportedMediaType("Request must be multipart/form-data or application/json");
  }

  // Execute pure domain parsing service
  const validationResult = csvContent !== null
    ? parseCsv(csvContent, { spaceId, mergeRule, fileName, mimeType })
    : rows !== null
    ? parseAndValidateCsv(rows, spaceId, mergeRule)
    : null;

  if (!validationResult) {
    return ApiErrors.badRequest("Either 'file', 'csvContent', or 'rows' must be provided");
  }

  // If entire file had unrecoverable header or file-level errors
  if (validationResult.validRows === 0 && validationResult.errors.length > 0) {
    const isFileType = validationResult.errors.some((e) => e.message.includes("file type"));
    if (isFileType) {
      return ApiErrors.unsupportedMediaType(validationResult.errors[0].message);
    }

    return NextResponse.json(
      {
        error: {
          code: "IMPORT_FAILED",
          message: "No valid rows could be imported from the CSV.",
          details: validationResult.errors.slice(0, 50),
        },
      },
      { status: 422 },
    );
  }

  // Persist accepted readings
  const repo = getRepository();
  if (validationResult.readings.length > 0) {
    await repo.upsertReadings(spaceId, validationResult.readings);
  }

  return NextResponse.json({
    data: {
      success: true,
      spaceId,
      stats: validationResult.stats,
      importedCount: validationResult.readings.length,
      warnings: validationResult.warnings,
      errors: validationResult.errors.slice(0, 20),
    },
  });
});
