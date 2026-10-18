/**
 * What-if scenario projections.
 * Pure domain logic — no framework, I/O, or env imports.
 */

import type { WhatIfResult, Assumptions } from "./types";
import { kwhToRupees, kwhToCo2, round2 } from "./cost";

/** Standard days in a month for projections. */
export const DEFAULT_DAYS_PER_MONTH = 30;

/**
 * Project savings for a device of X watts used Y hours less per day.
 * Example: A 1500W air conditioner used 1 hour less per day.
 *
 * @param watts - Device power rating in Watts (must be >= 0)
 * @param hoursReducedPerDay - Hours reduced per day (must be >= 0 and <= 24)
 * @param tariffPerKwh - Cost in ₹ per kWh (must be >= 0)
 * @param emissionFactor - Carbon intensity in kg CO₂/kWh (must be >= 0)
 * @param daysPerMonth - Days in billing cycle (default 30)
 */
export function projectDeviceHabitSavings(
  watts: number,
  hoursReducedPerDay: number,
  tariffPerKwh: number,
  emissionFactor: number,
  daysPerMonth: number = DEFAULT_DAYS_PER_MONTH,
): WhatIfResult {
  if (watts < 0) {
    throw new RangeError("Device wattage must be non-negative");
  }
  if (hoursReducedPerDay < 0 || hoursReducedPerDay > 24) {
    throw new RangeError("Hours reduced per day must be between 0 and 24");
  }
  if (tariffPerKwh < 0) {
    throw new RangeError("Tariff must be non-negative");
  }
  if (emissionFactor < 0) {
    throw new RangeError("Emission factor must be non-negative");
  }
  if (daysPerMonth <= 0) {
    throw new RangeError("Days per month must be greater than zero");
  }

  const dailySavingsKwh = round2((watts * hoursReducedPerDay) / 1000);
  const monthlySavingsKwh = round2(dailySavingsKwh * daysPerMonth);
  const monthlySavingsRupees = kwhToRupees(monthlySavingsKwh, tariffPerKwh);
  const monthlySavingsCo2Kg = kwhToCo2(monthlySavingsKwh, emissionFactor);

  return {
    scenarioLabel: `${watts}W device reduced by ${hoursReducedPerDay}h/day`,
    dailySavingsKwh,
    monthlySavingsKwh,
    monthlySavingsRupees,
    monthlySavingsCo2Kg,
  };
}

/** Alias for projectDeviceHabitSavings. */
export const projectHabitSavings = projectDeviceHabitSavings;

/**
 * Convenience wrapper to project device habit savings using an Assumptions object.
 */
export function projectHabitChange(
  watts: number,
  hoursReducedPerDay: number,
  assumptions: Assumptions,
  daysPerMonth: number = DEFAULT_DAYS_PER_MONTH,
): WhatIfResult {
  return projectDeviceHabitSavings(
    watts,
    hoursReducedPerDay,
    assumptions.tariffPerKwh,
    assumptions.emissionFactor,
    daysPerMonth,
  );
}

/**
 * Project monthly savings for a direct daily kWh reduction.
 *
 * @param scenarioLabel - Friendly label describing the habit change
 * @param dailySavingsKwh - Daily reduction in kWh (must be >= 0)
 * @param assumptions - Assumptions containing tariff and emission factor
 * @param daysPerMonth - Days in month (default 30)
 */
export function projectSavings(
  scenarioLabel: string,
  dailySavingsKwh: number,
  assumptions: Assumptions,
  daysPerMonth: number = DEFAULT_DAYS_PER_MONTH,
): WhatIfResult {
  if (dailySavingsKwh < 0) {
    throw new RangeError("Daily savings kWh must be non-negative");
  }
  if (daysPerMonth <= 0) {
    throw new RangeError("Days per month must be greater than zero");
  }

  const monthlySavingsKwh = round2(dailySavingsKwh * daysPerMonth);
  return {
    scenarioLabel,
    dailySavingsKwh: round2(dailySavingsKwh),
    monthlySavingsKwh,
    monthlySavingsRupees: kwhToRupees(
      monthlySavingsKwh,
      assumptions.tariffPerKwh,
    ),
    monthlySavingsCo2Kg: kwhToCo2(
      monthlySavingsKwh,
      assumptions.emissionFactor,
    ),
  };
}

/** Predefined scenario definitions for interactive calculators. */
export interface WhatIfScenario {
  readonly label: string;
  readonly defaultDailyKwh: number;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export const PRESET_SCENARIOS: readonly WhatIfScenario[] = [
  {
    label: "AC hours reduced per day",
    defaultDailyKwh: 1.5,
    unit: "hours",
    min: 0,
    max: 8,
    step: 0.5,
  },
  {
    label: "Geyser minutes reduced per day",
    defaultDailyKwh: 0.07,
    unit: "minutes",
    min: 0,
    max: 60,
    step: 5,
  },
  {
    label: "Lights switched to LED",
    defaultDailyKwh: 0.05,
    unit: "bulbs",
    min: 0,
    max: 20,
    step: 1,
  },
  {
    label: "Standby appliances unplugged",
    defaultDailyKwh: 0.01,
    unit: "devices",
    min: 0,
    max: 15,
    step: 1,
  },
] as const;
