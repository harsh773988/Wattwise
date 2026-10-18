/**
 * Repository interface for reading storage.
 * Any adapter (Supabase, in-memory, etc.) must implement this contract.
 */

import type { Reading } from "@/domain/types";

export interface ReadingRepository {
  /** Get all readings for a space, sorted by date ascending. */
  getReadings(spaceId: string, options?: PaginationOptions): Promise<readonly Reading[]>;

  /** Upsert readings (insert or update on date conflict). */
  upsertReadings(readings: readonly Reading[]): Promise<void>;

  /** Delete all readings for a space. */
  deleteReadings(spaceId: string): Promise<void>;

  /** Count readings for a space. */
  countReadings(spaceId: string): Promise<number>;
}

export interface PaginationOptions {
  readonly offset?: number;
  readonly limit?: number;
}
