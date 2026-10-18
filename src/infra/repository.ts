/**
 * Repository interface for spaces and electricity readings storage.
 * Follows the repository pattern to abstract underlying persistence (In-memory, Supabase Postgres, etc.).
 */

import type { Reading } from "@/domain/types";

export interface Space {
  readonly id: string;
  readonly name: string;
  readonly createdAt?: string;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor?: string;
  readonly total?: number;
}

export interface GetReadingsOptions {
  readonly from?: string;
  readonly to?: string;
  readonly limit?: number;
  readonly cursor?: string;
  readonly offset?: number; // backwards compatibility
}

export interface ReadingRepository {
  /** List all spaces. */
  listSpaces(): Promise<readonly Space[]>;

  /** Create a new space. */
  createSpace(name: string): Promise<Space>;

  /**
   * Get paginated readings for a space with optional date range filters.
   * Returns a typed Page<Reading>.
   */
  getReadings(
    spaceId: string,
    options?: GetReadingsOptions,
  ): Promise<Page<Reading>>;

  /**
   * Upsert readings for a space (bulk, idempotent by (spaceId, date)).
   * If a reading for the same date already exists in the space, updates its kWh.
   */
  upsertReadings(
    spaceId: string,
    readings: readonly Reading[],
  ): Promise<void>;
  upsertReadings(
    readings: readonly Reading[],
  ): Promise<void>;

  /** Delete all readings for a space. */
  deleteReadings(spaceId: string): Promise<void>;

  /** Count total readings for a space. */
  countReadings(spaceId: string): Promise<number>;
}
