import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  parseAndValidateCsv,
  parseCsv,
  isValidCalendarDate,
} from "@/services/importService";
import { parseCsvWithWorker } from "@/infra/csvWorker";

const TEST_NOW = new Date("2026-10-18T12:00:00Z");

describe("services/importService", () => {
  describe("isValidCalendarDate", () => {
    it("validates real calendar dates", () => {
      expect(isValidCalendarDate("2026-01-15")).toBe(true);
      expect(isValidCalendarDate("2024-02-29")).toBe(true); // leap year
      expect(isValidCalendarDate("2026-02-29")).toBe(false); // non-leap year
      expect(isValidCalendarDate("2026-04-31")).toBe(false); // April has 30 days
      expect(isValidCalendarDate("invalid-date")).toBe(false);
    });
  });

  describe("parseCsv and parseAndValidateCsv", () => {
    it("successfully parses valid CSV string with typed stats", () => {
      const csv = `date,kwh\n2026-10-01,6.5\n2026-10-02,7.2`;
      const result = parseCsv(csv, { referenceDate: TEST_NOW });

      expect(result.errors).toHaveLength(0);
      expect(result.readings).toHaveLength(2);
      expect(result.stats.rows).toBe(2);
      expect(result.stats.accepted).toBe(2);
      expect(result.stats.rejected).toBe(0);
      expect(result.stats.merged).toBe(0);
      expect(result.readings[0]).toEqual({
        spaceId: "default",
        date: "2026-10-01",
        kwh: 6.5,
      });
    });

    it("handles sample_data.csv from project root correctly", () => {
      const samplePath = path.resolve(process.cwd(), "sample_data.csv");
      const sampleContent = fs.readFileSync(samplePath, "utf-8");

      const result = parseCsv(sampleContent, {
        spaceId: "home",
        referenceDate: TEST_NOW,
      });

      expect(result.errors).toHaveLength(0);
      expect(result.readings).toHaveLength(30);
      expect(result.stats.rows).toBe(30);
      expect(result.stats.accepted).toBe(30);
      expect(result.stats.merged).toBe(0);
      expect(result.readings[0].spaceId).toBe("home");
      expect(result.readings[0].date).toBe("2026-09-18");
      expect(result.readings[29].date).toBe("2026-10-17");
    });

    it("rejects empty file or whitespace only", () => {
      const emptyResult = parseCsv("");
      expect(emptyResult.errors).toHaveLength(1);
      expect(emptyResult.errors[0].message).toContain("empty");

      const whitespaceResult = parseCsv("   \n   \n");
      expect(whitespaceResult.errors).toHaveLength(1);
      expect(whitespaceResult.errors[0].message).toContain("empty");

      const emptyRowsResult = parseAndValidateCsv([]);
      expect(emptyRowsResult.errors).toHaveLength(1);
    });

    it("rejects header-only CSV with no data rows", () => {
      const headerOnly = `date,kwh\n`;
      const result = parseCsv(headerOnly);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.readings).toHaveLength(0);
    });

    it("rejects wrong headers missing date or kwh", () => {
      const wrongHeaders = `timestamp,power\n2026-10-01,5.5`;
      const result = parseCsv(wrongHeaders);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe("header");
      expect(result.errors[0].message).toContain("CSV must have");
    });

    it("accepts mixed-case headers with surrounding whitespace", () => {
      const mixedHeaders = `  DaTe  ,   KWH   \n2026-10-01, 8.4 `;
      const result = parseCsv(mixedHeaders, { referenceDate: TEST_NOW });
      expect(result.errors).toHaveLength(0);
      expect(result.readings).toHaveLength(1);
      expect(result.readings[0].kwh).toBe(8.4);
    });

    it("rejects negative or NaN / non-numeric kWh values with clear row errors", () => {
      const invalidKwh = `date,kwh\n2026-10-01,-5.5\n2026-10-02,abc\n2026-10-03,10.0`;
      const result = parseCsv(invalidKwh, { referenceDate: TEST_NOW });

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[0].message).toContain("non-negative");
      expect(result.errors[1].row).toBe(3);
      expect(result.errors[1].message).toContain("valid number");

      // 1 valid row accepted
      expect(result.readings).toHaveLength(1);
      expect(result.stats.rows).toBe(3);
      expect(result.stats.accepted).toBe(1);
      expect(result.stats.rejected).toBe(2);
    });

    it("rejects invalid calendar dates and malformed date strings", () => {
      const badDates = `date,kwh\n2026-02-31,5.0\nnot-a-date,6.0\n2026-13-01,7.0`;
      const result = parseCsv(badDates, { referenceDate: TEST_NOW });

      expect(result.errors).toHaveLength(3);
      expect(result.errors[0].message).toContain("calendar date");
      expect(result.errors[1].message).toContain("YYYY-MM-DD");
      expect(result.errors[2].message).toContain("calendar date");
    });

    it("rejects future dates relative to referenceDate", () => {
      const futureCsv = `date,kwh\n2026-10-18,5.0\n2026-10-19,6.0`;
      const result = parseCsv(futureCsv, { referenceDate: TEST_NOW });

      // 2026-10-18 is accepted (today), 2026-10-19 is rejected (future)
      expect(result.readings).toHaveLength(1);
      expect(result.readings[0].date).toBe("2026-10-18");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(3);
      expect(result.errors[0].message).toContain("Future dates are not allowed");
    });

    it("merges duplicate dates by summing kWh and reports merged count", () => {
      const duplicatesCsv = `date,kwh\n2026-10-01,4.5\n2026-10-01,5.5\n2026-10-01,2.0\n2026-10-02,8.0`;
      const result = parseCsv(duplicatesCsv, { referenceDate: TEST_NOW });

      expect(result.readings).toHaveLength(2);
      expect(result.stats.rows).toBe(4);
      expect(result.stats.accepted).toBe(4);
      expect(result.stats.merged).toBe(2); // 3 occurrences of 2026-10-01 = 2 merged duplicates
      expect(result.readings[0].date).toBe("2026-10-01");
      expect(result.readings[0].kwh).toBe(12.0); // 4.5 + 5.5 + 2.0
      expect(result.readings[1].date).toBe("2026-10-02");
      expect(result.readings[1].kwh).toBe(8.0);
    });

    it("supports latest merge rule for duplicate dates", () => {
      const csv = `date,kwh\n2026-10-01,4.0\n2026-10-01,9.0`;
      const result = parseCsv(csv, { mergeRule: "latest", referenceDate: TEST_NOW });
      expect(result.readings).toHaveLength(1);
      expect(result.readings[0].kwh).toBe(9.0);
    });

    it("supports average merge rule for duplicate dates", () => {
      const csv = `date,kwh\n2026-10-01,4.0\n2026-10-01,8.0`;
      const result = parseCsv(csv, { mergeRule: "average", referenceDate: TEST_NOW });
      expect(result.readings).toHaveLength(1);
      expect(result.readings[0].kwh).toBe(6.0);
    });

    it("sorts unsorted CSV rows chronologically ascending", () => {
      const unsorted = `date,kwh\n2026-10-05,5\n2026-10-01,1\n2026-10-03,3\n2026-10-02,2`;
      const result = parseCsv(unsorted, { referenceDate: TEST_NOW });

      expect(result.readings.map((r) => r.date)).toEqual([
        "2026-10-01",
        "2026-10-02",
        "2026-10-03",
        "2026-10-05",
      ]);
    });

    it("rejects unsupported file extensions or mime types", () => {
      const pngResult = parseCsv("date,kwh\n2026-10-01,5", {
        fileName: "bill.png",
      });
      expect(pngResult.errors[0].message).toContain("Only CSV files are supported");

      const mimeResult = parseCsv("date,kwh\n2026-10-01,5", {
        mimeType: "image/png",
      });
      expect(mimeResult.errors[0].message).toContain("Only CSV files are supported");
    });

    it("enforces maximum row threshold", () => {
      const rows = [
        { date: "2026-10-01", kwh: "5" },
        { date: "2026-10-02", kwh: "5" },
        { date: "2026-10-03", kwh: "5" },
      ];
      const result = parseAndValidateCsv(rows, "default", "sum", 2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("exceeding the maximum of 2");
    });

    it("handles very large input (100,000 rows) efficiently and correctly", () => {
      const rows: Record<string, string>[] = [];
      // Generate 100k rows: 100 dates with 1000 duplicate reads of 0.1 kWh each
      for (let i = 0; i < 100_000; i++) {
        const day = (i % 20) + 1;
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        rows.push({
          date: `2026-09-${dayStr}`,
          kwh: "0.1",
        });
      }

      const start = Date.now();
      const result = parseAndValidateCsv(rows, "space-1", "sum", 150_000, TEST_NOW);
      const elapsed = Date.now() - start;

      expect(result.stats.rows).toBe(100_000);
      expect(result.stats.accepted).toBe(100_000);
      expect(result.stats.rejected).toBe(0);
      expect(result.readings).toHaveLength(20);
      expect(result.stats.merged).toBe(99_980); // 100,000 - 20
      // 5,000 duplicate entries of 0.1 kWh per day = 500 kWh per day
      expect(result.readings[0].kwh).toBe(500);
      expect(elapsed).toBeLessThan(3000); // must process within 3s
    });
  });

  describe("parseCsvWithWorker streaming parser", () => {
    it("streams CSV parsing and notifies progress events", async () => {
      const lines = ["date,kwh"];
      const baseDate = new Date("2026-08-01T00:00:00Z");
      for (let i = 0; i < 50; i++) {
        const d = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
        lines.push(`${d.toISOString().slice(0, 10)},${i + 1}`);
      }
      const csv = lines.join("\n");

      let progressCalled = false;
      const result = await parseCsvWithWorker(
        csv,
        (p) => {
          progressCalled = true;
          expect(p.percentage).toBeGreaterThanOrEqual(0);
          expect(p.percentage).toBeLessThanOrEqual(100);
        },
        { referenceDate: TEST_NOW },
      );

      expect(progressCalled).toBe(true);
      expect(result.readings).toHaveLength(50);
      expect(result.errors).toHaveLength(0);
    });
  });
});
