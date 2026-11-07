import { describe, expect, it } from "vitest";
import {
  DEFAULT_SOLAR_ASSUMPTIONS,
  estimateSolar,
  validateSolarInput,
} from "./solar";

describe("validateSolarInput", () => {
  it("accepts valid numeric strings", () => {
    const r = validateSolarInput({ monthlyBillInr: "3000", roofAreaSqFt: "500" });
    expect(r.ok).toBe(true);
  });

  it.each([
    [0, 500],
    [-10, 500],
    [3000, 0],
    [3000, -5],
    [NaN, 500],
    ["abc", 500],
    [3000, Infinity],
  ])("rejects bill=%s roof=%s", (bill, roof) => {
    const r = validateSolarInput({ monthlyBillInr: bill, roofAreaSqFt: roof });
    expect(r.ok).toBe(false);
  });

  it("rejects absurdly large values", () => {
    expect(
      validateSolarInput({ monthlyBillInr: 5_000_000, roofAreaSqFt: 500 }).ok,
    ).toBe(false);
    expect(
      validateSolarInput({ monthlyBillInr: 3000, roofAreaSqFt: 500_000 }).ok,
    ).toBe(false);
  });
});

describe("estimateSolar", () => {
  it("sizes system from bill when roof is large enough", () => {
    // ₹4200 / ₹7 = 600 kWh/month; 600 / (4*30) = 5 kW
    const e = estimateSolar({ monthlyBillInr: 4200, roofAreaSqFt: 2000 });
    expect(e.monthlyConsumptionKwh).toBe(600);
    expect(e.requiredKw).toBe(5);
    expect(e.recommendedKw).toBe(5);
    expect(e.roofLimited).toBe(false);
    expect(e.offsetFraction).toBeCloseTo(1, 5);
    expect(e.monthlySavingsInr).toBe(4200);
    expect(e.estimatedCostInr).toBe(5 * DEFAULT_SOLAR_ASSUMPTIONS.costPerKw);
  });

  it("caps capacity by usable roof area", () => {
    // 200 sq ft * 0.7 / 100 = 1.4 kW max
    const e = estimateSolar({ monthlyBillInr: 4200, roofAreaSqFt: 200 });
    expect(e.roofLimitKw).toBe(1.4);
    expect(e.recommendedKw).toBe(1.4);
    expect(e.roofLimited).toBe(true);
    expect(e.offsetFraction).toBeLessThan(1);
    expect(e.offsetFraction).toBeGreaterThan(0);
  });

  it("never reports savings above the bill", () => {
    const e = estimateSolar({ monthlyBillInr: 1000, roofAreaSqFt: 5000 });
    expect(e.monthlySavingsInr).toBeLessThanOrEqual(1000);
  });

  it("computes CO2 from the emission factor", () => {
    const e = estimateSolar({ monthlyBillInr: 4200, roofAreaSqFt: 2000 });
    // 600 kWh * 0.82 = 492 kg/month
    expect(e.monthlyCo2ReductionKg).toBe(492);
    expect(e.annualCo2ReductionKg).toBe(492 * 12);
  });

  it("computes simple payback in years", () => {
    const e = estimateSolar({ monthlyBillInr: 4200, roofAreaSqFt: 2000 });
    // cost 300000 / annual savings 50400 ≈ 6.0
    expect(e.paybackYears).toBeCloseTo(6, 0);
  });

  it("honours assumption overrides", () => {
    const e = estimateSolar(
      { monthlyBillInr: 4200, roofAreaSqFt: 2000 },
      { tariffPerKwh: 6 },
    );
    expect(e.monthlyConsumptionKwh).toBe(700);
  });
});
