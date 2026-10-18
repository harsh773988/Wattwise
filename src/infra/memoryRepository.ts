/**
 * In-memory repository adapter.
 * Used when Supabase env vars are not configured (demo mode).
 * Implements the same contract as the Supabase adapter.
 */

import type { Reading } from "@/domain/types";
import type { ReadingRepository, PaginationOptions } from "./repository";

export class MemoryRepository implements ReadingRepository {
  private store: Map<string, Reading[]> = new Map();

  async getReadings(
    spaceId: string,
    options?: PaginationOptions,
  ): Promise<readonly Reading[]> {
    const readings = this.store.get(spaceId) ?? [];
    const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? sorted.length;
    return sorted.slice(offset, offset + limit);
  }

  async upsertReadings(readings: readonly Reading[]): Promise<void> {
    for (const r of readings) {
      const existing = this.store.get(r.spaceId) ?? [];
      const idx = existing.findIndex(
        (e) => e.date === r.date,
      );
      if (idx >= 0) {
        existing[idx] = r;
      } else {
        existing.push(r);
      }
      this.store.set(r.spaceId, existing);
    }
  }

  async deleteReadings(spaceId: string): Promise<void> {
    this.store.delete(spaceId);
  }

  async countReadings(spaceId: string): Promise<number> {
    return (this.store.get(spaceId) ?? []).length;
  }

  /** Reset all data (for testing). */
  clear(): void {
    this.store.clear();
  }
}
