import { describe, it, expect } from "vitest";
import {
  projectDeviceHabitSavings,
  projectHabitSavings,
  projectHabitChange,
  projectSavings,
  PRESET_SCENARIOS,
  DEFAULT_DAYS_PER_MONTH,
} from "@/domain/whatif";
import type { Assumptions } from "@/domain/types";

const mockAssumptions: Assumptions = {
  tariffPerKwh: 7,
  emissionFactor: 0.82,
  spikeMultiplier: 1.5,
};

describe("domain/whatif", () => {
  describe("projectDeviceHabitSavings & projectHabitSavings", () => {
    it("projects monthly kWh, Rupees, and CO2 savings accurately for a device habit change", () => {
      // 1500W device used 2 hours less per day:
      // Daily savings: (1500 * 2) / 1000 = 3 kWh/day
      // Monthly savings (30 days): 3 * 30 = 90 kWh
      // Monthly rupees: 90 * 7 = ₹630
      // Monthly CO2: 90 * 0.82 = 73.8 kg
      const result = projectDeviceHabitSavings(1500, 2, 7, 0.82);

      expect(result.scenarioLabel).toBe("1500W device reduced by 2h/day");
      expect(result.dailySavingsKwh).toBe(3);
      expect(result.monthlySavingsKwh).toBe(90);
      expect(result.monthlySavingsRupees).toBe(630);
      expect(result.monthlySavingsCo2Kg).toBe(73.8);

      // Verify alias
      const aliasResult = projectHabitSavings(1500, 2, 7, 0.82);
      expect(aliasResult).toEqual(result);
    });

    it("supports custom daysPerMonth parameter", () => {
      // 1000W used 1 hr less per day for 31 days
      const result = projectDeviceHabitSavings(1000, 1, 7, 0.82, 31);
      expect(result.dailySavingsKwh).toBe(1);
      expect(result.monthlySavingsKwh).toBe(31);
      expect(result.monthlySavingsRupees).toBe(217);
    });

    it("handles zero wattage or zero hours reduced", () => {
      const zeroWatts = projectDeviceHabitSavings(0, 5, 7, 0.82);
      expect(zeroWatts.dailySavingsKwh).toBe(0);
      expect(zeroWatts.monthlySavingsKwh).toBe(0);
      expect(zeroWatts.monthlySavingsRupees).toBe(0);
      expect(zeroWatts.monthlySavingsCo2Kg).toBe(0);

      const zeroHours = projectDeviceHabitSavings(1500, 0, 7, 0.82);
      expect(zeroHours.dailySavingsKwh).toBe(0);
      expect(zeroHours.monthlySavingsKwh).toBe(0);
      expect(zeroHours.monthlySavingsRupees).toBe(0);
    });

    it("allows max boundary of 24 hours per day", () => {
      const result = projectDeviceHabitSavings(100, 24, 7, 0.82);
      expect(result.dailySavingsKwh).toBe(2.4);
      expect(result.monthlySavingsKwh).toBe(72);
    });

    it("throws RangeError for invalid device parameters", () => {
      // Negative watts
      expect(() => projectDeviceHabitSavings(-500, 2, 7, 0.82)).toThrow(
        RangeError,
      );
      // Negative hours
      expect(() => projectDeviceHabitSavings(500, -1, 7, 0.82)).toThrow(
        RangeError,
      );
      // Hours exceeding 24
      expect(() => projectDeviceHabitSavings(500, 25, 7, 0.82)).toThrow(
        RangeError,
      );
      // Negative tariff
      expect(() => projectDeviceHabitSavings(500, 2, -7, 0.82)).toThrow(
        RangeError,
      );
      // Negative emission factor
      expect(() => projectDeviceHabitSavings(500, 2, 7, -0.82)).toThrow(
        RangeError,
      );
      // Non-positive days in month
      expect(() => projectDeviceHabitSavings(500, 2, 7, 0.82, 0)).toThrow(
        RangeError,
      );
      expect(() => projectDeviceHabitSavings(500, 2, 7, 0.82, -30)).toThrow(
        RangeError,
      );
    });

    it("mitigates floating point inaccuracies", () => {
      const result = projectDeviceHabitSavings(333, 1.33, 7.5, 0.82);
      expect(result.dailySavingsKwh).toBe(0.44);
      expect(typeof result.monthlySavingsKwh).toBe("number");
      expect(typeof result.monthlySavingsRupees).toBe("number");
      expect(typeof result.monthlySavingsCo2Kg).toBe("number");
    });
  });

  describe("projectHabitChange", () => {
    it("delegates to projectDeviceHabitSavings using assumptions object", () => {
      const result = projectHabitChange(2000, 1.5, mockAssumptions);
      expect(result.dailySavingsKwh).toBe(3);
      expect(result.monthlySavingsKwh).toBe(90);
      expect(result.monthlySavingsRupees).toBe(630);
      expect(result.monthlySavingsCo2Kg).toBe(73.8);
    });
  });

  describe("projectSavings", () => {
    it("projects monthly kWh, Rupees, and CO2 savings accurately", () => {
      // 1.5 kWh per day * 30 days = 45 kWh monthly
      // 45 kWh * 7 Rs = 315 Rs
      // 45 kWh * 0.82 kg = 36.9 kg CO2
      const result = projectSavings("AC 1 hour less", 1.5, mockAssumptions);

      expect(result.dailySavingsKwh).toBe(1.5);
      expect(result.monthlySavingsKwh).toBe(45);
      expect(result.monthlySavingsRupees).toBe(315);
      expect(result.monthlySavingsCo2Kg).toBe(36.9);
    });

    it("handles zero savings without error", () => {
      const result = projectSavings("No change", 0, mockAssumptions);
      expect(result.monthlySavingsKwh).toBe(0);
      expect(result.monthlySavingsRupees).toBe(0);
      expect(result.monthlySavingsCo2Kg).toBe(0);
    });

    it("throws RangeError for negative daily savings", () => {
      expect(() => projectSavings("Invalid", -1, mockAssumptions)).toThrow(
        RangeError,
      );
    });

    it("throws RangeError for invalid daysPerMonth", () => {
      expect(() => projectSavings("Invalid", 1, mockAssumptions, 0)).toThrow(
        RangeError,
      );
      expect(() => projectSavings("Invalid", 1, mockAssumptions, -10)).toThrow(
        RangeError,
      );
    });
  });

  describe("PRESET_SCENARIOS and constants", () => {
    it("has valid default days per month", () => {
      expect(DEFAULT_DAYS_PER_MONTH).toBe(30);
    });

    it("has valid preset scenarios with sensible limits", () => {
      expect(PRESET_SCENARIOS.length).toBeGreaterThan(0);
      for (const scenario of PRESET_SCENARIOS) {
        expect(scenario.label).toBeDefined();
        expect(scenario.unit).toBeDefined();
        expect(scenario.min).toBeLessThan(scenario.max);
        expect(scenario.defaultDailyKwh).toBeGreaterThan(0);
        expect(scenario.step).toBeGreaterThan(0);
      }
    });
  });
});
