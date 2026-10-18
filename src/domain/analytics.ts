/**
 * Analytics functions for electricity usage data.
 * Pure domain logic — no framework, I/O, or env imports.
 */

import type { Reading, Spike, SeriesStats, Assumptions } from "./types";
import { kwhToRupees, kwhToCo2 } from "./cost";

/** Calculate the average kWh from a list of readings. Returns 0 for empty input. */
export function averageKwh(readings: readonly Reading[]): number {
  if (readings.length === 0) return 0;
  const total = totalKwh(readings);
  return total / readings.length;
}

/** Calculate total kWh from a list of readings. */
export function totalKwh(readings: readonly Reading[]): number {
  return readings.reduce((sum, r) => sum + r.kwh, 0);
}

/** Find the minimum kWh in a series. Returns 0 for empty input. */
export function minKwh(readings: readonly Reading[]): number {
  if (readings.length === 0) return 0;
  return Math.min(...readings.map((r) => r.kwh));
}

/** Find the maximum kWh in a series. Returns 0 for empty input. */
export function maxKwh(readings: readonly Reading[]): number {
  if (readings.length === 0) return 0;
  return Math.max(...readings.map((r) => r.kwh));
}

/**
 * Detect spike days — readings where kWh exceeds the average by the given multiplier.
 * Returns an empty array if fewer than 2 readings (no meaningful average to compare against).
 */
export function detectSpikes(
  readings: readonly Reading[],
  spikeMultiplier: number,
): readonly Spike[] {
  if (readings.length < 2) return [];
  const avg = averageKwh(readings);
  if (avg === 0) return [];
  const threshold = avg * spikeMultiplier;

  return readings
    .filter((r) => r.kwh > threshold)
    .map((r) => ({
      date: r.date,
      kwh: r.kwh,
      averageKwh: round2(avg),
      multiplier: round2(r.kwh / avg),
    }));
}

/** Build full statistics for a series of readings. */
export function computeStats(
  readings: readonly Reading[],
  assumptions: Assumptions,
): SeriesStats {
  const total = totalKwh(readings);
  return {
    totalKwh: round2(total),
    averageKwh: round2(averageKwh(readings)),
    minKwh: round2(minKwh(readings)),
    maxKwh: round2(maxKwh(readings)),
    days: readings.length,
    totalCostRupees: round2(kwhToRupees(total, assumptions.tariffPerKwh)),
    totalCo2Kg: round2(kwhToCo2(total, assumptions.emissionFactor)),
  };
}

/**
 * Compute day-over-day trend: positive means usage is increasing.
 * Returns 0 for fewer than 2 readings.
 */
export function computeTrend(readings: readonly Reading[]): number {
  if (readings.length < 2) return 0;
  const sorted = [...readings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
  const firstAvg = averageKwh(firstHalf);
  const secondAvg = averageKwh(secondHalf);
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
  const sorted = [...readings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const weeks: Map<string, { totalKwh: number; count: number; date: string }> =
    new Map();

  for (const r of sorted) {
    const d = new Date(r.date);
    // ISO week start (Monday)
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d);
    weekStart.setDate(diff);
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

  const spaceId = sorted[0].spaceId;
  return Array.from(weeks.values()).map((w) => ({
    spaceId,
    date: w.date,
    kwh: round2(w.totalKwh / w.count),
  }));
}

/** Round a number to 2 decimal places. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
