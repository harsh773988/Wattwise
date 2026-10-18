/**
 * Core domain types for WattWise.
 * Pure TypeScript — no framework, I/O, or env imports allowed.
 */

/** A single electricity meter reading for one day. */
export interface Reading {
  readonly date: string; // ISO 8601 date string (YYYY-MM-DD)
  readonly kwh: number; // kilowatt-hours consumed that day
  readonly spaceId?: string; // optional space identifier for multi-space support
}

/** An ordered series of daily readings for one space. */
export interface Series {
  readonly spaceId: string;
  readonly readings: readonly Reading[];
}

/** A day flagged as a usage spike. */
export interface Spike {
  readonly date: string;
  readonly kwh: number;
  readonly averageKwh: number;
  readonly multiplier: number; // how many times the average (rounded)
}

/** A smart tip generated from usage patterns. */
export interface Tip {
  readonly id: string;
  readonly title: string;
  readonly message: string; // descriptive message
  readonly estimatedMonthlySavingKwh: number; // projected monthly kWh saving
  readonly description?: string; // alias for message for backwards compatibility
  readonly potentialSavingsKwh: number; // daily savings alias for backwards compatibility
  readonly category?: TipCategory;
}

export type TipCategory =
  | "high-usage"
  | "spike"
  | "consistency"
  | "reduction"
  | "general";

/** User-configurable assumptions for cost/CO₂ calculations. */
export interface Assumptions {
  readonly tariffPerKwh: number; // ₹ per kWh
  readonly emissionFactor: number; // kg CO₂ per kWh
  readonly spikeMultiplier: number; // usage above avg × this = spike
}

/** Result of comparing weekday vs weekend consumption. */
export interface WeekdayWeekendComparison {
  readonly weekdayAverage: number;
  readonly weekendAverage: number;
  readonly differencePercentage: number;
  readonly higher: "weekday" | "weekend" | "equal" | "insufficient_data";
}

/** Summary statistics for a series. */
export interface SeriesStats {
  readonly totalKwh: number;
  readonly averageKwh: number;
  readonly minKwh: number;
  readonly maxKwh: number;
  readonly days: number;
  readonly totalCostRupees: number;
  readonly totalCo2Kg: number;
}

/** Result of a what-if scenario. */
export interface WhatIfResult {
  readonly scenarioLabel: string;
  readonly dailySavingsKwh: number;
  readonly monthlySavingsKwh: number;
  readonly monthlySavingsRupees: number;
  readonly monthlySavingsCo2Kg: number;
}

/** Dashboard view model assembled from readings + assumptions. */
export interface DashboardViewModel {
  readonly stats: SeriesStats;
  readonly readings: readonly Reading[];
  readonly spikes: readonly Spike[];
  readonly tips: readonly Tip[];
  readonly assumptions: Assumptions;
  readonly totals: number;
  readonly average: number;
  readonly cost: number;
  readonly co2: number;
  readonly weekdayWeekend: WeekdayWeekendComparison;
  readonly chartSeries: readonly Reading[];
  readonly isDownsampled: boolean;
}

/** API error response shape. */
export interface ApiError {
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

/** Duplicate date merge strategy. */
export type DuplicateMergeRule = "sum" | "latest" | "average";
