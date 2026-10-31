import { describe, expect, it } from "vitest";
import { calculateChallengeStreak, challengeCatalog, pickDailyChallenges } from "./challenges";
import type { UserProfile } from "./types";

describe("pickDailyChallenges", () => {
  const profile: UserProfile = {
    id: "profile-42",
    name: "Demo user",
    baselineKwhPerDay: 9,
    main_appliances: ["geyser", "washing machine", "ac"],
  };

  it("picks a deterministic set of three challenges for a given date", () => {
    const first = pickDailyChallenges(profile, "2026-10-31", []);
    const second = pickDailyChallenges(profile, "2026-10-31", []);

    expect(first).toHaveLength(3);
    expect(first).toEqual(second);
    expect(first.every((challenge) => challengeCatalog.some((item) => item.id === challenge.id))).toBe(true);
  });

  it("avoids repeats from recent completions", () => {
    const selected = pickDailyChallenges(profile, "2026-11-01", [
      "ac-one-hour-less",
      "full-load-wash",
      "geyser-shifted",
    ]);

    expect(selected.some((challenge) => challenge.id === "ac-one-hour-less")).toBe(false);
    expect(selected).toHaveLength(3);
  });

  it("falls back to the general catalog when appliance data is empty", () => {
    const selected = pickDailyChallenges({ ...profile, main_appliances: [] }, "2026-11-02", []);
    expect(selected).toHaveLength(3);
    expect(selected.some((challenge) => challenge.id === "ac-one-hour-less")).toBe(true);
  });

  it("uses the date as a stable seed for result ordering", () => {
    const today = pickDailyChallenges(profile, "2026-11-03", []);
    const nextDay = pickDailyChallenges(profile, "2026-11-04", []);

    expect(today).not.toEqual(nextDay);
  });

  it("counts a consecutive completion streak from a given date", () => {
    const streak = calculateChallengeStreak(
      [
        { profile_id: "p", challenge_id: "ac-one-hour-less", date: "2026-11-03", points_awarded: 25 },
        { profile_id: "p", challenge_id: "full-load-wash", date: "2026-11-02", points_awarded: 20 },
        { profile_id: "p", challenge_id: "geyser-shifted", date: "2026-11-01", points_awarded: 30 },
      ],
      "2026-11-03",
    );

    expect(streak).toBe(3);
  });

  it("returns zero when no completions are available", () => {
    expect(calculateChallengeStreak([], "2026-11-03")).toBe(0);
  });
});
