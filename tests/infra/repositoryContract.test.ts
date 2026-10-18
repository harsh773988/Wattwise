import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRepository } from "@/infra/memoryRepository";
import type { ReadingRepository } from "@/infra/repository";
import type { Reading } from "@/domain/types";

describe("ReadingRepository Contract (MemoryRepository)", () => {
  let repo: ReadingRepository & { clear?: () => void };

  beforeEach(() => {
    repo = new MemoryRepository();
  });

  it("handles empty store correctly", async () => {
    const readings = await repo.getReadings("space-1");
    expect(readings).toEqual([]);

    const count = await repo.countReadings("space-1");
    expect(count).toBe(0);
  });

  it("inserts and retrieves readings sorted by date ascending", async () => {
    const input: Reading[] = [
      { spaceId: "space-1", date: "2026-10-03", kwh: 7 },
      { spaceId: "space-1", date: "2026-10-01", kwh: 5 },
      { spaceId: "space-1", date: "2026-10-02", kwh: 6 },
    ];
    await repo.upsertReadings(input);

    const result = await repo.getReadings("space-1");
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe("2026-10-01");
    expect(result[1].date).toBe("2026-10-02");
    expect(result[2].date).toBe("2026-10-03");

    const count = await repo.countReadings("space-1");
    expect(count).toBe(3);
  });

  it("upserts existing readings on date conflict instead of duplicating", async () => {
    await repo.upsertReadings([
      { spaceId: "space-1", date: "2026-10-01", kwh: 5 },
    ]);
    await repo.upsertReadings([
      { spaceId: "space-1", date: "2026-10-01", kwh: 9 }, // update
    ]);

    const result = await repo.getReadings("space-1");
    expect(result).toHaveLength(1);
    expect(result[0].kwh).toBe(9);
  });

  it("isolates readings by spaceId", async () => {
    await repo.upsertReadings([
      { spaceId: "room-a", date: "2026-10-01", kwh: 5 },
      { spaceId: "room-b", date: "2026-10-01", kwh: 12 },
    ]);

    const roomA = await repo.getReadings("room-a");
    const roomB = await repo.getReadings("room-b");

    expect(roomA).toHaveLength(1);
    expect(roomA[0].kwh).toBe(5);

    expect(roomB).toHaveLength(1);
    expect(roomB[0].kwh).toBe(12);
  });

  it("supports pagination with offset and limit", async () => {
    const input: Reading[] = [
      { spaceId: "s", date: "2026-10-01", kwh: 1 },
      { spaceId: "s", date: "2026-10-02", kwh: 2 },
      { spaceId: "s", date: "2026-10-03", kwh: 3 },
      { spaceId: "s", date: "2026-10-04", kwh: 4 },
    ];
    await repo.upsertReadings(input);

    const page1 = await repo.getReadings("s", { offset: 0, limit: 2 });
    expect(page1).toHaveLength(2);
    expect(page1[0].kwh).toBe(1);
    expect(page1[1].kwh).toBe(2);

    const page2 = await repo.getReadings("s", { offset: 2, limit: 2 });
    expect(page2).toHaveLength(2);
    expect(page2[0].kwh).toBe(3);
    expect(page2[1].kwh).toBe(4);
  });

  it("deletes readings for a specific space", async () => {
    await repo.upsertReadings([
      { spaceId: "s1", date: "2026-10-01", kwh: 5 },
      { spaceId: "s2", date: "2026-10-01", kwh: 8 },
    ]);

    await repo.deleteReadings("s1");

    expect(await repo.countReadings("s1")).toBe(0);
    expect(await repo.countReadings("s2")).toBe(1);
  });
});
