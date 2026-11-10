/**
 * National Grid Stress & Green Hours Clock (Grid-India / CEA aligned).
 * Real-time Indian Standard Time (IST) load curves, emission factors,
 * and appliance load shifting logic.
 * Pure domain logic — zero framework, I/O, or env imports.
 */

import { round2 } from "./cost";

export type GridStressLevel = "green_solar" | "evening_peak" | "morning_surge" | "night_offpeak";

export interface GridClockStatus {
  readonly currentHourIst: number; // 0-23
  readonly currentMinuteIst: number; // 0-59
  readonly stressLevel: GridStressLevel;
  readonly label: string;
  readonly description: string;
  readonly currentCarbonIntensityKgPerKwh: number;
  readonly isSolarWindow: boolean;
  readonly isPeakStress: boolean;
  readonly recommendedAction: string;
  readonly minutesUntilNextSolarWindow: number;
}

export interface ShiftableAppliance {
  readonly id: string;
  readonly name: string;
  readonly typicalPowerWatts: number;
  readonly typicalDurationMinutes: number;
  readonly consumptionKwh: number;
  readonly category: "cooling" | "heating" | "cleaning" | "mobility" | "pumping";
}

export interface ApplianceShiftSaving {
  readonly appliance: ShiftableAppliance;
  readonly currentRunCostInr: number;
  readonly solarWindowCostInr: number;
  readonly savingsInr: number;
  readonly carbonAvoidedKg: number;
  readonly recommendation: string;
}

/** National average carbon intensity benchmarks (CEA India Baseline) */
export const CEA_CARBON_INTENSITY = {
  NATIONAL_GRID_AVERAGE: 0.716, // kg CO2 / kWh
  EVENING_PEAK_THERMAL: 0.89, // Coal peaking plants active
  SOLAR_WINDOW_CLEAN: 0.42, // High renewables & solar penetration
  NIGHT_OFF_PEAK: 0.65, // Base thermal + hydro
} as const;

/**
 * Common shiftable household appliances in India.
 */
export const SHIFTABLE_APPLIANCES: readonly ShiftableAppliance[] = [
  {
    id: "washing_machine",
    name: "Washing Machine",
    typicalPowerWatts: 1500,
    typicalDurationMinutes: 60,
    consumptionKwh: 1.5,
    category: "cleaning",
  },
  {
    id: "water_geyser",
    name: "Water Geyser (Storage)",
    typicalPowerWatts: 2000,
    typicalDurationMinutes: 60,
    consumptionKwh: 2.0,
    category: "heating",
  },
  {
    id: "ev_2wheeler",
    name: "EV 2-Wheeler Charger",
    typicalPowerWatts: 850,
    typicalDurationMinutes: 180,
    consumptionKwh: 2.5,
    category: "mobility",
  },
  {
    id: "water_pump",
    name: "Borewell / Overhead Water Pump",
    typicalPowerWatts: 3700,
    typicalDurationMinutes: 60,
    consumptionKwh: 3.7,
    category: "pumping",
  },
  {
    id: "dishwasher",
    name: "Dishwasher (Eco Mode)",
    typicalPowerWatts: 1200,
    typicalDurationMinutes: 90,
    consumptionKwh: 1.8,
    category: "cleaning",
  },
];

/**
 * Get grid status for a given IST hour (0-23) and minute (0-59).
 */
export function getGridClockStatus(hourIst: number, minuteIst = 0): GridClockStatus {
  if (!Number.isInteger(hourIst) || hourIst < 0 || hourIst > 23) {
    throw new RangeError("IST hour must be an integer from 0 to 23");
  }
  if (!Number.isInteger(minuteIst) || minuteIst < 0 || minuteIst > 59) {
    throw new RangeError("IST minute must be an integer from 0 to 59");
  }
  const normalizedHour = hourIst;
  const currentTotalMinutes = normalizedHour * 60 + minuteIst;

  // 10:00 to 16:00 IST -> Solar Hours Window
  if (normalizedHour >= 10 && normalizedHour < 16) {
    return {
      currentHourIst: normalizedHour,
      currentMinuteIst: minuteIst,
      stressLevel: "green_solar",
      label: "Green Solar Hours",
      description: "Abundant solar energy flowing through the national grid. Lowest carbon intensity.",
      currentCarbonIntensityKgPerKwh: CEA_CARBON_INTENSITY.SOLAR_WINDOW_CLEAN,
      isSolarWindow: true,
      isPeakStress: false,
      recommendedAction: "Prime time! Run high-power appliances, pumps, and charge electric vehicles now.",
      minutesUntilNextSolarWindow: 0,
    };
  }

  // 18:00 to 22:00 IST -> National Evening Peak
  if (normalizedHour >= 18 && normalizedHour < 22) {
    // Next solar window starts at 10:00 tomorrow
    const nextSolarStart = (24 + 10) * 60;
    const minutesUntilNext = nextSolarStart - currentTotalMinutes;

    return {
      currentHourIst: normalizedHour,
      currentMinuteIst: minuteIst,
      stressLevel: "evening_peak",
      label: "Evening Grid Peak",
      description: "Grid demand is at maximum. Thermal coal power plants are ramping up.",
      currentCarbonIntensityKgPerKwh: CEA_CARBON_INTENSITY.EVENING_PEAK_THERMAL,
      isSolarWindow: false,
      isPeakStress: true,
      recommendedAction: "Avoid running washing machines, dishwashers, and geysers. Set AC to 25°C.",
      minutesUntilNextSolarWindow: minutesUntilNext,
    };
  }

  // 06:00 to 10:00 IST -> Morning Surge
  if (normalizedHour >= 6 && normalizedHour < 10) {
    const minutesUntilNext = 10 * 60 - currentTotalMinutes;
    return {
      currentHourIst: normalizedHour,
      currentMinuteIst: minuteIst,
      stressLevel: "morning_surge",
      label: "Morning Ramp",
      description: "Rising household demand across India due to cooking, water heating, and office prep.",
      currentCarbonIntensityKgPerKwh: CEA_CARBON_INTENSITY.NATIONAL_GRID_AVERAGE,
      isSolarWindow: false,
      isPeakStress: false,
      recommendedAction: "Delay non-critical washing or EV charging by an hour to hit the 10:00 AM solar window.",
      minutesUntilNextSolarWindow: Math.max(0, minutesUntilNext),
    };
  }

  // 22:00 to 06:00 IST -> Night Off-Peak
  const nextSolarMinutes =
    normalizedHour >= 16
      ? (24 + 10) * 60 - currentTotalMinutes
      : 10 * 60 - currentTotalMinutes;

  return {
    currentHourIst: normalizedHour,
    currentMinuteIst: minuteIst,
    stressLevel: "night_offpeak",
    label: "Night Off-Peak",
    description: "Low demand across industrial and residential sectors.",
    currentCarbonIntensityKgPerKwh: CEA_CARBON_INTENSITY.NIGHT_OFF_PEAK,
    isSolarWindow: false,
    isPeakStress: false,
    recommendedAction: "Low grid stress. Suitable for overnight EV slow-charging or delayed appliance cycles.",
    minutesUntilNextSolarWindow: nextSolarMinutes,
  };
}

/**
 * Calculate rupees and CO2 saved by shifting an appliance run from Peak into Green Solar Hours.
 */
export function calculateApplianceShiftSavings(
  appliance: ShiftableAppliance,
  peakTariffPerKwh = 9.0, // Evening peak rate with ToD surcharge
  solarTariffPerKwh = 6.0 // Normal / solar window rate
): ApplianceShiftSaving {
  if (!Number.isFinite(appliance.consumptionKwh) || appliance.consumptionKwh < 0) {
    throw new RangeError("Appliance consumption must be a non-negative number");
  }
  if (!Number.isFinite(peakTariffPerKwh) || peakTariffPerKwh < 0) {
    throw new RangeError("Peak tariff must be a non-negative number");
  }
  if (!Number.isFinite(solarTariffPerKwh) || solarTariffPerKwh < 0) {
    throw new RangeError("Solar tariff must be a non-negative number");
  }

  const currentRunCostInr = round2(appliance.consumptionKwh * peakTariffPerKwh);
  const solarWindowCostInr = round2(appliance.consumptionKwh * solarTariffPerKwh);
  const savingsInr = round2(currentRunCostInr - solarWindowCostInr);

  // Carbon difference between peak thermal coal vs clean solar
  const peakCo2 = appliance.consumptionKwh * CEA_CARBON_INTENSITY.EVENING_PEAK_THERMAL;
  const solarCo2 = appliance.consumptionKwh * CEA_CARBON_INTENSITY.SOLAR_WINDOW_CLEAN;
  const carbonAvoidedKg = round2(peakCo2 - solarCo2);

  return {
    appliance,
    currentRunCostInr,
    solarWindowCostInr,
    savingsInr,
    carbonAvoidedKg,
    recommendation: `Shift your ${appliance.name} to 11:00 AM–3:00 PM to save ₹${savingsInr} and cut ${carbonAvoidedKg} kg CO₂ per cycle.`,
  };
}
