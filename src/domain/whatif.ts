/**
 * What-if scenario projections.
 * Pure domain logic — no framework, I/O, or env imports.
 */

import type { WhatIfResult, Assumptions } from "./types";
import { kwhToRupees, kwhToCo2 } from "./cost";

/** Standard days in a month for projections. */
const DAYS_PER_MONTH = 30;

/**
 * Project savings for a daily kWh reduction.
 * Example: "AC 1 hour less/day" → dailySavingsKwh = 1.5
 */
export function projectSavings(
  scenarioLabel: string,
  dailySavingsKwh: number,
  assumptions: Assumptions,
): WhatIfResult {
  if (dailySavingsKwh < 0) {
    throw new RangeError("Daily savings kWh must be non-negative");
  }
  const monthlySavingsKwh = round2(dailySavingsKwh * DAYS_PER_MONTH);
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

/** Predefined scenarios with typical kWh savings per day. */
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

/** Round to 2 decimal places. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
