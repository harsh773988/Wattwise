import { describe, expect, it } from "vitest";
import { summarizeAdminData } from "./admin";

describe("summarizeAdminData", () => {
  const start = "2026-06-01";
  const end = "2026-06-30";

  it("returns empty aggregates when there are no communities or completions", () => {
    expect(summarizeAdminData([], [], start, end, 0.8)).toMatchObject({
      communityCount: 0,
      activeUsers: 0,
      totalKwh: 0,
      baselineKwh: 0,
      kwhSaved: 0,
      co2SavedKg: 0,
      averagePercentReduction: 0,
      topPerformers: [],
      lowestPerformers: [],
      trend: [],
      challengeCompletionCount: 0,
      communities: [],
    });
  });

  it("deduplicates dates, filters outside the period, and sanitizes negative values", () => {
    const summary = summarizeAdminData([{
      id: "c1",
      name: "One",
      type: "room",
      baselineKwhPerDay: 10,
      baselineEstimated: false,
      readings: [
        { date: "2026-06-30", kwh: 5 },
        { date: "2026-06-30", kwh: 7 },
        { date: "2026-05-31", kwh: 100 },
        { date: "2026-06-29", kwh: -5 },
      ],
    }], [], start, end, 0.8);

    expect(summary.communities[0]).toMatchObject({
      totalKwh: 7,
      baselineKwh: 20,
      kwhSaved: 13,
      readingDays: 2,
    });
    expect(summary.trend).toEqual([
      { date: "2026-06-29", percentReduction: 100, kwhSaved: 10 },
      { date: "2026-06-30", percentReduction: 30, kwhSaved: 3 },
    ]);
  });

  it("handles zero baselines, invalid emission factors, and challenge date boundaries", () => {
    const summary = summarizeAdminData([{
      id: "zero",
      name: "Zero baseline",
      type: "room",
      baselineKwhPerDay: 0,
      baselineEstimated: false,
      readings: [{ date: start, kwh: 4 }],
    }], [
      { profile_id: "included", challenge_id: "task", date: start },
      { profile_id: "included", challenge_id: "task2", date: end },
      { profile_id: "excluded", challenge_id: "task", date: "2026-05-31" },
    ], start, end, Number.NaN);

    expect(summary.communities[0].percentReduction).toBe(0);
    expect(summary.co2SavedKg).toBe(0);
    expect(summary.activeUsers).toBe(1);
    expect(summary.challengeCompletionCount).toBe(2);
    expect(summary.challengeCompletionCountsByDate).toEqual([
      { date: start, count: 1 },
      { date: end, count: 1 },
    ]);
  });
});
