import { describe, expect, it } from "vitest";
import { analyze24HourTelemetry } from "../../src/domain/smartMeterTelemetry";

describe("smartMeterTelemetry domain module", () => {
  it("synthesizes exactly 24 hourly data points", () => {
    const analysis = analyze24HourTelemetry(12.0);
    expect(analysis.points.length).toBe(24);
    for (let h = 0; h < 24; h++) {
      expect(analysis.points[h].hour).toBe(h);
      expect(analysis.points[h].demandKw).toBeGreaterThan(0);
      expect(analysis.points[h].timeLabel).toBe(`${h.toString().padStart(2, "0")}:00`);
    }
  });

  it("identifies evening peak hours and assigns peak surcharge", () => {
    const analysis = analyze24HourTelemetry(15.0);
    expect(analysis.peakHoursKwh).toBeGreaterThan(0);
    // Peak demand hour should fall in the evening (between 18:00 and 22:00)
    expect(analysis.peakDemandHour).toBeGreaterThanOrEqual(18);
    expect(analysis.peakDemandHour).toBeLessThanOrEqual(22);
  });

  it("calculates vampire standby load and potential savings", () => {
    const analysis = analyze24HourTelemetry(10.0, 7.0);
    expect(analysis.baseLoadKw).toBeGreaterThan(0);
    expect(analysis.dailyVampireKwh).toBeGreaterThan(0);
    expect(analysis.potentialSavingsInrByKillingVampire).toBeGreaterThan(0);
  });

  it("reduces net grid draw when rooftop solar is active", () => {
    const withoutSolar = analyze24HourTelemetry(15.0, 6.8, false);
    const withSolar = analyze24HourTelemetry(15.0, 6.8, true);

    expect(withSolar.totalKwh).toBeLessThan(withoutSolar.totalKwh);
    expect(withSolar.totalEstimatedCostInr).toBeLessThan(withoutSolar.totalEstimatedCostInr);
  });

  it("throws RangeError for invalid daily kWh", () => {
    expect(() => analyze24HourTelemetry(-5)).toThrow(RangeError);
    expect(() => analyze24HourTelemetry(0)).toThrow(RangeError);
    expect(() => analyze24HourTelemetry(NaN)).toThrow(RangeError);
  });
});

