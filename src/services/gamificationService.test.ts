import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/infra/memoryRepository";
import { buildGamificationOverview } from "./gamificationService";
import { seedDemoCommunities } from "./demoCommunityService";

describe("gamification services", () => {
  it("builds idempotent measured points, streaks, badges and rank", async () => {
    const repository = new MemoryRepository();
    await repository.createSpace("Resident", {
      id: "resident",
      baselineKwhPerDay: 10,
      peopleCount: 2,
      type: "room",
    });
    await repository.upsertReadings("resident", [
      { date: "2026-10-30", kwh: 8 },
      { date: "2026-10-31", kwh: 8 },
      { date: "2026-11-01", kwh: 8 },
    ]);

    const overview = await buildGamificationOverview(
      repository,
      "resident",
      "resident",
      new Date("2026-11-01T12:00:00Z"),
    );
    const repeated = await buildGamificationOverview(
      repository,
      "resident",
      "resident",
      new Date("2026-11-01T12:00:00Z"),
    );

    expect(overview.points).toBeGreaterThan(0);
    expect(repeated.points).toBe(overview.points);
    expect(overview.streak).toBe(3);
    expect(overview.badges.map((badge) => badge.id)).toContain("three-day-streak");
    expect(overview.myRank).toBe(1);
  });

  it("uses an active community goal and reports estimates for unconfigured baselines", async () => {
    const repository = new MemoryRepository();
    await repository.createCommunityGoal({
      id: "current",
      space_id: "default",
      target_percent: 10,
      period_start: "2026-11-01",
      period_end: "2026-11-30",
    });
    await repository.upsertReadings("default", [
      { date: "2026-11-01", kwh: 8 },
    ]);

    const overview = await buildGamificationOverview(
      repository,
      "default",
      "default",
      new Date("2026-11-01T12:00:00Z"),
    );
    expect(overview.goalProgress?.coveredDays).toBe(1);
    expect(overview.goalProgress?.daysLeft).toBe(30);
    expect(overview.leaderboard[0]?.baselineKwh).toBe(10);
  });

  it("seeds five clearly labelled demo communities idempotently", async () => {
    const repository = new MemoryRepository();
    const first = await seedDemoCommunities(repository, "2026-11-01");
    const second = await seedDemoCommunities(repository, "2026-11-01");
    const spaces = await repository.listSpaces();

    expect(first).toEqual({
      label: "Demo data",
      communitiesCreated: 5,
      readingsCreated: 150,
    });
    expect(second).toEqual({
      label: "Demo data",
      communitiesCreated: 0,
      readingsCreated: 0,
    });
    expect(spaces.filter((space) => space.id.startsWith("demo-"))).toHaveLength(5);
  });

  it("rejects an invalid demo seed date", async () => {
    await expect(seedDemoCommunities(new MemoryRepository(), "2026-02-30")).rejects.toThrow(RangeError);
  });
});
