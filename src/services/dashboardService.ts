/**
 * Dashboard service — orchestrates domain logic to build the dashboard view model.
 */

import type {
  Reading,
  Assumptions,
  DashboardViewModel,
} from "@/domain/types";
import { computeStats, detectSpikes } from "@/domain/analytics";
import { generateTips } from "@/domain/tips";

/**
 * Build the complete dashboard view model from a set of readings and assumptions.
 * This is the single entry point that the UI layer calls.
 */
export function buildDashboardViewModel(
  readings: readonly Reading[],
  assumptions: Assumptions,
): DashboardViewModel {
  // Sort readings chronologically
  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));

  const stats = computeStats(sorted, assumptions);
  const spikes = detectSpikes(sorted, assumptions.spikeMultiplier);
  const tips = generateTips(sorted, stats, spikes);

  return {
    stats,
    readings: sorted,
    spikes,
    tips,
    assumptions,
  };
}
