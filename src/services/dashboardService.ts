/**
 * Dashboard service — orchestrates pure domain logic to assemble the complete dashboard view model.
 * Pure logic — no React, no direct database/I/O, no env access.
 */

import type {
  Reading,
  Assumptions,
  DashboardViewModel,
} from "@/domain/types";
import {
  computeStats,
  detectSpikes,
  compareWeekdayWeekend,
  downsampleToWeekly,
} from "@/domain/analytics";
import { generateTips } from "@/domain/tips";
import { CHART_DOWNSAMPLE_THRESHOLD } from "@/lib/config";

/**
 * Build the complete dashboard view model from a set of readings and user assumptions.
 *
 * @param readings - Array of daily electricity readings
 * @param assumptions - Configured tariff, emission factor, and spike multiplier
 * @param downsampleThreshold - Point count above which chart data aggregates to weekly buckets
 */
export function buildDashboard(
  readings: readonly Reading[],
  assumptions: Assumptions,
  downsampleThreshold: number = CHART_DOWNSAMPLE_THRESHOLD,
): DashboardViewModel {
  // Sort readings chronologically ascending
  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));

  const stats = computeStats(sorted, assumptions);
  const spikes = detectSpikes(sorted, assumptions.spikeMultiplier);
  const tips = generateTips(sorted, stats, spikes);
  const weekdayWeekend = compareWeekdayWeekend(sorted);

  const isDownsampled = sorted.length > downsampleThreshold;
  const chartSeries = isDownsampled ? downsampleToWeekly(sorted) : sorted;

  return {
    stats,
    readings: sorted,
    spikes,
    tips,
    assumptions,
    totals: stats.totalKwh,
    average: stats.averageKwh,
    cost: stats.totalCostRupees,
    co2: stats.totalCo2Kg,
    weekdayWeekend,
    chartSeries,
    isDownsampled,
  };
}

/** Alias for buildDashboard for backwards compatibility. */
export const buildDashboardViewModel = buildDashboard;
