/**
 * In-memory adapter implementing the ReadingRepository interface.
 * Useful for local testing, demo mode, and offline environments.
 */

import type {
  ChallengeCompletion,
  CommunityGoal,
  PointsLedgerEntry,
  Reading,
} from "@/domain/types";
import type {
  CreateSpaceDetails,
  ReadingRepository,
  Space,
  Page,
  GetReadingsOptions,
} from "./repository";

export class MemoryRepository implements ReadingRepository {
  private spaces: Map<string, Space> = new Map();
  private store: Map<string, Reading[]> = new Map();
  private challengeCompletions: Map<string, ChallengeCompletion> = new Map();
  private pointsLedger: Map<string, PointsLedgerEntry> = new Map();
  private communityGoals: Map<string, CommunityGoal> = new Map();

  constructor() {
    // Initialize with standard default space
    this.spaces.set("default", {
      id: "default",
      name: "My Room",
      createdAt: new Date().toISOString(),
    });
  }

  async listSpaces(): Promise<readonly Space[]> {
    return Array.from(this.spaces.values());
  }

  async createSpace(name: string, details: CreateSpaceDetails = {}): Promise<Space> {
    const id = details.id ?? (name.toLowerCase().replace(/[^a-z0-9_-]/g, "-") || `space-${Date.now()}`);
    const space: Space = {
      id,
      name,
      displayName: details.displayName,
      type: details.type,
      baselineKwhPerDay: details.baselineKwhPerDay,
      peopleCount: details.peopleCount,
      createdAt: new Date().toISOString(),
    };
    this.spaces.set(id, space);
    return space;
  }

  async getReadings(
    spaceId: string,
    options?: GetReadingsOptions,
  ): Promise<Page<Reading>> {
    const list = this.store.get(spaceId) ?? [];

    // Filter by date ranges and cursor
    let filtered = list;
    if (options?.from) {
      filtered = filtered.filter((r) => r.date >= options.from!);
    }
    if (options?.to) {
      filtered = filtered.filter((r) => r.date <= options.to!);
    }
    if (options?.cursor) {
      filtered = filtered.filter((r) => r.date > options.cursor!);
    }

    // Sort chronologically ascending
    const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
    const total = sorted.length;

    // Apply pagination
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? sorted.length;
    const items = sorted.slice(offset, offset + limit);

    let nextCursor: string | undefined = undefined;
    if (items.length > 0 && offset + limit < total) {
      nextCursor = items[items.length - 1].date;
    }

    return {
      items,
      nextCursor,
      total,
    };
  }

  async upsertReadings(
    spaceIdOrReadings: string | readonly Reading[],
    maybeReadings?: readonly Reading[],
  ): Promise<void> {
    let targetSpaceId: string;
    let readings: readonly Reading[];

    if (typeof spaceIdOrReadings === "string") {
      targetSpaceId = spaceIdOrReadings;
      readings = maybeReadings ?? [];
    } else {
      readings = spaceIdOrReadings;
      targetSpaceId = readings[0]?.spaceId ?? "default";
    }

    // Ensure space exists in registry
    if (!this.spaces.has(targetSpaceId)) {
      this.spaces.set(targetSpaceId, {
        id: targetSpaceId,
        name: targetSpaceId,
        createdAt: new Date().toISOString(),
      });
    }

    for (const r of readings) {
      const spaceId = targetSpaceId;
      const existing = this.store.get(spaceId) ?? [];
      const idx = existing.findIndex((e) => e.date === r.date);

      const normalized: Reading = {
        spaceId,
        date: r.date,
        kwh: r.kwh,
      };

      if (idx >= 0) {
        existing[idx] = normalized; // Idempotent update
      } else {
        existing.push(normalized); // Insert
      }
      this.store.set(spaceId, existing);
    }
  }

  async deleteReadings(spaceId: string): Promise<void> {
    this.store.delete(spaceId);
  }

  async countReadings(spaceId: string): Promise<number> {
    return (this.store.get(spaceId) ?? []).length;
  }

  async listChallengeCompletions(profileId: string): Promise<readonly ChallengeCompletion[]> {
    return Array.from(this.challengeCompletions.values()).filter(
      (completion) => completion.profile_id === profileId,
    );
  }

  async getChallengeCompletion(
    profileId: string,
    challengeId: string,
    date: string,
  ): Promise<ChallengeCompletion | null> {
    const key = `${profileId}:${challengeId}:${date}`;
    return this.challengeCompletions.get(key) ?? null;
  }

  async completeChallenge(
    profileId: string,
    completion: ChallengeCompletion,
  ): Promise<ChallengeCompletion> {
    const key = `${profileId}:${completion.challenge_id}:${completion.date}`;
    const existing = this.challengeCompletions.get(key);
    if (existing) {
      return existing;
    }

    const normalized = {
      ...completion,
      profile_id: profileId,
    };
    this.challengeCompletions.set(key, normalized);
    return normalized;
  }

  async listChallengeCompletionsInRange(
    from: string,
    to: string,
  ): Promise<readonly ChallengeCompletion[]> {
    return Array.from(this.challengeCompletions.values())
      .filter((completion) => completion.date >= from && completion.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async listPointsLedger(profileId: string): Promise<readonly PointsLedgerEntry[]> {
    return Array.from(this.pointsLedger.values())
      .filter((entry) => entry.profile_id === profileId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async addPointsLedger(entries: readonly PointsLedgerEntry[]): Promise<void> {
    for (const entry of entries) {
      const key = `${entry.profile_id}:${entry.date}:${entry.source}`;
      if (!this.pointsLedger.has(key)) {
        this.pointsLedger.set(key, entry);
      }
    }
  }

  async listCommunityGoals(spaceId?: string): Promise<readonly CommunityGoal[]> {
    return Array.from(this.communityGoals.values())
      .filter((goal) => !spaceId || goal.space_id === spaceId)
      .sort((a, b) => a.period_start.localeCompare(b.period_start));
  }

  async createCommunityGoal(goal: CommunityGoal): Promise<CommunityGoal> {
    const created = { ...goal, created_at: goal.created_at ?? new Date().toISOString() };
    this.communityGoals.set(goal.id, created);
    return created;
  }

  /** Test helper to reset internal state. */
  clear(): void {
    this.spaces.clear();
    this.store.clear();
    this.challengeCompletions.clear();
    this.pointsLedger.clear();
    this.communityGoals.clear();
    this.spaces.set("default", {
      id: "default",
      name: "My Room",
      createdAt: new Date().toISOString(),
    });
  }
}
