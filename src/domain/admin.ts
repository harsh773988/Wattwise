import type { Reading, SpaceType } from "./types";

export interface AdminCommunityInput {
  readonly id: string;
  readonly name: string;
  readonly type: SpaceType;
  readonly baselineKwhPerDay: number;
  readonly baselineEstimated: boolean;
  readonly readings: readonly Reading[];
}

export interface AdminChallengeCompletion {
  readonly profile_id: string;
  readonly challenge_id: string;
  readonly date: string;
}

export interface AdminCommunitySummary {
  readonly id: string;
  readonly name: string;
  readonly type: SpaceType;
  readonly totalKwh: number;
  readonly baselineKwh: number;
  readonly kwhSaved: number;
  readonly co2SavedKg: number;
  readonly percentReduction: number;
  readonly readingDays: number;
  readonly baselineEstimated: boolean;
}

export interface RegionalTrendPoint {
  readonly date: string;
  readonly percentReduction: number;
  readonly kwhSaved: number;
}

export interface AdminSummary {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly communityCount: number;
  readonly activeUsers: number;
  readonly activeUsersDefinition: string;
  readonly totalKwh: number;
  readonly baselineKwh: number;
  readonly kwhSaved: number;
  readonly co2SavedKg: number;
  readonly averagePercentReduction: number;
  readonly topPerformers: readonly AdminCommunitySummary[];
  readonly lowestPerformers: readonly AdminCommunitySummary[];
  readonly trend: readonly RegionalTrendPoint[];
  readonly challengeCompletionCount: number;
  readonly challengeCompletionCountsByDate: readonly { readonly date: string; readonly count: number }[];
  readonly communities: readonly AdminCommunitySummary[];
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function summarizeAdminData(
  communities: readonly AdminCommunityInput[],
  completions: readonly AdminChallengeCompletion[],
  periodStart: string,
  periodEnd: string,
  emissionFactorKgPerKwh: number,
): AdminSummary {
  const summaries = communities.map((community): AdminCommunitySummary => {
    const readingsByDate = new Map<string, Reading>();
    for (const reading of community.readings) {
      if (reading.date >= periodStart && reading.date <= periodEnd) {
        readingsByDate.set(reading.date, reading);
      }
    }

    const readings = Array.from(readingsByDate.values());
    const baseline = nonNegative(community.baselineKwhPerDay) * readings.length;
    const actual = readings.reduce((sum, reading) => sum + nonNegative(reading.kwh), 0);
    const saved = baseline - actual;
    return {
      id: community.id,
      name: community.name,
      type: community.type,
      totalKwh: round2(actual),
      baselineKwh: round2(baseline),
      kwhSaved: round2(saved),
      co2SavedKg: round2(saved * nonNegative(emissionFactorKgPerKwh)),
      percentReduction: baseline > 0 ? round2((saved / baseline) * 100) : 0,
      readingDays: readings.length,
      baselineEstimated: community.baselineEstimated,
    };
  });

  const measuredCommunities = summaries.filter((community) => community.readingDays > 0);
  const totalKwh = summaries.reduce((sum, community) => sum + community.totalKwh, 0);
  const baselineKwh = summaries.reduce((sum, community) => sum + community.baselineKwh, 0);
  const kwhSaved = summaries.reduce((sum, community) => sum + community.kwhSaved, 0);
  const dailyReadings = new Map<string, { actual: number; baseline: number }>();

  for (const community of communities) {
    const readingsByDate = new Map<string, Reading>();
    for (const reading of community.readings) {
      if (reading.date >= periodStart && reading.date <= periodEnd) {
        readingsByDate.set(reading.date, reading);
      }
    }
    for (const reading of readingsByDate.values()) {
      const current = dailyReadings.get(reading.date) ?? { actual: 0, baseline: 0 };
      current.actual += nonNegative(reading.kwh);
      current.baseline += nonNegative(community.baselineKwhPerDay);
      dailyReadings.set(reading.date, current);
    }
  }

  const trend = Array.from(dailyReadings.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, daily]) => {
      const saved = daily.baseline - daily.actual;
      return {
        date,
        percentReduction: daily.baseline > 0 ? round2((saved / daily.baseline) * 100) : 0,
        kwhSaved: round2(saved),
      };
    });

  const challengeCounts = new Map<string, number>();
  const activeProfiles = new Set<string>();
  for (const completion of completions) {
    if (completion.date < periodStart || completion.date > periodEnd) continue;
    challengeCounts.set(completion.date, (challengeCounts.get(completion.date) ?? 0) + 1);
    activeProfiles.add(completion.profile_id);
  }

  const orderByPerformance = (a: AdminCommunitySummary, b: AdminCommunitySummary) =>
    b.percentReduction - a.percentReduction
    || a.name.localeCompare(b.name)
    || a.id.localeCompare(b.id);
  const orderedCommunities = [...summaries].sort(orderByPerformance);
  const orderedMeasuredCommunities = [...measuredCommunities].sort(orderByPerformance);
  const topValue = orderedMeasuredCommunities[0]?.percentReduction;
  const lowestValue = orderedMeasuredCommunities.at(-1)?.percentReduction;

  return {
    periodStart,
    periodEnd,
    communityCount: summaries.length,
    activeUsers: activeProfiles.size,
    activeUsersDefinition: "Unique profiles that completed at least one challenge during this period.",
    totalKwh: round2(totalKwh),
    baselineKwh: round2(baselineKwh),
    kwhSaved: round2(kwhSaved),
    co2SavedKg: round2(kwhSaved * nonNegative(emissionFactorKgPerKwh)),
    averagePercentReduction: measuredCommunities.length > 0
      ? round2(measuredCommunities.reduce((sum, community) => sum + community.percentReduction, 0) / measuredCommunities.length)
      : 0,
    topPerformers: topValue === undefined
      ? []
      : orderedMeasuredCommunities.filter((community) => community.percentReduction === topValue),
    lowestPerformers: lowestValue === undefined
      ? []
      : orderedMeasuredCommunities.filter((community) => community.percentReduction === lowestValue),
    trend,
    challengeCompletionCount: Array.from(challengeCounts.values()).reduce((sum, count) => sum + count, 0),
    challengeCompletionCountsByDate: Array.from(challengeCounts.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, count]) => ({ date, count })),
    communities: orderedCommunities,
  };
}
