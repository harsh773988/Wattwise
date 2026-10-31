/**
 * Behavioural nudges for household electricity-saving actions.
 * Pure domain logic only: no React, fetch, or environment access.
 */

import type { Nudge, Reading, UserProfile } from "./types";
import { ASSUMED_PEAK_HOUR_END, ASSUMED_PEAK_HOUR_START, DEFAULT_NUDGE_CONFIG } from "@/lib/config";

export interface NudgeConfig {
  readonly peakHourStart: string;
  readonly peakHourEnd: string;
  readonly baselineToleranceKwh: number;
  readonly estimatedSavingsKwh: number;
}

const DEFAULT_NUDGE_MESSAGE_MAP: Record<string, string> = {
  geyser: "Shift your geyser to before 18:00 or after 22:00 to avoid the evening peak window.",
  "washing machine": "Run the washing machine with a full load outside the assumed peak hours.",
  iron: "Press clothes early in the day or after peak hours to reduce evening demand.",
  pump: "Schedule pumping later, when evening demand usually falls.",
  ac: "Pre-cool early or slightly raise the thermostat for the next hour.",
  lights: "Switch off lights in empty rooms and use task lighting instead.",
  standby: "Unplug standby chargers and adapters overnight to reduce phantom load.",
};

function clamp(name: string): string {
  return name.trim().toLowerCase();
}

function resolveRelatedAppliance(profile: UserProfile, appliance?: string): string | undefined {
  const normalized = appliance ? clamp(appliance) : "";
  if (!normalized) {
    return profile.main_appliances[0];
  }

  return profile.main_appliances.find((item) => clamp(item) === normalized) ?? normalized;
}

function dailyAverage(readings: readonly Reading[]): number {
  if (readings.length === 0) return 0;
  return readings.reduce((sum, r) => sum + r.kwh, 0) / readings.length;
}

function formatPeakWindow(config: NudgeConfig): string {
  return `${config.peakHourStart} to ${config.peakHourEnd}`;
}

export function generateNudges(
  profile: UserProfile,
  recentReadings: readonly Reading[],
  now: Date,
  config: NudgeConfig = DEFAULT_NUDGE_CONFIG,
): readonly Nudge[] {
  const items: Nudge[] = [];
  const hour = now.getHours();
  const inPeakWindow = hour >= Number(config.peakHourStart.slice(0, 2)) && hour < Number(config.peakHourEnd.slice(0, 2));
  const baselineAverage = dailyAverage(recentReadings.slice(-7));
  const latestReading = recentReadings[recentReadings.length - 1];

  const pushApplianceNudge = (appliance: string, title: string, message: string, reason: string, estimatedSaving = config.estimatedSavingsKwh): void => {
    const related = resolveRelatedAppliance(profile, appliance);
    if (profile.main_appliances.length === 0 || !profile.main_appliances.find((item) => clamp(item) === clamp(appliance))) {
      return;
    }

    items.push({
      id: `nudge-${clamp(appliance)}`,
      title,
      message,
      estimatedMonthlyKwhSaving: estimatedSaving,
      relatedAppliance: related,
      reason,
    });
  };

  if (inPeakWindow) {
    const peakAppliances = ["geyser", "washing machine", "iron", "pump"];
    for (const appliance of peakAppliances) {
      pushApplianceNudge(
        appliance,
        `Shift ${appliance} outside ${formatPeakWindow(config)}`,
        DEFAULT_NUDGE_MESSAGE_MAP[appliance] ?? `Run ${appliance} outside the assumed peak window to ease evening demand.`,
        `Assumed peak window ${formatPeakWindow(config)} typically raises evening demand.`,
      );
    }
  }

  if (profile.main_appliances.some((appliance) => clamp(appliance) === "ac")) {
    items.push({
      id: "nudge-ac-curtail",
      title: "Pre-cool early and reduce AC use",
      message: "Set the AC to a slightly higher setting for an hour this evening and pre-cool the room early.",
      estimatedMonthlyKwhSaving: 1.8,
      relatedAppliance: "AC",
      reason: "AC use tends to spike in the evening and can be reduced with small scheduling changes.",
    });
  }

  if (baselineAverage > 0 && latestReading && latestReading.kwh > profile.baselineKwhPerDay + config.baselineToleranceKwh) {
    items.push({
      id: "nudge-above-baseline",
      title: "You are above your baseline",
      message: `Yesterday was ${latestReading.kwh.toFixed(1)} kWh, above your baseline of ${profile.baselineKwhPerDay.toFixed(1)} kWh/day. Try to trim one high-draw task today.`,
      estimatedMonthlyKwhSaving: 2.1,
      relatedAppliance: profile.main_appliances[0],
      reason: "Recent daily use is above the resident's baseline and suggests a specific reduction opportunity.",
    });
  }

  if (profile.main_appliances.some((appliance) => clamp(appliance) === "standby" || clamp(appliance) === "chargers")) {
    items.push({
      id: "nudge-standby",
      title: "Unplug standby devices overnight",
      message: "Turn off chargers, adapters, and other standby loads overnight to reduce phantom power draw.",
      estimatedMonthlyKwhSaving: 0.8,
      relatedAppliance: "Standby devices",
      reason: "Idle electronics continue drawing power even when not actively used.",
    });
  }

  const deduped = items.filter((item, index, arr) => arr.findIndex((candidate) => candidate.id === item.id) === index);
  const ordered = deduped.slice(0, 3);
  return ordered;
}

export const PEAK_WINDOW_START = ASSUMED_PEAK_HOUR_START;
export const PEAK_WINDOW_END = ASSUMED_PEAK_HOUR_END;
