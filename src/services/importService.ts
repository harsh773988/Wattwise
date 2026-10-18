/**
 * CSV import service — parse, validate, and normalize electricity reading CSV data.
 * Pure logic using Zod for row-level validation.
 * No React, no direct database/I/O, no env access.
 */

import { z } from "zod";
import Papa from "papaparse";
import type { Reading, DuplicateMergeRule } from "@/domain/types";
import { round2 } from "@/domain/cost";
import { MAX_CSV_ROWS } from "@/lib/config";

export interface ImportStats {
  readonly rows: number; // Total raw data rows processed
  readonly accepted: number; // Valid rows accepted before deduplication
  readonly rejected: number; // Rows failed validation
  readonly merged: number; // Duplicate rows merged into existing dates
}

export interface ImportError {
  readonly row: number;
  readonly field: string;
  readonly message: string;
}

export interface ImportWarning {
  readonly row?: number;
  readonly message: string;
}

/**
 * Result of CSV parsing and validation.
 *
 * Duplicate Date Merge Rule:
 * When multiple rows share the same date (and spaceId), their kWh values are
 * merged by SUMMING them into a single reading (default rule: "sum").
 * The total number of collapsed duplicates is recorded in `stats.merged`.
 */
export interface ImportResult {
  readonly readings: Reading[];
  readonly warnings: ImportWarning[];
  readonly errors: ImportError[];
  readonly stats: ImportStats;
  // Backwards compatibility aliases
  readonly totalRows: number;
  readonly validRows: number;
  readonly duplicatesHandled: number;
}

export interface ImportOptions {
  readonly spaceId?: string;
  readonly mergeRule?: DuplicateMergeRule;
  readonly maxRows?: number;
  readonly fileName?: string;
  readonly mimeType?: string;
  readonly referenceDate?: Date;
}

/** Check if calendar date is valid (prevents e.g. 2026-02-31). */
export function isValidCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/** Row validation schema using Zod. */
export function createRowSchema(referenceDate: Date = new Date()) {
  const todayIso = referenceDate.toISOString().slice(0, 10);

  return z.object({
    date: z
      .string({ message: "Date is required" })
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .refine(isValidCalendarDate, { message: "Invalid calendar date" })
      .refine((d) => d <= todayIso, {
        message: "Future dates are not allowed",
      }),
    kwh: z
      .unknown()
      .refine(
        (val) => {
          if (val === null || val === undefined || val === "") return false;
          const num = Number(val);
          return !isNaN(num) && isFinite(num);
        },
        { message: "kWh must be a valid number" },
      )
      .transform((val) => Number(val))
      .refine((val) => val >= 0, { message: "kWh must be non-negative" }),
  });
}

/** Normalise headers to find date and kwh keys regardless of casing or whitespace. */
export function findHeaderKeys(row: Record<string, unknown>): {
  dateKey: string | null;
  kwhKey: string | null;
} {
  let dateKey: string | null = null;
  let kwhKey: string | null = null;

  for (const key of Object.keys(row)) {
    const normalised = key.trim().toLowerCase();
    if (normalised === "date") dateKey = key;
    else if (normalised === "kwh") kwhKey = key;
  }

  return { dateKey, kwhKey };
}

/**
 * Validate a single raw row dictionary.
 * Shared pure validation function used by both importService and Web Worker.
 */
export function validateRow(
  rawRow: Record<string, unknown>,
  rowNumber: number,
  headerKeys: { dateKey: string; kwhKey: string },
  spaceId: string = "default",
  referenceDate: Date = new Date(),
  cachedSchema?: ReturnType<typeof createRowSchema>,
): { success: true; reading: Reading } | { success: false; error: ImportError } {
  const schema = cachedSchema ?? createRowSchema(referenceDate);
  const parseResult = schema.safeParse({
    date: rawRow[headerKeys.dateKey],
    kwh: rawRow[headerKeys.kwhKey],
  });

  if (!parseResult.success) {
    const issue = parseResult.error.issues[0];
    return {
      success: false,
      error: {
        row: rowNumber,
        field: String(issue.path[0] ?? "unknown"),
        message: issue.message,
      },
    };
  }

  return {
    success: true,
    reading: {
      spaceId,
      date: parseResult.data.date,
      kwh: round2(parseResult.data.kwh),
    },
  };
}

/**
 * Deduplicate readings according to merge rule (default: "sum").
 *
 * Rule: Duplicate dates are merged by SUMMING their kWh values together,
 * and the count of merged duplicate rows is returned.
 */
export function deduplicateAndSortReadings(
  readings: readonly Reading[],
  mergeRule: DuplicateMergeRule = "sum",
): { readings: Reading[]; merged: number } {
  const map = new Map<string, { kwh: number; count: number; spaceId?: string }>();

  for (const r of readings) {
    const key = `${r.spaceId ?? "default"}:${r.date}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      if (mergeRule === "sum") {
        existing.kwh += r.kwh;
      } else if (mergeRule === "latest") {
        existing.kwh = r.kwh;
      } else if (mergeRule === "average") {
        existing.kwh = (existing.kwh * (existing.count - 1) + r.kwh) / existing.count;
      }
    } else {
      map.set(key, { kwh: r.kwh, count: 1, spaceId: r.spaceId });
    }
  }

  let mergedCount = 0;
  const result: Reading[] = [];

  for (const [key, data] of map.entries()) {
    if (data.count > 1) {
      mergedCount += data.count - 1;
    }
    const colonIdx = key.indexOf(":");
    const date = key.slice(colonIdx + 1);
    result.push({
      spaceId: data.spaceId,
      date,
      kwh: round2(data.kwh),
    });
  }

  // Sort chronologically ascending
  result.sort((a, b) => a.date.localeCompare(b.date));

  return { readings: result, merged: mergedCount };
}

/**
 * Parse and validate pre-parsed row objects.
 * Handles row-level validation, duplicate merging, errors, and stats.
 */
export function parseAndValidateCsv(
  rows: Record<string, string>[],
  spaceId: string = "default",
  mergeRule: DuplicateMergeRule = "sum",
  maxRows: number = MAX_CSV_ROWS,
  referenceDate: Date = new Date(),
): ImportResult {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const validReadings: Reading[] = [];

  if (!rows || rows.length === 0) {
    errors.push({ row: 0, field: "file", message: "CSV file is empty" });
    return {
      readings: [],
      warnings,
      errors,
      stats: { rows: 0, accepted: 0, rejected: 0, merged: 0 },
      totalRows: 0,
      validRows: 0,
      duplicatesHandled: 0,
    };
  }

  // Check required columns from the first row
  const headerKeys = findHeaderKeys(rows[0]);
  if (!headerKeys.dateKey || !headerKeys.kwhKey) {
    const foundHeaders = Object.keys(rows[0]).join(", ");
    errors.push({
      row: 0,
      field: "header",
      message: `CSV must have "date" and "kwh" columns. Found: ${foundHeaders || "none"}`,
    });
    return {
      readings: [],
      warnings,
      errors,
      stats: { rows: rows.length, accepted: 0, rejected: rows.length, merged: 0 },
      totalRows: rows.length,
      validRows: 0,
      duplicatesHandled: 0,
    };
  }

  // Cap at max rows
  if (rows.length > maxRows) {
    errors.push({
      row: 0,
      field: "file",
      message: `CSV has ${rows.length} rows, exceeding the maximum of ${maxRows}`,
    });
    return {
      readings: [],
      warnings,
      errors,
      stats: { rows: rows.length, accepted: 0, rejected: rows.length, merged: 0 },
      totalRows: rows.length,
      validRows: 0,
      duplicatesHandled: 0,
    };
  }

  const { dateKey, kwhKey } = headerKeys as { dateKey: string; kwhKey: string };
  const schema = createRowSchema(referenceDate);

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const rowResult = validateRow(
      raw,
      i + 2, // 1-indexed header is row 1, data starts at row 2
      { dateKey, kwhKey },
      spaceId,
      referenceDate,
      schema,
    );

    if (rowResult.success) {
      validReadings.push(rowResult.reading);
    } else {
      errors.push(rowResult.error);
    }
  }

  const { readings: deduped, merged } = deduplicateAndSortReadings(
    validReadings,
    mergeRule,
  );

  const stats: ImportStats = {
    rows: rows.length,
    accepted: validReadings.length,
    rejected: errors.length,
    merged,
  };

  return {
    readings: deduped,
    warnings,
    errors,
    stats,
    totalRows: stats.rows,
    validRows: deduped.length,
    duplicatesHandled: merged,
  };
}

/**
 * High-level parser that takes raw CSV text and optional metadata, validates file type,
 * runs PapaParse, and returns typed ImportResult with errors and stats.
 */
export function parseCsv(
  csvText: string,
  options?: ImportOptions,
): ImportResult {
  const spaceId = options?.spaceId ?? "default";
  const mergeRule = options?.mergeRule ?? "sum";
  const maxRows = options?.maxRows ?? MAX_CSV_ROWS;
  const referenceDate = options?.referenceDate ?? new Date();

  // Validate file type if fileName or mimeType is supplied
  if (options?.fileName) {
    const lower = options.fileName.toLowerCase();
    if (!lower.endsWith(".csv") && !lower.endsWith(".txt")) {
      return {
        readings: [],
        warnings: [],
        errors: [
          {
            row: 0,
            field: "file",
            message: "Invalid file type. Only CSV files are supported.",
          },
        ],
        stats: { rows: 0, accepted: 0, rejected: 0, merged: 0 },
        totalRows: 0,
        validRows: 0,
        duplicatesHandled: 0,
      };
    }
  }

  if (options?.mimeType) {
    const lowerMime = options.mimeType.toLowerCase();
    if (
      !lowerMime.includes("csv") &&
      !lowerMime.includes("text/plain") &&
      !lowerMime.includes("excel") &&
      !lowerMime.includes("octet-stream")
    ) {
      return {
        readings: [],
        warnings: [],
        errors: [
          {
            row: 0,
            field: "file",
            message: "Invalid MIME type. Only CSV files are supported.",
          },
        ],
        stats: { rows: 0, accepted: 0, rejected: 0, merged: 0 },
        totalRows: 0,
        validRows: 0,
        duplicatesHandled: 0,
      };
    }
  }

  if (!csvText || csvText.trim().length === 0) {
    return {
      readings: [],
      warnings: [],
      errors: [{ row: 0, field: "file", message: "CSV file is empty" }],
      stats: { rows: 0, accepted: 0, rejected: 0, merged: 0 },
      totalRows: 0,
      validRows: 0,
      duplicatesHandled: 0,
    };
  }

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    // If critical parse error
    const fatal = parsed.errors.find((e) => e.type === "Delimiter");
    if (fatal) {
      return {
        readings: [],
        warnings: [],
        errors: [{ row: 0, field: "file", message: fatal.message }],
        stats: { rows: 0, accepted: 0, rejected: 0, merged: 0 },
        totalRows: 0,
        validRows: 0,
        duplicatesHandled: 0,
      };
    }
  }

  return parseAndValidateCsv(
    parsed.data,
    spaceId,
    mergeRule,
    maxRows,
    referenceDate,
  );
}
