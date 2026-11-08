import { describe, expect, it } from "vitest";
import { DEFAULT_SOLAR_ASSUMPTIONS } from "@/lib/config";
import { estimateSolar, validateSolarInput } from "./solar";

describe("validateSolarInput", () => {
  it("accepts valid numeric strings", () => {
    expect(
      validateSolarInput({ monthlyBillInr: "4200", roofAreaSqFt: "2000" }),
    ).toEqual({
      ok: true,
      input: { monthlyBillInr: 4200, roofAreaSqFt: 2000 },
    });
  });

  it.each([
    ["0", "2000"],
    ["-1", "2000"],
    ["4200", "0"],
    ["4200", "-1"],
    [NaN, "2000"],
    ["NaN", "2000"],
    ["abc", "2000"],
    ["", "2000"],
    ["4200", ""],
    [Infinity, "2000"],
    ["4200", NaN],
    ["4200", Infinity],
  ])("rejects invalid bill %s or roof area %s", (monthlyBillInr, roofAreaSqFt) => {
    expect(validateSolarInput({ monthlyBillInr, roofAreaSqFt }).ok).toBe(false);
  });

  it("rejects bills and roof areas above the supported limits", () => {
    expect(
      validateSolarInput({ monthlyBillInr: 1_000_001, roofAreaSqFt: 2000 }),
    ).toEqual({
      ok: false,
      errors: ["Monthly electricity bill must be ₹1,000,000 or less."],
    });
    expect(
      validateSolarInput({ monthlyBillInr: 4200, roofAreaSqFt: 100_001 }),
    ).toEqual({
      ok: false,
      errors: ["Roof area must be 100,000 sq ft or less."],
    });
  });
});

describe("estimateSolar", () => {
  it("estimates bill-sized generation for a 5 kW rooftop system", () => {
    const estimate = estimateSolar(
      { monthlyBillInr: 4200, roofAreaSqFt: 2000 },
      DEFAULT_SOLAR_ASSUMPTIONS,
    );

    expect(estimate.monthlyConsumptionKwh).toBe(600);
    expect(estimate.requiredKw).toBe(5);
    expect(estimate.recommendedKw).toBe(5);
    expect(estimate.roofLimited).toBe(false);
    expect(estimate.offsetFraction).toBeCloseTo(1);
    expect(estimate.monthlySavingsInr).toBe(4200);
    expect(estimate.estimatedCostInr).toBe(5 * DEFAULT_SOLAR_ASSUMPTIONS.costPerKw);
    expect(estimate.monthlyCo2ReductionKg).toBe(492);
    expect(estimate.annualCo2ReductionKg).toBe(492 * 12);
    expect(estimate.paybackYears).toBeCloseTo(6, 0);
  });

  it("limits the recommendation when the roof area is small", () => {
    const estimate = estimateSolar(
      { monthlyBillInr: 4200, roofAreaSqFt: 200 },
      DEFAULT_SOLAR_ASSUMPTIONS,
    );

    expect(estimate.roofLimitKw).toBe(1.4);
    expect(estimate.roofLimited).toBe(true);
    expect(estimate.offsetFraction).toBeGreaterThan(0);
    expect(estimate.offsetFraction).toBeLessThan(1);
  });

  it("never estimates monthly savings above the bill", () => {
    const estimate = estimateSolar(
      { monthlyBillInr: 2500.6, roofAreaSqFt: 100_000 },
      DEFAULT_SOLAR_ASSUMPTIONS,
    );

    expect(estimate.monthlySavingsInr).toBeLessThanOrEqual(2500.6);
  });

  it("uses overridden assumptions", () => {
    const estimate = estimateSolar(
      { monthlyBillInr: 4200, roofAreaSqFt: 2000 },
      { ...DEFAULT_SOLAR_ASSUMPTIONS, tariffPerKwh: 6 },
    );

    expect(estimate.monthlyConsumptionKwh).toBe(700);
  });
});
