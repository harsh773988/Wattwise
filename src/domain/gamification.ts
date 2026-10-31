/**
 * Pure sustainability rewards and community comparison rules.
 */

import type { CommunityGoal, PointsLedgerEntry, Reading, SpaceType } from "./types";

export interface GamificationConfig {
  readonly pointsPerReductionPercent: number;
  readonly dailyReductionPointsCap: number;
  readonly streakBonusPerDay: number;
  readonly streakBonusDailyCap: number;
  readonly selfReportedChallengeMultiplier: number;
  readonly challengePointsDailyCap: number;
  readonly badgeThresholds: {
    readonly threeDayStreak: number;
    readonly sevenDayStreak: number;
    readonly reductionPercent: number;
    readonly completedChallenges: number;
  };
}

export interface DailyResult {
  readonly date: string;
  readonly actualKwh: number;
  readonly baselineKwh: number;
}

export interface DayPointsInput extends DailyResult {
  readonly streakDays: number;
  readonly selfReportedChallengePoints: number;
}

export interface DayPoints {
  readonly reductionPercent: number;
  readonly measuredPoints: number;
  readonly streakBonusPoints: number;
  readonly challengePoints: number;
  readonly totalPoints: number;
}

export interface BadgeStats {
  readonly dailyResults: readonly DailyResult[];
  readonly challengesCompleted: number;
  readonly usedSolarCalculator: boolean;
}

export interface BadgeDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly requirement: "under-baseline" | "streak" | "reduction" | "challenges" | "solar";
}

export interface LeaderboardEntry {
  readonly id: string;
  readonly name: string;
  readonly type: SpaceType;
  readonly totalKwh: number;
  readonly baselineKwh: number;
  readonly points: number;
  readonly peopleCount: number;
}

export interface RankedLeaderboardEntry extends LeaderboardEntry {
  readonly rank: number;
  readonly percentReduction: number;
  readonly perPersonUsageKwh: number;
}

export type LeaderboardMetric = "percent_reduction" | "points";

export interface GoalProgress {
  readonly goal: CommunityGoal;
  readonly progressPercent: number;
  readonly baselineKwh: number;
  readonly actualKwh: number;
  readonly targetReductionKwh: number;
  readonly achievedReductionKwh: number;
  readonly remainingKwh: number;
  readonly daysLeft: number;
  readonly coveredDays: number;
  readonly missingDays: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function validDate(date: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new RangeError(`Invalid ISO date: ${date}`);
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new RangeError(`Invalid ISO date: ${date}`);
  }
  return parsed;
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function rounded(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function reductionPercent(actualKwh: number, baselineKwh: number): number {
  const baseline = nonNegative(baselineKwh);
  if (baseline <= 0) return 0;
  return rounded(((baseline - nonNegative(actualKwh)) / baseline) * 100);
}

export const badgeCatalog: readonly BadgeDefinition[] = [
  {
    id: "first-day-under-baseline",
    title: "First day under baseline",
    description: "Recorded a day of electricity use below your baseline.",
    requirement: "under-baseline",
  },
  {
    id: "three-day-streak",
    title: "3-day streak",
    description: "Stayed below baseline for three consecutive days.",
    requirement: "streak",
  },
  {
    id: "seven-day-streak",
    title: "7-day streak",
    description: "Stayed below baseline for seven consecutive days.",
    requirement: "streak",
  },
  {
    id: "ten-percent-reduction",
    title: "10% reduction",
    description: "Achieved at least a 10% reduction against your baseline.",
    requirement: "reduction",
  },
  {
    id: "five-challenges",
    title: "Five actions",
    description: "Completed five self-reported sustainability challenges.",
    requirement: "challenges",
  },
  {
    id: "solar-explorer",
    title: "Solar explorer",
    description: "Explored the rooftop solar calculator.",
    requirement: "solar",
  },
];

export function computePointsForDay(input: DayPointsInput, config: GamificationConfig): DayPoints {
  const percent = reductionPercent(input.actualKwh, input.baselineKwh);
  const reductionPoints = Math.min(
    nonNegative(config.dailyReductionPointsCap),
    Math.floor(percent * nonNegative(config.pointsPerReductionPercent)),
  );
  const streakBonus = percent > 0
    ? Math.min(
      nonNegative(config.streakBonusDailyCap),
      nonNegative(input.streakDays) * nonNegative(config.streakBonusPerDay),
    )
    : 0;
  const challengePoints = Math.min(
    nonNegative(config.challengePointsDailyCap),
    Math.floor(nonNegative(input.selfReportedChallengePoints) * nonNegative(config.selfReportedChallengeMultiplier)),
  );

  return {
    reductionPercent: percent,
    measuredPoints: reductionPoints,
    streakBonusPoints: streakBonus,
    challengePoints,
    totalPoints: reductionPoints + streakBonus + challengePoints,
  };
}

export function computeStreak(dailyResults: readonly DailyResult[]): number {
  if (dailyResults.length === 0) return 0;
  const byDate = new Map<string, DailyResult>();
  for (const result of dailyResults) {
    validDate(result.date);
    byDate.set(result.date, result);
  }

  const newestDate = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a))[0];
  if (!newestDate) return 0;

  let date = validDate(newestDate);
  let streak = 0;
  while (true) {
    const key = date.toISOString().slice(0, 10);
    const result = byDate.get(key);
    if (!result || reductionPercent(result.actualKwh, result.baselineKwh) <= 0) break;
    streak += 1;
    date = new Date(date.getTime() - DAY_MS);
  }
  return streak;
}

export function earnedBadges(
  stats: BadgeStats,
  config: GamificationConfig,
): readonly BadgeDefinition[] {
  const streak = computeStreak(stats.dailyResults);
  const hasDayUnderBaseline = stats.dailyResults.some(
    (result) => reductionPercent(result.actualKwh, result.baselineKwh) > 0,
  );
  const overallBaseline = stats.dailyResults.reduce((sum, day) => sum + nonNegative(day.baselineKwh), 0);
  const overallActual = stats.dailyResults.reduce((sum, day) => sum + nonNegative(day.actualKwh), 0);
  const overallPercent = reductionPercent(overallActual, overallBaseline);

  return badgeCatalog.filter((badge) => {
    switch (badge.requirement) {
      case "under-baseline":
        return hasDayUnderBaseline;
      case "streak":
        return streak >= (badge.id === "three-day-streak"
          ? config.badgeThresholds.threeDayStreak
          : config.badgeThresholds.sevenDayStreak);
      case "reduction":
        return overallPercent >= config.badgeThresholds.reductionPercent;
      case "challenges":
        return nonNegative(stats.challengesCompleted) >= config.badgeThresholds.completedChallenges;
      case "solar":
        return stats.usedSolarCalculator;
    }
  });
}

export function rankLeaderboard(
  entries: readonly LeaderboardEntry[],
  metric: LeaderboardMetric = "percent_reduction",
): readonly RankedLeaderboardEntry[] {
  const ranked = entries.map((entry) => {
    const totalKwh = nonNegative(entry.totalKwh);
    const baselineKwh = nonNegative(entry.baselineKwh);
    const peopleCount = Math.max(1, Math.floor(nonNegative(entry.peopleCount)));
    return {
      ...entry,
      totalKwh,
      baselineKwh,
      points: nonNegative(entry.points),
      peopleCount,
      percentReduction: reductionPercent(totalKwh, baselineKwh),
      perPersonUsageKwh: rounded(totalKwh / peopleCount),
      rank: 0,
    };
  });

  ranked.sort((a, b) => {
    if (metric === "points" && a.points !== b.points) return b.points - a.points;
    return b.percentReduction - a.percentReduction
      || b.points - a.points
      || a.perPersonUsageKwh - b.perPersonUsageKwh
      || a.id.localeCompare(b.id)
      || a.name.localeCompare(b.name);
  });

  return ranked.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function communityGoalProgress(
  goal: CommunityGoal,
  readings: readonly Reading[],
  baselineKwhPerDay: number,
  now: Date = new Date(),
): GoalProgress {
  const periodStart = validDate(goal.period_start);
  const periodEnd = validDate(goal.period_end);
  if (periodStart.getTime() > periodEnd.getTime()) {
    throw new RangeError("Goal period start must not be after its end.");
  }
  if (!Number.isFinite(goal.target_percent) || goal.target_percent < 0 || goal.target_percent > 100) {
    throw new RangeError("Goal target percent must be between 0 and 100.");
  }
  const nowDate = validDate(now.toISOString().slice(0, 10));
  const periodDays = Math.floor((periodEnd.getTime() - periodStart.getTime()) / DAY_MS) + 1;
  const inPeriod = readings.filter((reading) => {
    validDate(reading.date);
    return reading.date >= goal.period_start && reading.date <= goal.period_end;
  });
  const distinctReadings = new Map<string, Reading>();
  for (const reading of inPeriod) distinctReadings.set(reading.date, reading);

  const baseline = nonNegative(baselineKwhPerDay) * periodDays;
  const actual = Array.from(distinctReadings.values()).reduce(
    (sum, reading) => sum + nonNegative(reading.kwh),
    0,
  );
  const observedBaseline = nonNegative(baselineKwhPerDay) * distinctReadings.size;
  const achievedReduction = observedBaseline - actual;
  const targetReduction = baseline * goal.target_percent / 100;
  const progress = targetReduction === 0
    ? (achievedReduction >= 0 ? 100 : 0)
    : Math.max(0, Math.min(100, (achievedReduction / targetReduction) * 100));
  const daysLeft = nowDate.getTime() > periodEnd.getTime()
    ? 0
    : Math.max(0, Math.floor((periodEnd.getTime() - Math.max(nowDate.getTime(), periodStart.getTime())) / DAY_MS) + 1);

  return {
    goal,
    progressPercent: rounded(progress),
    baselineKwh: rounded(baseline),
    actualKwh: rounded(actual),
    targetReductionKwh: rounded(targetReduction),
    achievedReductionKwh: rounded(achievedReduction),
    remainingKwh: rounded(Math.max(0, targetReduction - achievedReduction)),
    daysLeft,
    coveredDays: distinctReadings.size,
    missingDays: Math.max(0, periodDays - distinctReadings.size),
  };
}

export function ledgerPointsTotal(entries: readonly PointsLedgerEntry[]): number {
  return entries.reduce((sum, entry) => sum + nonNegative(entry.points), 0);
}
