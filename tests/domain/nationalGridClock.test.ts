import { describe, expect, it } from "vitest";
import {
  calculateApplianceShiftSavings,
  CEA_CARBON_INTENSITY,
  getGridClockStatus,
  SHIFTABLE_APPLIANCES,
} from "../../src/domain/nationalGridClock";

describe("nationalGridClock domain module", () => {
  it("identifies Green Solar Hours correctly between 10:00 and 16:00 IST", () => {
    const statusAtNoon = getGridClockStatus(12, 0);
    expect(statusAtNoon.stressLevel).toBe("green_solar");
    expect(statusAtNoon.isSolarWindow).toBe(true);
    expect(statusAtNoon.isPeakStress).toBe(false);
    expect(statusAtNoon.currentCarbonIntensityKgPerKwh).toBe(
      CEA_CARBON_INTENSITY.SOLAR_WINDOW_CLEAN
    );
    expect(statusAtNoon.minutesUntilNextSolarWindow).toBe(0);
  });

  it("identifies Evening Peak correctly between 18:00 and 22:00 IST", () => {
    const statusAt8Pm = getGridClockStatus(20, 30);
    expect(statusAt8Pm.stressLevel).toBe("evening_peak");
    expect(statusAt8Pm.isSolarWindow).toBe(false);
    expect(statusAt8Pm.isPeakStress).toBe(true);
    expect(statusAt8Pm.currentCarbonIntensityKgPerKwh).toBe(
      CEA_CARBON_INTENSITY.EVENING_PEAK_THERMAL
    );
    expect(statusAt8Pm.minutesUntilNextSolarWindow).toBeGreaterThan(0);
  });

  it("identifies Morning Surge between 06:00 and 10:00 IST", () => {
    const statusAt8Am = getGridClockStatus(8, 0);
    expect(statusAt8Am.stressLevel).toBe("morning_surge");
    expect(statusAt8Am.minutesUntilNextSolarWindow).toBe(120); // 2 hours until 10:00 AM
  });

  it("identifies Night Off-Peak between 22:00 and 06:00 IST", () => {
    const statusMidnight = getGridClockStatus(0, 0);
    expect(statusMidnight.stressLevel).toBe("night_offpeak");
    expect(statusMidnight.isSolarWindow).toBe(false);
    expect(statusMidnight.minutesUntilNextSolarWindow).toBe(600);
  });

  it("handles all transition boundaries and countdown minutes", () => {
    expect(getGridClockStatus(6).minutesUntilNextSolarWindow).toBe(240);
    expect(getGridClockStatus(9, 59).minutesUntilNextSolarWindow).toBe(1);
    expect(getGridClockStatus(10).isSolarWindow).toBe(true);
    expect(getGridClockStatus(15, 59).isSolarWindow).toBe(true);
    expect(getGridClockStatus(16).minutesUntilNextSolarWindow).toBe(1080);
    expect(getGridClockStatus(17, 59).minutesUntilNextSolarWindow).toBe(961);
    expect(getGridClockStatus(18).isPeakStress).toBe(true);
    expect(getGridClockStatus(21, 59).minutesUntilNextSolarWindow).toBe(721);
    expect(getGridClockStatus(22).minutesUntilNextSolarWindow).toBe(720);
    expect(getGridClockStatus(5, 59).minutesUntilNextSolarWindow).toBe(241);
  });

  it("rejects out-of-range or fractional IST values", () => {
    expect(() => getGridClockStatus(-1)).toThrow(RangeError);
    expect(() => getGridClockStatus(24)).toThrow(RangeError);
    expect(() => getGridClockStatus(10, -1)).toThrow(RangeError);
    expect(() => getGridClockStatus(10, 60)).toThrow(RangeError);
    expect(() => getGridClockStatus(10.5)).toThrow(RangeError);
  });

  it("uses the CEA standard grid emissions factor and planned appliance loads", () => {
    expect(CEA_CARBON_INTENSITY.NATIONAL_GRID_AVERAGE).toBe(0.716);
    expect(SHIFTABLE_APPLIANCES.find((a) => a.id === "washing_machine")?.consumptionKwh).toBe(1.5);
    expect(SHIFTABLE_APPLIANCES.find((a) => a.id === "water_geyser")?.consumptionKwh).toBe(2.0);
    expect(SHIFTABLE_APPLIANCES.find((a) => a.id === "ev_2wheeler")?.consumptionKwh).toBe(2.5);
    expect(SHIFTABLE_APPLIANCES.find((a) => a.id === "water_pump")?.consumptionKwh).toBe(3.7);
  });

  it("calculates appliance shifting savings correctly", () => {
    const washingMachine = SHIFTABLE_APPLIANCES.find(
      (a) => a.id === "washing_machine"
    )!;
    expect(washingMachine).toBeDefined();

    const saving = calculateApplianceShiftSavings(washingMachine, 9.5, 6.0);
    expect(saving.currentRunCostInr).toBe(14.25);
    expect(saving.solarWindowCostInr).toBe(9);
    expect(saving.savingsInr).toBe(5.25);
    expect(saving.carbonAvoidedKg).toBe(0.71);
    expect(saving.recommendation).toContain("Washing Machine");
  });

  it("rejects invalid consumption and tariff inputs", () => {
    const appliance = SHIFTABLE_APPLIANCES[0];
    expect(() =>
      calculateApplianceShiftSavings({ ...appliance, consumptionKwh: -1 })
    ).toThrow(RangeError);
    expect(() => calculateApplianceShiftSavings(appliance, -1)).toThrow(
      RangeError
    );
    expect(() =>
      calculateApplianceShiftSavings(appliance, 9, Number.NaN)
    ).toThrow(RangeError);
  });
});
