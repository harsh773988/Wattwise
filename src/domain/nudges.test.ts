import { describe, expect, it } from "vitest";
import { generateNudges } from "./nudges";
import type { UserProfile } from "./types";
import { DEFAULT_NUDGE_CONFIG } from "@/lib/config";

describe("generateNudges", () => {
  const profile: UserProfile = {
    id: "profile-1",
    name: "Demo user",
    baselineKwhPerDay: 10,
    main_appliances: ["geyser", "washing machine", "ac"],
  };

  it("returns prioritized contextual nudges for relevant appliances", () => {
    const now = new Date("2026-10-31T19:00:00Z");
    const nudges = generateNudges(
      profile,
      [
        { date: "2026-10-25", kwh: 12 },
        { date: "2026-10-26", kwh: 11 },
        { date: "2026-10-27", kwh: 10 },
        { date: "2026-10-28", kwh: 14 },
        { date: "2026-10-29", kwh: 12 },
        { date: "2026-10-30", kwh: 13 },
        { date: "2026-10-31", kwh: 16 },
      ],
      now,
    );

    expect(nudges.length).toBeLessThanOrEqual(3);
    expect(nudges[0]?.relatedAppliance).toBeTruthy();
    expect(nudges.some((nudge) => nudge.id === "nudge-ac-curtail")).toBe(true);
  });

  it("returns an empty list when no relevant appliances match", () => {
    const now = new Date("2026-10-31T19:00:00Z");
    const nudges = generateNudges(
      { ...profile, main_appliances: [] },
      [
        { date: "2026-10-25", kwh: 8 },
        { date: "2026-10-26", kwh: 8.1 },
        { date: "2026-10-27", kwh: 7.9 },
      ],
      now,
    );

    expect(nudges).toEqual([]);
  });

  it("adds a baseline warn nudge when recent use exceeds the baseline", () => {
    const now = new Date("2026-10-31T09:00:00Z");
    const nudges = generateNudges(
      profile,
      [
        { date: "2026-10-25", kwh: 9 },
        { date: "2026-10-26", kwh: 12 },
        { date: "2026-10-27", kwh: 13 },
        { date: "2026-10-28", kwh: 11 },
        { date: "2026-10-29", kwh: 12 },
        { date: "2026-10-30", kwh: 10 },
        { date: "2026-10-31", kwh: 14 },
      ],
      now,
    );

    expect(nudges.some((nudge) => nudge.id === "nudge-above-baseline")).toBe(true);
  });

  it("handles non-peak time and standby devices with no duplicate ids", () => {
    const now = new Date("2026-10-31T09:00:00Z");
    const nudges = generateNudges(
      { ...profile, main_appliances: ["ac", "standby", "chargers"] },
      [
        { date: "2026-10-25", kwh: 11 },
        { date: "2026-10-26", kwh: 11.6 },
        { date: "2026-10-27", kwh: 12 },
        { date: "2026-10-28", kwh: 13.4 },
        { date: "2026-10-29", kwh: 14.8 },
        { date: "2026-10-30", kwh: 14.2 },
        { date: "2026-10-31", kwh: 17 },
      ],
      now,
    );

    expect(nudges.some((nudge) => nudge.id === "nudge-ac-curtail")).toBe(true);
    expect(nudges.some((nudge) => nudge.id === "nudge-standby")).toBe(true);
    expect(nudges.some((nudge) => nudge.id === "nudge-above-baseline")).toBe(true);
  });

  it("uses configured peak hours and saving estimates", () => {
    const config = {
      ...DEFAULT_NUDGE_CONFIG,
      peakHourStart: "10:00",
      peakHourEnd: "14:00",
      estimatedSavingsKwh: 3,
      acEstimatedMonthlySavingsKwh: 4,
      baselineEstimatedMonthlySavingsKwh: 5,
      standbyEstimatedMonthlySavingsKwh: 6,
    };
    const nudges = generateNudges(
      { ...profile, main_appliances: ["geyser"] },
      [],
      new Date("2026-10-31T11:00:00"),
      config,
    );

    expect(nudges[0]?.title).toContain("10:00 to 14:00");
    expect(nudges[0]?.estimatedMonthlyKwhSaving).toBe(3);
  });
});
