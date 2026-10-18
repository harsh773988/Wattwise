/**
 * Rule-based tip generation from usage patterns.
 * Pure domain logic — no framework, I/O, or env imports.
 */

import type { Reading, Spike, Tip, SeriesStats } from "./types";
import { computeTrend } from "./analytics";

/**
 * Generate 3–5 smart tips based on the user's actual usage patterns.
 * Rules are prioritised; we return the top 5 applicable tips.
 */
export function generateTips(
  readings: readonly Reading[],
  stats: SeriesStats,
  spikes: readonly Spike[],
): readonly Tip[] {
  const tips: Tip[] = [];

  // Rule 1: High overall usage
  if (stats.averageKwh > 10) {
    tips.push({
      id: "high-avg",
      title: "Your average usage is high",
      description: `At ${stats.averageKwh} kWh/day, you're using more than a typical Indian household (~8 kWh/day). Consider an energy audit to identify heavy appliances.`,
      potentialSavingsKwh: Math.max(0, stats.averageKwh - 8),
      category: "high-usage",
    });
  }

  // Rule 2: Spike days detected
  if (spikes.length > 0) {
    const avgSpike =
      spikes.reduce((s, sp) => s + sp.kwh, 0) / spikes.length;
    tips.push({
      id: "spike-days",
      title: `${spikes.length} spike day${spikes.length > 1 ? "s" : ""} detected`,
      description: `Your usage spiked to ~${avgSpike.toFixed(1)} kWh on ${spikes.length} day${spikes.length > 1 ? "s" : ""}. Check if heavy appliances (AC, geyser, iron) were running longer than usual.`,
      potentialSavingsKwh: round2(avgSpike - stats.averageKwh),
      category: "spike",
    });
  }

  // Rule 3: Weekend vs weekday pattern
  const weekdayReadings = readings.filter((r) => {
    const day = new Date(r.date).getDay();
    return day >= 1 && day <= 5;
  });
  const weekendReadings = readings.filter((r) => {
    const day = new Date(r.date).getDay();
    return day === 0 || day === 6;
  });
  if (weekdayReadings.length > 0 && weekendReadings.length > 0) {
    const weekdayAvg =
      weekdayReadings.reduce((s, r) => s + r.kwh, 0) / weekdayReadings.length;
    const weekendAvg =
      weekendReadings.reduce((s, r) => s + r.kwh, 0) / weekendReadings.length;
    if (weekendAvg > weekdayAvg * 1.2) {
      tips.push({
        id: "weekend-high",
        title: "Weekend usage is higher than weekdays",
        description: `Weekends average ${weekendAvg.toFixed(1)} kWh vs weekdays at ${weekdayAvg.toFixed(1)} kWh. Being home more means more appliance use — try setting timers on AC and entertainment systems.`,
        potentialSavingsKwh: round2(weekendAvg - weekdayAvg),
        category: "consistency",
      });
    } else if (weekdayAvg > weekendAvg * 1.2) {
      tips.push({
        id: "weekday-high",
        title: "Weekday usage is higher than weekends",
        description: `Weekdays average ${weekdayAvg.toFixed(1)} kWh vs weekends at ${weekendAvg.toFixed(1)} kWh. Check if office equipment or lighting is left on unnecessarily.`,
        potentialSavingsKwh: round2(weekdayAvg - weekendAvg),
        category: "consistency",
      });
    }
  }

  // Rule 4: Usage trending up
  const trend = computeTrend(readings);
  if (trend > 10) {
    tips.push({
      id: "trend-up",
      title: "Your usage is trending upward",
      description: `Usage increased ~${trend}% compared to the first half of the period. Seasonal changes or new appliances could be the cause.`,
      potentialSavingsKwh: round2(stats.averageKwh * (trend / 100) * 0.5),
      category: "reduction",
    });
  }

  // Rule 5: Consistent high usage (low variance)
  if (readings.length >= 7) {
    const variance = computeVariance(readings);
    if (variance < 1 && stats.averageKwh > 6) {
      tips.push({
        id: "baseload-high",
        title: "Consistent high baseline usage",
        description: `Your daily usage barely varies (±${Math.sqrt(variance).toFixed(1)} kWh), suggesting a high always-on baseload. Check standby power, old fridges, or water heaters running 24/7.`,
        potentialSavingsKwh: round2(stats.averageKwh * 0.1),
        category: "reduction",
      });
    }
  }

  // Rule 6: General tips (always add at least one if we have few)
  if (tips.length < 3) {
    tips.push({
      id: "led-switch",
      title: "Switch to LED lighting",
      description:
        "LED bulbs use up to 75% less energy than incandescent bulbs. Switching 10 bulbs can save ~1 kWh/day.",
      potentialSavingsKwh: 1,
      category: "general",
    });
  }
  if (tips.length < 3) {
    tips.push({
      id: "star-rated",
      title: "Use 5-star rated appliances",
      description:
        "A 5-star rated AC uses 25–30% less electricity than a 3-star model. Upgrading your most-used appliance can lead to significant long-term savings.",
      potentialSavingsKwh: round2(stats.averageKwh * 0.15),
      category: "general",
    });
  }
  if (tips.length < 3) {
    tips.push({
      id: "natural-ventilation",
      title: "Use natural ventilation when possible",
      description:
        "Opening windows during cooler hours instead of running the AC can save 2–4 kWh per day. Even reducing AC usage by 1 hour saves ~1.5 kWh.",
      potentialSavingsKwh: 1.5,
      category: "general",
    });
  }

  return tips.slice(0, 5);
}

/** Compute variance of kWh values. */
function computeVariance(readings: readonly Reading[]): number {
  if (readings.length < 2) return 0;
  const mean =
    readings.reduce((s, r) => s + r.kwh, 0) / readings.length;
  const sumSquaredDiffs = readings.reduce(
    (s, r) => s + (r.kwh - mean) ** 2,
    0,
  );
  return sumSquaredDiffs / readings.length;
}

/** Round to 2 decimal places. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
