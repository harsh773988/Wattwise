/**
 * Coordinates stored readings, point records, badges, community rankings and goals.
 */

import {
  computePointsForDay,
  computeStreak,
  communityGoalProgress,
  earnedBadges,
  ledgerPointsTotal,
  rankLeaderboard,
  type DailyResult,
} from "@/domain/gamification";
import type { CommunityGoal, PointsLedgerEntry, Reading } from "@/domain/types";
import { DEFAULT_GAMIFICATION_CONFIG, ASSUMED_DEFAULT_BASELINE_KWH_PER_DAY } from "@/lib/config";
import type { ReadingRepository, Space } from "@/infra/repository";

export interface GamificationOverview {
  readonly profileId: string;
  readonly baselineEstimated: boolean;
  readonly points: number;
  readonly streak: number;
  readonly badges: ReturnType<typeof earnedBadges>;
  readonly leaderboard: ReturnType<typeof rankLeaderboard>;
  readonly myRank: number | null;
  readonly activeGoal: CommunityGoal | null;
  readonly goalProgress: ReturnType<typeof communityGoalProgress> | null;
}

function sumReadings(readings: readonly Reading[]): number {
  return readings.reduce((total, reading) => total + Math.max(0, reading.kwh), 0);
}

function sortedDailyResults(readings: readonly Reading[], baselineKwhPerDay: number): DailyResult[] {
  const unique = new Map<string, Reading>();
  for (const reading of readings) unique.set(reading.date, reading);
  return Array.from(unique.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((reading) => ({
      date: reading.date,
      actualKwh: Math.max(0, reading.kwh),
      baselineKwh: baselineKwhPerDay,
    }));
}

function measuredPointEntries(
  profileId: string,
  dailyResults: readonly DailyResult[],
): PointsLedgerEntry[] {
  return dailyResults.flatMap((result, index) => {
    const streak = computeStreak(dailyResults.slice(0, index + 1));
    const points = computePointsForDay({
      ...result,
      streakDays: streak,
      selfReportedChallengePoints: 0,
    }, DEFAULT_GAMIFICATION_CONFIG);
    const entries: PointsLedgerEntry[] = [];
    if (points.measuredPoints > 0) {
      entries.push({
        profile_id: profileId,
        date: result.date,
        source: "measured-reduction",
        points: points.measuredPoints,
        reason: `Measured ${points.reductionPercent}% reduction against baseline.`,
      });
    }
    if (points.streakBonusPoints > 0) {
      entries.push({
        profile_id: profileId,
        date: result.date,
        source: "measured-streak",
        points: points.streakBonusPoints,
        reason: `${streak} consecutive measured day(s) below baseline.`,
      });
    }
    return entries;
  });
}

async function loadCommunityRows(repository: ReadingRepository, spaces: readonly Space[]) {
  const rows = await Promise.all(spaces.map(async (space) => {
    const { items } = await repository.getReadings(space.id, { limit: 5000 });
    const baseline = space.baselineKwhPerDay ?? ASSUMED_DEFAULT_BASELINE_KWH_PER_DAY;
    await repository.addPointsLedger(measuredPointEntries(
      space.id,
      sortedDailyResults(items, baseline),
    ));
    const profileLedger = await repository.listPointsLedger(space.id);
    return {
      id: space.id,
      name: space.displayName || space.name,
      type: space.type ?? "room",
      totalKwh: sumReadings(items),
      baselineKwh: baseline * items.length,
      points: ledgerPointsTotal(profileLedger),
      peopleCount: space.peopleCount ?? 1,
      baselineEstimated: space.baselineKwhPerDay === undefined,
      perPersonEstimated: space.peopleCount === undefined,
    };
  }));
  return rows;
}

export async function buildGamificationOverview(
  repository: ReadingRepository,
  profileId: string,
  spaceId: string,
  now: Date = new Date(),
): Promise<GamificationOverview> {
  const [spaces, { items: readings }, completions, goals] = await Promise.all([
    repository.listSpaces(),
    repository.getReadings(spaceId, { limit: 5000 }),
    repository.listChallengeCompletions(profileId),
    repository.listCommunityGoals(spaceId),
  ]);
  const space = spaces.find((item) => item.id === spaceId);
  const baseline = space?.baselineKwhPerDay ?? ASSUMED_DEFAULT_BASELINE_KWH_PER_DAY;
  const dailyResults = sortedDailyResults(readings, baseline);
  const measuredEntries = measuredPointEntries(profileId, dailyResults);
  await repository.addPointsLedger(measuredEntries);
  const allLedger = await repository.listPointsLedger(profileId);
  const leaderboard = rankLeaderboard(await loadCommunityRows(repository, spaces));
  const activeGoal = goals
    .filter((goal) => goal.period_start <= now.toISOString().slice(0, 10)
      && goal.period_end >= now.toISOString().slice(0, 10))
    .sort((a, b) => b.period_start.localeCompare(a.period_start))[0] ?? null;
  const goalReadings = activeGoal
    ? readings.filter((reading) => reading.date >= activeGoal.period_start && reading.date <= activeGoal.period_end)
    : [];
  const challengeBadgeStats = {
    dailyResults,
    challengesCompleted: completions.length,
    usedSolarCalculator: allLedger.some((entry) => entry.source === "solar-calculator"),
  };

  return {
    profileId,
    baselineEstimated: space?.baselineKwhPerDay === undefined,
    points: ledgerPointsTotal(allLedger),
    streak: computeStreak(dailyResults),
    badges: earnedBadges(challengeBadgeStats, DEFAULT_GAMIFICATION_CONFIG),
    leaderboard,
    myRank: leaderboard.find((entry) => entry.id === spaceId)?.rank ?? null,
    activeGoal,
    goalProgress: activeGoal
      ? communityGoalProgress(activeGoal, goalReadings, baseline, now)
      : null,
  };
}
