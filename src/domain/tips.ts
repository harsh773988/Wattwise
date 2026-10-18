/**
 * Rule-based tip generation from usage patterns.
 * Pure domain logic — no framework, I/O, or env imports.
 */

import type { Reading, Spike, Tip, SeriesStats } from "./types";
import { computeTrend, compareWeekdayWeekend, round2 } from "./analytics";

/**
 * Generate 3 to 5 smart tips based on the user's actual usage patterns.
 * Rules check for:
 * 1. Frequent spikes
 * 2. High weekend vs weekday usage
 * 3. Usage above a baseline
 * 4. Upward usage trends
 * 5. General energy conservation habits
 *
 * Each tip contains id, title, message, and estimatedMonthlySavingKwh.
 */
export function generateTips(
  readings: readonly Reading[],
  stats: SeriesStats,
  spikes: readonly Spike[],
  baselineDailyKwh: number = 8,
): readonly Tip[] {
  const tips: Tip[] = [];

  // Rule 1: Usage above a baseline
  if (stats.averageKwh > baselineDailyKwh) {
    const dailyExcess = round2(stats.averageKwh - baselineDailyKwh);
    const monthlySaving = round2(dailyExcess * 30);
    const msg = `At ${stats.averageKwh} kWh/day, your usage is above the typical baseline of ${baselineDailyKwh} kWh/day. Addressing high-draw loads could reduce consumption significantly.`;

    tips.push({
      id: "high-avg",
      title: "Usage Above Household Baseline",
      message: msg,
      description: msg,
      estimatedMonthlySavingKwh: monthlySaving,
      potentialSavingsKwh: dailyExcess,
      category: "high-usage",
    });
  }

  // Rule 2: Frequent / detected spikes
  if (spikes.length > 0) {
    const avgSpike =
      spikes.reduce((sum, sp) => sum + sp.kwh, 0) / spikes.length;
    const dailyDelta = round2(Math.max(0, avgSpike - stats.averageKwh));
    // Estimated savings assuming spikes are eliminated across the month
    const monthlySaving = round2(dailyDelta * Math.max(1, spikes.length));
    const isPlural = spikes.length > 1;
    const msg = `Your usage spiked to ~${avgSpike.toFixed(1)} kWh on ${spikes.length} day${isPlural ? "s" : ""}. High concurrent appliance usage (AC, geyser, heavy iron) is often the root cause.`;

    tips.push({
      id: "spike-days",
      title: `${spikes.length} spike day${isPlural ? "s" : ""} detected`,
      message: msg,
      description: msg,
      estimatedMonthlySavingKwh: monthlySaving,
      potentialSavingsKwh: dailyDelta,
      category: "spike",
    });
  }

  // Rule 3: High weekend usage (or weekday disparity)
  const comparison = compareWeekdayWeekend(readings);
  if (comparison.higher === "weekend" && comparison.differencePercentage >= 15) {
    const excessDaily = round2(
      comparison.weekendAverage - comparison.weekdayAverage,
    );
    // 8 weekend days per month
    const monthlySaving = round2(excessDaily * 8);
    const msg = `Weekends average ${comparison.weekendAverage.toFixed(1)} kWh vs weekdays at ${comparison.weekdayAverage.toFixed(1)} kWh (+${comparison.differencePercentage}%). Being home more drives continuous heating/cooling—use appliance timers to regulate usage.`;

    tips.push({
      id: "weekend-high",
      title: "High Weekend Usage Pattern",
      message: msg,
      description: msg,
      estimatedMonthlySavingKwh: monthlySaving,
      potentialSavingsKwh: excessDaily,
      category: "consistency",
    });
  } else if (
    comparison.higher === "weekday" &&
    comparison.differencePercentage >= 15
  ) {
    const excessDaily = round2(
      comparison.weekdayAverage - comparison.weekendAverage,
    );
    // 22 weekdays per month
    const monthlySaving = round2(excessDaily * 22);
    const msg = `Weekdays average ${comparison.weekdayAverage.toFixed(1)} kWh vs weekends at ${comparison.weekendAverage.toFixed(1)} kWh (+${comparison.differencePercentage}%). Check for home-office equipment, lighting, or computers running continuously.`;

    tips.push({
      id: "weekday-high",
      title: "High Weekday Usage Pattern",
      message: msg,
      description: msg,
      estimatedMonthlySavingKwh: monthlySaving,
      potentialSavingsKwh: excessDaily,
      category: "consistency",
    });
  }

  // Rule 4: Usage trending upward
  const trend = computeTrend(readings);
  if (trend > 10) {
    const monthlySaving = round2(stats.averageKwh * (trend / 100) * 15);
    const msg = `Usage has climbed by +${trend}% compared to the start of this period. Seasonal thermal changes or new continuous appliances may be driving the increase.`;

    tips.push({
      id: "trend-up",
      title: "Consumption Trending Upward",
      message: msg,
      description: msg,
      estimatedMonthlySavingKwh: monthlySaving,
      potentialSavingsKwh: round2(stats.averageKwh * 0.1),
      category: "reduction",
    });
  }

  // Rule 5: Fallback general tips to guarantee 3 to 5 tips always
  if (tips.length < 3) {
    const msg =
      "Replacing conventional incandescent or CFL bulbs with 9W LEDs cuts lighting power by 75%. Retrofitting 10 bulbs saves ~1.0 kWh/day (~30 kWh/month).";
    tips.push({
      id: "led-retrofit",
      title: "Switch to Efficient LED Lighting",
      message: msg,
      description: msg,
      estimatedMonthlySavingKwh: 30,
      potentialSavingsKwh: 1.0,
      category: "general",
    });
  }

  if (tips.length < 3) {
    const monthlySaving = round2(stats.averageKwh * 0.15 * 30);
    const msg =
      "Upgrading heavy appliances (refrigerators and air conditioners) to 5-star BEE models saves 25–30% in continuous cycle consumption.";
    tips.push({
      id: "star-rated-appliances",
      title: "Upgrade to 5-Star BEE Rated Appliances",
      message: msg,
      description: msg,
      estimatedMonthlySavingKwh: monthlySaving > 0 ? monthlySaving : 35,
      potentialSavingsKwh: round2(stats.averageKwh * 0.15),
      category: "general",
    });
  }

  if (tips.length < 3) {
    const msg =
      "Raising AC thermostat temperature by 1°C (e.g. from 20°C to 24°C) saves ~6% electricity per degree, avoiding ~45 kWh monthly.";
    tips.push({
      id: "thermostat-setpoint",
      title: "Optimize AC Thermostat Setpoint to 24°C",
      message: msg,
      description: msg,
      estimatedMonthlySavingKwh: 45,
      potentialSavingsKwh: 1.5,
      category: "general",
    });
  }

  // Cap at 5 tips maximum
  return tips.slice(0, 5);
}
