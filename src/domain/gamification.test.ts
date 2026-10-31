import { describe, expect, it } from "vitest";
import { DEFAULT_GAMIFICATION_CONFIG } from "@/lib/config";
import {
  badgeCatalog,
  communityGoalProgress,
  computePointsForDay,
  computeStreak,
  earnedBadges,
  ledgerPointsTotal,
  rankLeaderboard,
  type DailyResult,
  type LeaderboardEntry,
} from "./gamification";

const daily = (
  date: string,
  actualKwh: number,
  baselineKwh = 10,
): DailyResult => ({ date, actualKwh, baselineKwh });

describe("gamification domain", () => {
  it("awards capped measured points, streak points, and lower capped self-reported points", () => {
    const result = computePointsForDay({
      actualKwh: 5,
      baselineKwh: 10,
      date: "2026-11-01",
      streakDays: 99,
      selfReportedChallengePoints: 100,
    }, DEFAULT_GAMIFICATION_CONFIG);

    expect(result).toEqual({
      reductionPercent: 50,
      measuredPoints: 100,
      streakBonusPoints: 25,
      challengePoints: 30,
      totalPoints: 155,
    });
  });

  it("guards zero baselines, negative usage and non-finite challenge values", () => {
    const result = computePointsForDay({
      actualKwh: -5,
      baselineKwh: 0,
      date: "2026-11-01",
      streakDays: 2,
      selfReportedChallengePoints: Number.NaN,
    }, DEFAULT_GAMIFICATION_CONFIG);

    expect(result.reductionPercent).toBe(0);
    expect(result.measuredPoints).toBe(0);
    expect(result.streakBonusPoints).toBe(0);
    expect(result.challengePoints).toBe(0);
  });

  it("counts only consecutive below-baseline dates, including leap-day boundaries", () => {
    expect(computeStreak([
      daily("2024-02-28", 9),
      daily("2024-02-29", 9),
      daily("2024-03-01", 8),
    ])).toBe(3);
    expect(computeStreak([daily("2026-01-01", 9), daily("2026-01-03", 8)])).toBe(1);
    expect(computeStreak([daily("2026-01-01", 9), daily("2026-01-02", 11)])).toBe(0);
    expect(computeStreak([])).toBe(0);
  });

  it("rejects malformed or impossible daily result dates", () => {
    expect(() => computeStreak([daily("2026-02-30", 8)])).toThrow(RangeError);
  });

  it("awards each badge only when its matching validated signal or action exists", () => {
    const allBadges = earnedBadges({
      dailyResults: Array.from({ length: 8 }, (_, index) => {
        const date = new Date(Date.UTC(2026, 9, 24 + index)).toISOString().slice(0, 10);
        return daily(date, 9);
      }),
      challengesCompleted: 5,
      usedSolarCalculator: true,
    }, DEFAULT_GAMIFICATION_CONFIG);

    expect(allBadges.map((badge) => badge.id)).toEqual(badgeCatalog.map((badge) => badge.id));
    expect(earnedBadges({
      dailyResults: [daily("2026-11-01", 10)],
      challengesCompleted: 0,
      usedSolarCalculator: false,
    }, DEFAULT_GAMIFICATION_CONFIG)).toEqual([]);
  });

  it("handles empty, single, and fair percent-reduction leaderboard ranking", () => {
    expect(rankLeaderboard([])).toEqual([]);

    const single: LeaderboardEntry = {
      id: "one",
      name: "One",
      type: "room",
      totalKwh: 0,
      baselineKwh: 0,
      points: 2,
      peopleCount: 0,
    };
    expect(rankLeaderboard([single])).toMatchObject([
      { rank: 1, percentReduction: 0, perPersonUsageKwh: 0, peopleCount: 1 },
    ]);

    const ranked = rankLeaderboard([
      { ...single, id: "large", name: "Large", totalKwh: 850, baselineKwh: 1000, peopleCount: 100 },
      { ...single, id: "small", name: "Small", totalKwh: 9, baselineKwh: 10, peopleCount: 1 },
      { ...single, id: "best", name: "Best", totalKwh: 160, baselineKwh: 200, peopleCount: 20 },
    ]);
    expect(ranked.map((entry) => entry.id)).toEqual(["best", "large", "small"]);
    expect(ranked[0]?.percentReduction).toBe(20);
  });

  it("uses stable tie-breaks and supports points as an alternate metric", () => {
    const tied: LeaderboardEntry[] = [
      { id: "z", name: "Zed", type: "room", totalKwh: 80, baselineKwh: 100, points: 10, peopleCount: 10 },
      { id: "a", name: "Alpha", type: "room", totalKwh: 8, baselineKwh: 10, points: 10, peopleCount: 1 },
      { id: "b", name: "Beta", type: "room", totalKwh: 90, baselineKwh: 100, points: 50, peopleCount: 1 },
    ];
    expect(rankLeaderboard(tied).map((entry) => entry.id)).toEqual(["a", "z", "b"]);
    expect(rankLeaderboard(tied, "points").map((entry) => entry.id)).toEqual(["b", "a", "z"]);
  });

  it("calculates goal progress without treating missing dates as savings", () => {
    const goal = {
      id: "march-goal",
      space_id: "society",
      target_percent: 10,
      period_start: "2026-03-01",
      period_end: "2026-03-31",
    };
    const progress = communityGoalProgress(goal, [
      { date: "2026-03-01", kwh: 9 },
      { date: "2026-03-31", kwh: 9 },
      { date: "2026-04-01", kwh: 0 },
      { date: "2026-03-01", kwh: -3 },
    ], 10, new Date("2026-03-02T12:00:00Z"));

    expect(progress.baselineKwh).toBe(310);
    expect(progress.actualKwh).toBe(9);
    expect(progress.coveredDays).toBe(2);
    expect(progress.missingDays).toBe(29);
    expect(progress.targetReductionKwh).toBe(31);
    expect(progress.progressPercent).toBe(35.48);
    expect(progress.remainingKwh).toBe(20);
    expect(progress.daysLeft).toBe(30);
  });

  it("handles a zero baseline, completed month, and negative readings", () => {
    const result = communityGoalProgress({
      id: "zero",
      space_id: "x",
      target_percent: 0,
      period_start: "2026-02-28",
      period_end: "2026-03-01",
    }, [{ date: "2026-02-28", kwh: -1 }], 0, new Date("2026-03-02T00:00:00Z"));

    expect(result.baselineKwh).toBe(0);
    expect(result.actualKwh).toBe(0);
    expect(result.progressPercent).toBe(100);
    expect(result.remainingKwh).toBe(0);
    expect(result.daysLeft).toBe(0);
  });

  it("rejects invalid goal ranges, dates, and targets", () => {
    const base = {
      id: "bad",
      space_id: "x",
      target_percent: 10,
      period_start: "2026-03-01",
      period_end: "2026-03-31",
    };
    expect(() => communityGoalProgress({ ...base, period_start: "2026-04-01" }, [], 10)).toThrow(RangeError);
    expect(() => communityGoalProgress({ ...base, period_start: "2026-02-30" }, [], 10)).toThrow(RangeError);
    expect(() => communityGoalProgress({ ...base, target_percent: 101 }, [], 10)).toThrow(RangeError);
  });

  it("totals only non-negative finite ledger points", () => {
    expect(ledgerPointsTotal([
      { profile_id: "p", date: "2026-01-01", source: "a", points: 10, reason: "a" },
      { profile_id: "p", date: "2026-01-02", source: "b", points: -4, reason: "b" },
    ])).toBe(10);
  });
});
