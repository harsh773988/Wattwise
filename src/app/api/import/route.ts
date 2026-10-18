import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Papa from "papaparse";
import { parseAndValidateCsv } from "@/services/importService";
import { getRepository } from "@/infra";
import { checkRateLimit } from "@/lib/rateLimiter";
import { getEnv, MAX_CSV_SIZE_BYTES } from "@/lib/config";
import { logger } from "@/lib/logger";

const importBodySchema = z.object({
  spaceId: z.string().min(1).default("default"),
  csvContent: z.string().optional(),
  rows: z.array(z.record(z.string(), z.string())).optional(),
  mergeRule: z.enum(["latest", "sum", "average"]).default("latest"),
});

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const env = getEnv();
  const rateLimitRes = checkRateLimit(ip, {
    maxRequests: env.RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimitRes.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many import requests. Please slow down.",
        },
      },
      { status: 429 },
    );
  }

  // Request size limit guard
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_CSV_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: `Import payload exceeds limit of ${MAX_CSV_SIZE_BYTES / (1024 * 1024)}MB`,
        },
      },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON",
        },
      },
      { status: 400 },
    );
  }

  const parseResult = importBodySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
        },
      },
      { status: 400 },
    );
  }

  const { spaceId, csvContent, rows: providedRows, mergeRule } = parseResult.data;

  let rawRows: Record<string, string>[] = [];

  if (providedRows && providedRows.length > 0) {
    rawRows = providedRows;
  } else if (csvContent) {
    const parseRes = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
    });
    rawRows = parseRes.data;
  } else {
    return NextResponse.json(
      {
        error: {
          code: "EMPTY_PAYLOAD",
          message: "Either 'csvContent' or 'rows' must be provided",
        },
      },
      { status: 400 },
    );
  }

  const validationResult = parseAndValidateCsv(rawRows, spaceId, mergeRule);

  if (validationResult.validRows === 0 && validationResult.errors.length > 0) {
    return NextResponse.json(
      {
        error: {
          code: "IMPORT_FAILED",
          message: "No valid rows could be imported from the CSV.",
        },
        details: validationResult.errors.slice(0, 50),
      },
      { status: 422 },
    );
  }

  try {
    const repo = getRepository();
    if (validationResult.readings.length > 0) {
      await repo.upsertReadings(spaceId, validationResult.readings);
    }

    return NextResponse.json({
      data: {
        success: true,
        spaceId,
        importedCount: validationResult.readings.length,
        duplicatesHandled: validationResult.duplicatesHandled,
        totalRowsProcessed: validationResult.totalRows,
        warnings: validationResult.errors.slice(0, 20),
      },
    });
  } catch (err: unknown) {
    logger.error("Import storage failed", { error: err });
    return NextResponse.json(
      {
        error: {
          code: "DATABASE_ERROR",
          message: err instanceof Error ? err.message : "Failed to store imported readings",
        },
      },
      { status: 500 },
    );
  }
}
