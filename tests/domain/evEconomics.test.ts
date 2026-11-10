import { describe, expect, it } from "vitest";
import {
  calculateEvEconomics,
  POPULAR_INDIAN_EV_PRESETS,
} from "../../src/domain/evEconomics";

describe("evEconomics domain module", () => {
  it("calculates realistic cost savings for Indian 2-wheeler EV vs petrol", () => {
    const twoWheeler = POPULAR_INDIAN_EV_PRESETS.find((p) => p.type === "two_wheeler")!;
    const res = calculateEvEconomics(30, twoWheeler, 103.5, 6.8);

    // EV charging cost per km should be under ₹0.50/km, petrol is ~₹2.30/km
    expect(res.costPerKmEvInr).toBeLessThan(1.0);
    expect(res.costPerKmPetrolInr).toBeGreaterThan(2.0);
    expect(res.monthlySavingsInr).toBeGreaterThan(1000);
    expect(res.annualSavingsInr).toBeGreaterThan(12000);
    expect(res.annualCo2AvoidedKg).toBeGreaterThan(100);
  });

  it("calculates 4-wheeler EV economics accurately", () => {
    const fourWheeler = POPULAR_INDIAN_EV_PRESETS.find((p) => p.type === "four_wheeler")!;
    const res = calculateEvEconomics(40, fourWheeler, 103.5, 6.8);

    expect(res.monthlySavingsInr).toBeGreaterThan(4000);
    expect(res.solarChargingAnnualSavingsInr).toBeGreaterThan(res.annualSavingsInr);
  });

  it("throws RangeError for invalid daily distance", () => {
    expect(() => calculateEvEconomics(-10)).toThrow(RangeError);
    expect(() => calculateEvEconomics(0)).toThrow(RangeError);
    expect(() => calculateEvEconomics(NaN)).toThrow(RangeError);
  });
});

