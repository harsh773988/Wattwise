import { summarizeAdminData } from "@/domain/admin";
import {
  ASSUMED_DEFAULT_BASELINE_KWH_PER_DAY,
  ASSUMED_DEMO_COMMUNITIES,
  EMISSION_FACTOR_KG_PER_KWH,
} from "@/lib/config";
import type { ReadingRepository } from "@/infra/repository";

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function buildAdminSummary(
  repository: ReadingRepository,
  now: Date = new Date(),
) {
  const periodEnd = toIsoDate(now);
  const start = new Date(`${periodEnd}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - 29);
  const periodStart = toIsoDate(start);
  const [spaces, completions] = await Promise.all([
    repository.listSpaces(),
    repository.listChallengeCompletionsInRange(periodStart, periodEnd),
  ]);
  const communityInputs = await Promise.all(spaces.map(async (space) => {
    const { items } = await repository.getReadings(space.id, {
      from: periodStart,
      to: periodEnd,
      limit: 5000,
    });
    return {
      id: space.id,
      name: space.displayName || space.name,
      type: space.type ?? "room" as const,
      baselineKwhPerDay: space.baselineKwhPerDay ?? ASSUMED_DEFAULT_BASELINE_KWH_PER_DAY,
      baselineEstimated: space.baselineKwhPerDay === undefined,
      readings: items,
    };
  }));
  const summary = summarizeAdminData(
    communityInputs,
    completions,
    periodStart,
    periodEnd,
    EMISSION_FACTOR_KG_PER_KWH,
  );
  const demoIds = new Set<string>(ASSUMED_DEMO_COMMUNITIES.map((community) => community.id));

  return {
    ...summary,
    demoDataCommunityIds: summary.communities
      .filter((community) => community.readingDays > 0 && demoIds.has(community.id))
      .map((community) => community.id),
    emissionsEstimate: true,
  };
}
