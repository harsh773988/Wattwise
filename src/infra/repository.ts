/**
 * Repository interface for spaces and electricity readings storage.
 * Follows the repository pattern to abstract underlying persistence (In-memory, Supabase Postgres, etc.).
 */

import type {
  ChallengeCompletion,
  CommunityGoal,
  PointsLedgerEntry,
  Reading,
  SpaceType,
} from "@/domain/types";

export interface Space {
  readonly id: string;
  readonly name: string;
  readonly ownerId?: string;
  readonly displayName?: string;
  readonly type?: SpaceType;
  readonly baselineKwhPerDay?: number;
  readonly peopleCount?: number;
  readonly createdAt?: string;
}

export interface CreateSpaceDetails {
  readonly id?: string;
  readonly ownerId?: string;
  readonly displayName?: string;
  readonly type?: SpaceType;
  readonly baselineKwhPerDay?: number;
  readonly peopleCount?: number;
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
  createSpace(name: string, details?: CreateSpaceDetails): Promise<Space>;

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

  /** Retrieve all completed challenges for a profile. */
  listChallengeCompletions(profileId: string): Promise<readonly ChallengeCompletion[]>;

  /** Fetch a single challenge completion for a given date. */
  getChallengeCompletion(
    profileId: string,
    challengeId: string,
    date: string,
  ): Promise<ChallengeCompletion | null>;

  /** Record a challenge completion once per profile/date/challenge key. */
  completeChallenge(
    profileId: string,
    completion: ChallengeCompletion,
  ): Promise<ChallengeCompletion>;
  /** List challenge records in an inclusive date range for aggregate reporting. */
  listChallengeCompletionsInRange(
    from: string,
    to: string,
  ): Promise<readonly ChallengeCompletion[]>;

  listPointsLedger(profileId: string): Promise<readonly PointsLedgerEntry[]>;
  addPointsLedger(entries: readonly PointsLedgerEntry[]): Promise<void>;
  listCommunityGoals(spaceId?: string): Promise<readonly CommunityGoal[]>;
  createCommunityGoal(goal: CommunityGoal): Promise<CommunityGoal>;
}
