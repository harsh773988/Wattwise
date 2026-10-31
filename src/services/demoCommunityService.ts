import { ASSUMED_DEMO_COMMUNITIES, ASSUMED_DEMO_READING_DAYS } from "@/lib/config";
import type { ReadingRepository } from "@/infra/repository";
import type { SpaceType } from "@/domain/types";

export interface DemoCommunitySeedResult {
  readonly label: "Demo data";
  readonly communitiesCreated: number;
  readonly readingsCreated: number;
}

export async function seedDemoCommunities(
  repository: ReadingRepository,
  today: string,
): Promise<DemoCommunitySeedResult> {
  const endDate = new Date(`${today}T00:00:00.000Z`);
  if (Number.isNaN(endDate.getTime()) || endDate.toISOString().slice(0, 10) !== today) {
    throw new RangeError(`Invalid seed date: ${today}`);
  }
  const existingSpaces = await repository.listSpaces();
  const spacesById = new Map(existingSpaces.map((space) => [space.id, space]));
  let readingsCreated = 0;

  for (const demo of ASSUMED_DEMO_COMMUNITIES) {
    const type: SpaceType = demo.type;
    const space = spacesById.get(demo.id) ?? await repository.createSpace(demo.id, {
      id: demo.id,
      displayName: demo.displayName,
      type,
      baselineKwhPerDay: demo.baselineKwhPerDay,
      peopleCount: demo.peopleCount,
    });
    const existingCount = await repository.countReadings(space.id);
    if (existingCount > 0) continue;

    const readings = Array.from({ length: ASSUMED_DEMO_READING_DAYS }, (_, index) => {
      const date = new Date(endDate.getTime() - (ASSUMED_DEMO_READING_DAYS - 1 - index) * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      return {
        spaceId: space.id,
        date,
        kwh: demo.dailyUseKwh,
      };
    });
    await repository.upsertReadings(space.id, readings);
    readingsCreated += readings.length;
  }

  const communitiesCreated = Math.max(0, ASSUMED_DEMO_COMMUNITIES.length - existingSpaces.filter(
    (space) => ASSUMED_DEMO_COMMUNITIES.some((demo) => demo.id === space.id),
  ).length);
  return {
    label: "Demo data",
    communitiesCreated,
    readingsCreated,
  };
}
