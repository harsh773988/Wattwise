import { describe, it, expect } from "vitest";
import { parseAndValidateCsv } from "@/services/importService";

describe("services/importService", () => {
  it("successfully parses valid CSV rows", () => {
    const rows = [
      { date: "2026-10-01", kwh: "6.5" },
      { date: "2026-10-02", kwh: "7.2" },
    ];
    const result = parseAndValidateCsv(rows, "space-1");

    expect(result.errors).toHaveLength(0);
    expect(result.validRows).toBe(2);
    expect(result.readings[0]).toEqual({
      spaceId: "space-1",
      date: "2026-10-01",
      kwh: 6.5,
    });
  });

  it("reports error when rows array is empty", () => {
    const result = parseAndValidateCsv([], "space-1");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain("empty");
  });

  it("rejects CSV missing required columns", () => {
    const rows = [{ timestamp: "2026-10-01", power: "6.5" }];
    const result = parseAndValidateCsv(rows, "space-1");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].field).toBe("header");
  });

  it("rejects negative or non-numeric kWh values", () => {
    const rows = [
      { date: "2026-10-01", kwh: "-5" },
      { date: "2026-10-02", kwh: "abc" },
    ];
    const result = parseAndValidateCsv(rows, "space-1");
    expect(result.errors.length).toBe(2);
    expect(result.validRows).toBe(0);
  });

  it("rejects future dates", () => {
    const futureYear = new Date().getFullYear() + 2;
    const rows = [{ date: `${futureYear}-01-01`, kwh: "5" }];
    const result = parseAndValidateCsv(rows, "space-1");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain("Future dates");
  });

  it("handles duplicate dates using latest merge rule (default)", () => {
    const rows = [
      { date: "2026-10-01", kwh: "5.0" },
      { date: "2026-10-01", kwh: "8.0" },
    ];
    const result = parseAndValidateCsv(rows, "space-1", "latest");
    expect(result.validRows).toBe(1);
    expect(result.duplicatesHandled).toBe(1);
    expect(result.readings[0].kwh).toBe(8.0);
  });

  it("handles duplicate dates using sum merge rule", () => {
    const rows = [
      { date: "2026-10-01", kwh: "5.0" },
      { date: "2026-10-01", kwh: "8.0" },
    ];
    const result = parseAndValidateCsv(rows, "space-1", "sum");
    expect(result.validRows).toBe(1);
    expect(result.readings[0].kwh).toBe(13.0);
  });

  it("handles duplicate dates using average merge rule", () => {
    const rows = [
      { date: "2026-10-01", kwh: "4.0" },
      { date: "2026-10-01", kwh: "8.0" },
    ];
    const result = parseAndValidateCsv(rows, "space-1", "average");
    expect(result.validRows).toBe(1);
    expect(result.readings[0].kwh).toBe(6.0);
  });

  it("enforces max row limits", () => {
    const rows = [
      { date: "2026-10-01", kwh: "5.0" },
      { date: "2026-10-02", kwh: "5.0" },
      { date: "2026-10-03", kwh: "5.0" },
    ];
    const result = parseAndValidateCsv(rows, "space-1", "latest", 2);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain("exceeding the maximum");
  });
});
