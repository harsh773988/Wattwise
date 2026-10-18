/**
 * CSV import service — parse, validate, and normalize electricity reading CSV data.
 * Uses zod for row-level validation and handles all edge cases.
 */

import { z } from "zod";
import type { Reading, DuplicateMergeRule } from "@/domain/types";

/** Zod schema for a single CSV row. */
const csvRowSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine(
      (d) => {
        const parsed = new Date(d + "T00:00:00Z");
        return !isNaN(parsed.getTime());
      },
      { message: "Invalid date" },
    )
    .refine(
      (d) => {
        const parsed = new Date(d + "T00:00:00Z");
        return parsed <= new Date();
      },
      { message: "Future dates are not allowed" },
    ),
  kwh: z
    .string()
    .or(z.number())
    .pipe(z.coerce.number())
    .refine((v) => !isNaN(v), { message: "kWh must be a number" })
    .refine((v) => v >= 0, { message: "kWh must be non-negative" })
    .refine((v) => v <= 1000, {
      message: "kWh value suspiciously high (>1000). Check your data.",
    }),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

export interface ImportResult {
  readonly readings: Reading[];
  readonly errors: ImportError[];
  readonly totalRows: number;
  readonly validRows: number;
  readonly duplicatesHandled: number;
}

export interface ImportError {
  readonly row: number;
  readonly field: string;
  readonly message: string;
}

/**
 * Parse and validate CSV text into readings.
 * Handles:
 * - Missing columns
 * - Empty files
 * - Invalid dates, negative kWh, non-numeric values
 * - Duplicate dates (merged according to the rule)
 * - Future dates (rejected)
 * - Huge files (validated row count)
 */
export function parseAndValidateCsv(
  rows: Record<string, string>[],
  spaceId: string,
  mergeRule: DuplicateMergeRule = "latest",
  maxRows: number = 200_000,
): ImportResult {
  const errors: ImportError[] = [];
  const validReadings: Reading[] = [];

  if (rows.length === 0) {
    errors.push({ row: 0, field: "file", message: "CSV file is empty" });
    return { readings: [], errors, totalRows: 0, validRows: 0, duplicatesHandled: 0 };
  }

  // Check required columns
  const firstRow = rows[0];
  const headers = Object.keys(firstRow).map((h) => h.trim().toLowerCase());
  if (!headers.includes("date") || !headers.includes("kwh")) {
    errors.push({
      row: 0,
      field: "header",
      message: `CSV must have "date" and "kwh" columns. Found: ${headers.join(", ")}`,
    });
    return { readings: [], errors, totalRows: rows.length, validRows: 0, duplicatesHandled: 0 };
  }

  if (rows.length > maxRows) {
    errors.push({
      row: 0,
      field: "file",
      message: `CSV has ${rows.length} rows, exceeding the maximum of ${maxRows}`,
    });
    return { readings: [], errors, totalRows: rows.length, validRows: 0, duplicatesHandled: 0 };
  }

  // Validate each row
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    // Normalise keys to lowercase
    const normalised: Record<string, string> = {};
    for (const key of Object.keys(raw)) {
      normalised[key.trim().toLowerCase()] = raw[key].trim();
    }

    const result = csvRowSchema.safeParse({
      date: normalised["date"],
      kwh: normalised["kwh"],
    });

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          row: i + 2, // +2 because row 1 is the header, and index is 0-based
          field: String(issue.path[0] ?? "unknown"),
          message: issue.message,
        });
      }
    } else {
      validReadings.push({
        spaceId,
        date: result.data.date,
        kwh: result.data.kwh,
      });
    }
  }

  // Handle duplicates
  const { readings: deduped, duplicatesHandled } = deduplicateReadings(
    validReadings,
    mergeRule,
  );

  return {
    readings: deduped,
    errors,
    totalRows: rows.length,
    validRows: deduped.length,
    duplicatesHandled,
  };
}

/**
 * Deduplicate readings by date, applying the merge rule.
 * - "latest": keep the last occurrence
 * - "sum": sum kWh values for the same date
 * - "average": average kWh values for the same date
 */
function deduplicateReadings(
  readings: Reading[],
  rule: DuplicateMergeRule,
): { readings: Reading[]; duplicatesHandled: number } {
  const byDate = new Map<
    string,
    { readings: Reading[]; spaceId: string }
  >();

  for (const r of readings) {
    const spaceId = r.spaceId ?? "default";
    const key = `${spaceId}:${r.date}`;
    const existing = byDate.get(key);
    if (existing) {
      existing.readings.push(r);
    } else {
      byDate.set(key, { readings: [r], spaceId });
    }
  }

  let duplicatesHandled = 0;
  const result: Reading[] = [];

  for (const [, entry] of byDate) {
    if (entry.readings.length > 1) {
      duplicatesHandled += entry.readings.length - 1;
    }
    const merged = mergeReadings(entry.readings, rule);
    result.push(merged);
  }

  // Sort by date ascending
  result.sort((a, b) => a.date.localeCompare(b.date));

  return { readings: result, duplicatesHandled };
}

function mergeReadings(
  readings: Reading[],
  rule: DuplicateMergeRule,
): Reading {
  if (readings.length === 1) return readings[0];

  const spaceId = readings[0].spaceId;
  const date = readings[0].date;

  switch (rule) {
    case "latest":
      return readings[readings.length - 1];
    case "sum":
      return {
        spaceId,
        date,
        kwh: round2(readings.reduce((s, r) => s + r.kwh, 0)),
      };
    case "average":
      return {
        spaceId,
        date,
        kwh: round2(
          readings.reduce((s, r) => s + r.kwh, 0) / readings.length,
        ),
      };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
