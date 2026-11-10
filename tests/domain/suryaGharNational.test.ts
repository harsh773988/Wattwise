import { describe, expect, it } from "vitest";
import {
  calculateCentralSubsidy,
  calculateSuryaGharPlan,
  getStateSolarPolicy,
  STATE_SOLAR_POLICIES,
} from "../../src/domain/suryaGharNational";

describe("suryaGharNational domain module", () => {
  describe("calculateCentralSubsidy", () => {
    it("returns 0 for non-positive kw", () => {
      expect(calculateCentralSubsidy(0)).toBe(0);
      expect(calculateCentralSubsidy(-1)).toBe(0);
    });

    it("calculates exact subsidy for 1 kW and 2 kW", () => {
      expect(calculateCentralSubsidy(1)).toBe(30000);
      expect(calculateCentralSubsidy(1.5)).toBe(45000);
      expect(calculateCentralSubsidy(2)).toBe(60000);
      expect(calculateCentralSubsidy(0.5)).toBe(15000);
      expect(calculateCentralSubsidy(2.5)).toBe(69000);
    });

    it("caps central subsidy at ₹78,000 for 3 kW and above", () => {
      expect(calculateCentralSubsidy(3)).toBe(78000);
      expect(calculateCentralSubsidy(5)).toBe(78000);
      expect(calculateCentralSubsidy(10)).toBe(78000);
    });

    it("rejects non-finite system capacities", () => {
      expect(() => calculateCentralSubsidy(Number.NaN)).toThrow(RangeError);
      expect(() => calculateCentralSubsidy(Number.POSITIVE_INFINITY)).toThrow(
        RangeError
      );
    });
  });

  describe("calculateSuryaGharPlan", () => {
    it("produces valid plan for standard urban household", () => {
      const plan = calculateSuryaGharPlan({
        monthlyBillInr: 3000,
        roofAreaSqFt: 500,
        stateCode: "GJ",
      });

      expect(plan.stateCode).toBe("GJ");
      expect(plan.recommendedSystemKw).toBeGreaterThanOrEqual(1);
      expect(plan.centralSubsidyInr).toBeGreaterThan(0);
      expect(plan.netCustomerCostInr).toBeLessThan(plan.grossCostInr);
      expect(plan.paybackYears).toBeGreaterThan(0);
      expect(plan.paybackYears).toBeLessThan(15);
      expect(plan.treesEquivalent).toBeGreaterThan(0);
      expect(plan.net25YearSavingsInr).toBeGreaterThan(0);
      expect(plan.yearlyProjections).toHaveLength(25);
      expect(plan.yearlyProjections[11].inverterReplacementCostInr).toBeGreaterThan(0);
      expect(plan.yearlyProjections[24].cumulativeNetSavingsInr).toBe(
        plan.net25YearSavingsInr
      );
      expect(plan.recommendedSystemKw).toBeLessThanOrEqual(plan.roofLimitKw);
    });

    it("does not treat an unverified Delhi incentive as an upfront subsidy", () => {
      const plan = calculateSuryaGharPlan({
        monthlyBillInr: 4000,
        roofAreaSqFt: 600,
        stateCode: "DL",
      });

      expect(plan.stateCode).toBe("DL");
      expect(plan.stateSubsidyInr).toBe(0);
      expect(plan.totalSubsidyInr).toBe(
        plan.centralSubsidyInr + plan.stateSubsidyInr
      );
      expect(plan.stateSubsidyStatus).toBe("unverified");
    });

    it("applies the Uttar Pradesh top-up as a flat ₹15,000", () => {
      const plan = calculateSuryaGharPlan({
        monthlyBillInr: 4000,
        roofAreaSqFt: 600,
        stateCode: "UP",
      });

      expect(plan.stateSubsidyInr).toBe(15000);
      expect(plan.stateSubsidyStatus).toBe("included");
    });

    it("excludes the unverified Gujarat top-up and exposes export revenue", () => {
      const plan = calculateSuryaGharPlan({
        monthlyBillInr: 1200,
        roofAreaSqFt: 2000,
        stateCode: "GJ",
      });

      expect(plan.stateSubsidyInr).toBe(0);
      expect(plan.stateSubsidyStatus).toBe("unverified");
      expect(plan.netMeteringExportRateInr).toBe(2.25);
      expect(plan.monthlyExportRevenueInr).toBeGreaterThan(0);
      expect(plan.annualExportRevenueInr).toBe(
        plan.monthlyExportRevenueInr * 12
      );
    });

    it("uses the requested regional insolation assumptions", () => {
      expect(getStateSolarPolicy("GJ").solarHoursPerDay).toBe(5.5);
      expect(getStateSolarPolicy("KA").solarHoursPerDay).toBe(5);
      expect(getStateSolarPolicy("DL").solarHoursPerDay).toBe(4.6);
      expect(getStateSolarPolicy("WB").solarHoursPerDay).toBe(4.2);
      expect(getStateSolarPolicy("unknown").stateCode).toBe("PAN_INDIA");
    });

    it("lists all 28 states and 8 union territories without duplicate codes", () => {
      const statePolicies = STATE_SOLAR_POLICIES.filter(
        (policy) => policy.stateCode !== "PAN_INDIA"
      );
      expect(statePolicies).toHaveLength(36);
      expect(new Set(statePolicies.map((policy) => policy.stateCode)).size).toBe(36);
      expect(statePolicies.some((policy) => policy.stateCode === "LA")).toBe(true);
      expect(statePolicies.some((policy) => policy.stateCode === "DN")).toBe(true);
    });

    it("flags roof constrained homes with tiny roof area", () => {
      const plan = calculateSuryaGharPlan({
        monthlyBillInr: 10000,
        roofAreaSqFt: 100, // only ~70 sq ft usable -> ~0.7 kW limit
        stateCode: "PAN_INDIA",
      });

      expect(plan.isRoofConstrained).toBe(true);
      expect(plan.recommendedSystemKw).toBeLessThanOrEqual(plan.roofLimitKw);
      expect(plan.recommendedSystemKw).toBe(0.5);
    });

    it("returns no payback period when roof area cannot support a modeled system", () => {
      const plan = calculateSuryaGharPlan({
        monthlyBillInr: 1000,
        roofAreaSqFt: 1,
        stateCode: "PAN_INDIA",
      });

      expect(plan.recommendedSystemKw).toBe(0);
      expect(plan.annualSavingsInr).toBe(0);
      expect(plan.paybackYears).toBeNull();
      expect(plan.net25YearSavingsInr).toBe(0);
      expect(
        plan.yearlyProjections.every(
          (projection) => projection.inverterReplacementCostInr === 0
        )
      ).toBe(true);
    });

    it("throws RangeError on invalid input", () => {
      expect(() =>
        calculateSuryaGharPlan({ monthlyBillInr: -500, roofAreaSqFt: 300 })
      ).toThrow(RangeError);
      expect(() =>
        calculateSuryaGharPlan({ monthlyBillInr: Number.NaN, roofAreaSqFt: 300 })
      ).toThrow(RangeError);
      expect(() =>
        calculateSuryaGharPlan({ monthlyBillInr: 3000, roofAreaSqFt: 0 })
      ).toThrow(RangeError);
      expect(() =>
        calculateSuryaGharPlan({
          monthlyBillInr: 3000,
          roofAreaSqFt: Number.POSITIVE_INFINITY,
        })
      ).toThrow(RangeError);
    });
  });
});
