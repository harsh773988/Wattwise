/**
 * Analytics functions for electricity usage data.
 * Pure domain logic — no framework, I/O, or env imports.
 */

import type {
  Reading,
  Spike,
  SeriesStats,
  Assumptions,
  WeekdayWeekendComparison,
} from "./types";
import { kwhToRupees, kwhToCo2 } from "./cost";

/** Round a number to 2 decimal places to mitigate floating point errors. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Calculate total kWh from a list of readings. */
export function total(readings: readonly Reading[]): number {
  if (readings.length === 0) return 0;
  return round2(readings.reduce((sum, r) => sum + r.kwh, 0));
}

/** Alias for total() */
export const totalKwh = total;

/** Calculate average kWh from a list of readings. Returns 0 for empty input. */
export function average(readings: readonly Reading[]): number {
  if (readings.length === 0) return 0;
  return round2(total(readings) / readings.length);
}

/** Alias for average() */
export const averageKwh = average;

/** Find the minimum kWh in a series. Returns 0 for empty input. */
export function minKwh(readings: readonly Reading[]): number {
  if (readings.length === 0) return 0;
  return round2(Math.min(...readings.map((r) => r.kwh)));
}

/** Find the maximum kWh in a series. Returns 0 for empty input. */
export function maxKwh(readings: readonly Reading[]): number {
  if (readings.length === 0) return 0;
  return round2(Math.max(...readings.map((r) => r.kwh)));
}

/**
 * Detect spike days — readings where kWh strictly exceeds (spikeMultiplier × average).
 * Rule: day > spikeMultiplier x average.
 * If kwh <= threshold, it is NOT flagged.
 * Returns empty array if fewer than 2 readings or average is 0.
 */
export function detectSpikes(
  readings: readonly Reading[],
  spikeMultiplier: number,
): readonly Spike[] {
  if (readings.length < 2) return [];
  if (spikeMultiplier <= 0) return [];
  const avg = average(readings);
  if (avg <= 0) return [];

  // Floating-point accurate threshold calculation
  const rawThreshold = avg * spikeMultiplier;

  return readings
    .filter((r) => r.kwh > rawThreshold)
    .map((r) => ({
      date: r.date,
      kwh: round2(r.kwh),
      averageKwh: round2(avg),
      multiplier: round2(r.kwh / avg),
    }));
}

/**
 * Compare weekday vs weekend consumption patterns.
 * Monday (1) through Friday (5) = weekday.
 * Saturday (6) and Sunday (0) = weekend.
 */
export function compareWeekdayWeekend(
  readings: readonly Reading[],
): WeekdayWeekendComparison {
  if (readings.length === 0) {
    return {
      weekdayAverage: 0,
      weekendAverage: 0,
      differencePercentage: 0,
      higher: "insufficient_data",
    };
  }

  const weekdayReadings: Reading[] = [];
  const weekendReadings: Reading[] = [];

  for (const r of readings) {
    // Parse date as UTC/ISO to avoid timezone shifts
    const parts = r.date.split("-").map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    const day = d.getUTCDay();
    if (day >= 1 && day <= 5) {
      weekdayReadings.push(r);
    } else {
      weekendReadings.push(r);
    }
  }

  if (weekdayReadings.length === 0 || weekendReadings.length === 0) {
    const weekdayAvg = average(weekdayReadings);
    const weekendAvg = average(weekendReadings);
    return {
      weekdayAverage: weekdayAvg,
      weekendAverage: weekendAvg,
      differencePercentage: 0,
      higher: "insufficient_data",
    };
  }

  const weekdayAvg = average(weekdayReadings);
  const weekendAvg = average(weekendReadings);

  if (weekdayAvg === weekendAvg) {
    return {
      weekdayAverage: weekdayAvg,
      weekendAverage: weekendAvg,
      differencePercentage: 0,
      higher: "equal",
    };
  }

  const higher = weekendAvg > weekdayAvg ? "weekend" : "weekday";
  const baseline = Math.min(weekdayAvg, weekendAvg);
  const diffPct =
    baseline > 0
      ? round2((Math.abs(weekendAvg - weekdayAvg) / baseline) * 100)
      : 0;

  return {
    weekdayAverage: weekdayAvg,
    weekendAverage: weekendAvg,
    differencePercentage: diffPct,
    higher,
  };
}

/** Build full statistics for a series of readings. */
export function computeStats(
  readings: readonly Reading[],
  assumptions: Assumptions,
): SeriesStats {
  const tot = total(readings);
  const avg = average(readings);
  return {
    totalKwh: tot,
    averageKwh: avg,
    minKwh: minKwh(readings),
    maxKwh: maxKwh(readings),
    days: readings.length,
    totalCostRupees: kwhToRupees(tot, assumptions.tariffPerKwh),
    totalCo2Kg: kwhToCo2(tot, assumptions.emissionFactor),
  };
}

/**
 * Compute day-over-day trend: positive means usage is increasing.
 * Returns 0 for fewer than 2 readings.
 */
export function computeTrend(readings: readonly Reading[]): number {
  if (readings.length < 2) return 0;
  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));
  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);
  const firstAvg = average(firstHalf);
  const secondAvg = average(secondHalf);
  if (firstAvg === 0) return 0;
  return round2(((secondAvg - firstAvg) / firstAvg) * 100);
}

/**
 * Downsample readings by aggregating into weekly buckets.
 * Used when point count exceeds chart rendering threshold.
 */
export function downsampleToWeekly(
  readings: readonly Reading[],
): readonly Reading[] {
  if (readings.length === 0) return [];
  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));
  const weeks: Map<string, { totalKwh: number; count: number; date: string }> =
    new Map();

  for (const r of sorted) {
    const parts = r.date.split("-").map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    const day = d.getUTCDay();
    // Move to Monday (ISO week)
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d);
    weekStart.setUTCDate(diff);
    const weekKey = weekStart.toISOString().slice(0, 10);

    const existing = weeks.get(weekKey);
    if (existing) {
      existing.totalKwh += r.kwh;
      existing.count += 1;
    } else {
      weeks.set(weekKey, {
        totalKwh: r.kwh,
        count: 1,
        date: weekKey,
      });
    }
  }

  const spaceId = sorted[0]?.spaceId || "default";
  return Array.from(weeks.values()).map((w) => ({
    spaceId,
    date: w.date,
    kwh: round2(w.totalKwh / w.count),
  }));
}
