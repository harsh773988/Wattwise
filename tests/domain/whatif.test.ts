import { describe, it, expect } from "vitest";
import { projectSavings, PRESET_SCENARIOS } from "@/domain/whatif";
import type { Assumptions } from "@/domain/types";

const mockAssumptions: Assumptions = {
  tariffPerKwh: 7,
  emissionFactor: 0.82,
  spikeMultiplier: 1.5,
};

describe("domain/whatif", () => {
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
    expect(() => projectSavings("Invalid", -1, mockAssumptions)).toThrow(RangeError);
  });

  it("has valid preset scenarios with sensible limits", () => {
    expect(PRESET_SCENARIOS.length).toBeGreaterThan(0);
    for (const scenario of PRESET_SCENARIOS) {
      expect(scenario.min).toBeLessThan(scenario.max);
      expect(scenario.defaultDailyKwh).toBeGreaterThan(0);
    }
  });
});
