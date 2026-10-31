import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRepository } from "@/infra/memoryRepository";
import type { ReadingRepository } from "@/infra/repository";
import { buildAdminSummary } from "./adminService";

describe("buildAdminSummary", () => {
  let repository: ReadingRepository;

  beforeEach(() => {
    repository = new MemoryRepository();
  });

  it("returns zeroed aggregates for an empty repository", async () => {
    const listSpaces = vi.spyOn(repository, "listSpaces").mockResolvedValue([]);
    const summary = await buildAdminSummary(repository, new Date("2026-06-30T12:00:00.000Z"));

    expect(listSpaces).toHaveBeenCalledOnce();
    expect(summary).toMatchObject({
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
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

  it("builds one community summary with signed savings and aggregate challenge activity", async () => {
    await repository.createSpace("North block", {
      id: "north",
      type: "society",
      baselineKwhPerDay: 20,
    });
    await repository.upsertReadings("north", [
      { date: "2026-06-29", kwh: 15 },
      { date: "2026-06-30", kwh: 22 },
    ]);
    await repository.completeChallenge("resident-1", {
      profile_id: "resident-1",
      challenge_id: "ac-one-hour-less",
      date: "2026-06-30",
      points_awarded: 5,
    });
    const spaces = await repository.listSpaces();
    vi.spyOn(repository, "listSpaces").mockResolvedValue(spaces.filter((space) => space.id === "north"));

    const summary = await buildAdminSummary(repository, new Date("2026-06-30T12:00:00.000Z"));

    expect(summary).toMatchObject({
      communityCount: 1,
      activeUsers: 1,
      totalKwh: 37,
      baselineKwh: 40,
      kwhSaved: 3,
      averagePercentReduction: 7.5,
      challengeCompletionCount: 1,
      topPerformers: [{ id: "north", percentReduction: 7.5 }],
      lowestPerformers: [{ id: "north", percentReduction: 7.5 }],
      communities: [{ id: "north", name: "North block", type: "society", readingDays: 2 }],
    });
    expect(summary.co2SavedKg).toBeCloseTo(2.46);
    expect(summary.trend).toEqual([
      { date: "2026-06-29", percentReduction: 25, kwhSaved: 5 },
      { date: "2026-06-30", percentReduction: -10, kwhSaved: -2 },
    ]);
    expect(JSON.stringify(summary)).not.toContain("resident-1");
    expect(summary.communities[0]).not.toHaveProperty("readings");
  });

  it("returns all tied top and lowest performers with deterministic ordering", async () => {
    for (const id of ["zeta", "alpha"]) {
      await repository.createSpace(id, { id, baselineKwhPerDay: 10 });
      await repository.upsertReadings(id, [{ date: "2026-06-30", kwh: 8 }]);
    }
    const spaces = await repository.listSpaces();
    vi.spyOn(repository, "listSpaces").mockResolvedValue(
      spaces.filter((space) => space.id === "zeta" || space.id === "alpha"),
    );

    const summary = await buildAdminSummary(repository, new Date("2026-06-30T12:00:00.000Z"));

    expect(summary.topPerformers.map(({ id }) => id)).toEqual(["alpha", "zeta"]);
    expect(summary.lowestPerformers.map(({ id }) => id)).toEqual(["alpha", "zeta"]);
    expect(summary.communities.map(({ id }) => id)).toEqual(["alpha", "zeta"]);
  });

  it("uses the assumed baseline and exact rolling 30-day UTC window", async () => {
    await repository.createSpace("Estimate space", { id: "estimated" });
    await repository.upsertReadings("estimated", [
      { date: "2026-06-01", kwh: 8 },
      { date: "2026-05-31", kwh: 5 },
    ]);
    const spaces = await repository.listSpaces();
    vi.spyOn(repository, "listSpaces").mockResolvedValue(spaces.filter((space) => space.id === "estimated"));

    const summary = await buildAdminSummary(repository, new Date("2026-06-30T23:59:00.000Z"));

    expect(summary.communities[0]).toMatchObject({
      baselineKwh: 10,
      baselineEstimated: true,
      totalKwh: 8,
      readingDays: 1,
    });
  });
});
