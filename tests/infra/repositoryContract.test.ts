import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRepository } from "@/infra/memoryRepository";
import { SupabaseRepository } from "@/infra/supabaseRepository";
import type { ReadingRepository } from "@/infra/repository";
import type { Reading } from "@/domain/types";
import { isSupabaseConfigured, getEnv } from "@/lib/config";

/**
 * Shared contract test suite for any ReadingRepository implementation.
 * Ensures consistent behavior between Memory and Supabase PostgreSQL adapters.
 */
export function runRepositoryContractTests(
  adapterName: string,
  createRepo: () => Promise<ReadingRepository>,
) {
  describe(`ReadingRepository Contract (${adapterName})`, () => {
    let repo: ReadingRepository;

    beforeEach(async () => {
      repo = await createRepo();
    });

    it("creates and lists spaces", async () => {
      const initialSpaces = await repo.listSpaces();
      expect(initialSpaces.length).toBeGreaterThanOrEqual(1);

      const created = await repo.createSpace("Kitchen");
      expect(created.name).toBe("Kitchen");
      expect(created.id).toBeDefined();

      const spaces = await repo.listSpaces();
      expect(spaces.some((s) => s.id === created.id)).toBe(true);
    });

    it("returns empty page when space has no readings", async () => {
      const page = await repo.getReadings("non-existent-space");
      expect(page.items).toEqual([]);
      expect(page.nextCursor).toBeUndefined();

      const count = await repo.countReadings("non-existent-space");
      expect(count).toBe(0);
    });

    it("upserts and retrieves readings sorted chronologically", async () => {
      const readings: Reading[] = [
        { spaceId: "space-1", date: "2026-10-03", kwh: 7 },
        { spaceId: "space-1", date: "2026-10-01", kwh: 5 },
        { spaceId: "space-1", date: "2026-10-02", kwh: 6 },
      ];

      await repo.upsertReadings("space-1", readings);

      const page = await repo.getReadings("space-1");
      expect(page.items).toHaveLength(3);
      expect(page.items[0].date).toBe("2026-10-01");
      expect(page.items[0].kwh).toBe(5);
      expect(page.items[1].date).toBe("2026-10-02");
      expect(page.items[1].kwh).toBe(6);
      expect(page.items[2].date).toBe("2026-10-03");
      expect(page.items[2].kwh).toBe(7);

      const count = await repo.countReadings("space-1");
      expect(count).toBe(3);
    });

    it("upsert is idempotent and updates kWh for identical (spaceId, date)", async () => {
      await repo.upsertReadings("space-1", [
        { spaceId: "space-1", date: "2026-10-01", kwh: 5 },
      ]);
      await repo.upsertReadings("space-1", [
        { spaceId: "space-1", date: "2026-10-01", kwh: 12 }, // Update
      ]);

      const page = await repo.getReadings("space-1");
      expect(page.items).toHaveLength(1);
      expect(page.items[0].kwh).toBe(12);
    });

    it("filters readings by date range (from and to)", async () => {
      const readings: Reading[] = [
        { spaceId: "space-1", date: "2026-10-01", kwh: 5 },
        { spaceId: "space-1", date: "2026-10-02", kwh: 6 },
        { spaceId: "space-1", date: "2026-10-03", kwh: 7 },
        { spaceId: "space-1", date: "2026-10-04", kwh: 8 },
      ];
      await repo.upsertReadings("space-1", readings);

      const filtered = await repo.getReadings("space-1", {
        from: "2026-10-02",
        to: "2026-10-03",
      });

      expect(filtered.items).toHaveLength(2);
      expect(filtered.items[0].date).toBe("2026-10-02");
      expect(filtered.items[1].date).toBe("2026-10-03");
    });

    it("paginates with limit and cursor", async () => {
      const readings: Reading[] = [
        { spaceId: "space-p", date: "2026-10-01", kwh: 1 },
        { spaceId: "space-p", date: "2026-10-02", kwh: 2 },
        { spaceId: "space-p", date: "2026-10-03", kwh: 3 },
        { spaceId: "space-p", date: "2026-10-04", kwh: 4 },
      ];
      await repo.upsertReadings("space-p", readings);

      // Page 1: limit 2
      const page1 = await repo.getReadings("space-p", { limit: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.items[0].date).toBe("2026-10-01");
      expect(page1.items[1].date).toBe("2026-10-02");
      expect(page1.nextCursor).toBe("2026-10-02");

      // Page 2: with cursor
      const page2 = await repo.getReadings("space-p", {
        limit: 2,
        cursor: page1.nextCursor,
      });
      expect(page2.items).toHaveLength(2);
      expect(page2.items[0].date).toBe("2026-10-03");
      expect(page2.items[1].date).toBe("2026-10-04");
    });

    it("deletes readings for a specific space", async () => {
      await repo.upsertReadings("space-del-1", [
        { spaceId: "space-del-1", date: "2026-10-01", kwh: 5 },
      ]);
      await repo.upsertReadings("space-del-2", [
        { spaceId: "space-del-2", date: "2026-10-01", kwh: 8 },
      ]);

      await repo.deleteReadings("space-del-1");

      expect(await repo.countReadings("space-del-1")).toBe(0);
      expect(await repo.countReadings("space-del-2")).toBe(1);
    });

    it("isolates readings between multiple spaces", async () => {
      await repo.upsertReadings("room-a", [
        { spaceId: "room-a", date: "2026-10-01", kwh: 5 },
      ]);
      await repo.upsertReadings("room-b", [
        { spaceId: "room-b", date: "2026-10-01", kwh: 12 },
      ]);

      const roomA = await repo.getReadings("room-a");
      const roomB = await repo.getReadings("room-b");

      expect(roomA.items).toHaveLength(1);
      expect(roomA.items[0].kwh).toBe(5);

      expect(roomB.items).toHaveLength(1);
      expect(roomB.items[0].kwh).toBe(12);
    });
  });
}

// 1. Run contract tests against in-memory repository
runRepositoryContractTests("MemoryRepository", async () => {
  const repo = new MemoryRepository();
  repo.clear();
  return repo;
});

// 2. Conditionally run against Supabase if credentials are present, otherwise skip
const hasSupabase = isSupabaseConfigured();
describe.skipIf(!hasSupabase)(
  "ReadingRepository Contract (SupabaseRepository)",
  () => {
    const env = getEnv();
    const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    runRepositoryContractTests("SupabaseRepository", async () => {
      return new SupabaseRepository(url, key);
    });
  },
);
