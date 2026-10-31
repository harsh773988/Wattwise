/**
 * Supabase PostgreSQL implementation of the ReadingRepository interface.
 * Server-side only — never imported into browser client bundles.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
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
import { DB_BATCH_SIZE } from "@/lib/config";
import { logger } from "@/lib/logger";

interface DatabaseReading {
  space_id: string;
  date: string;
  kwh: number;
}

interface DatabaseSpace {
  id: string;
  name: string;
  display_name?: string | null;
  type?: Space["type"];
  baseline_kwh_per_day?: number | null;
  people_count?: number | null;
  created_at?: string;
}

interface DatabaseGoal {
  id: string;
  space_id: string;
  target_percent: number;
  period_start: string;
  period_end: string;
  created_at?: string;
}

export class SupabaseRepository implements ReadingRepository {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    if (typeof window !== "undefined") {
      throw new Error("SupabaseRepository is server-only and cannot run in the browser.");
    }
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async listSpaces(): Promise<readonly Space[]> {
    const { data, error } = await this.client
      .from("spaces")
      .select("id, name, display_name, type, baseline_kwh_per_day, people_count, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Failed to list spaces from Supabase", { error });
      throw new Error(`Supabase spaces query failed: ${error.message}`);
    }

    return (data as DatabaseSpace[] || []).map((row) => ({
      id: row.id,
      name: row.name,
      displayName: row.display_name ?? undefined,
      type: row.type,
      baselineKwhPerDay: row.baseline_kwh_per_day === null || row.baseline_kwh_per_day === undefined
        ? undefined
        : Number(row.baseline_kwh_per_day),
      peopleCount: row.people_count === null || row.people_count === undefined
        ? undefined
        : Number(row.people_count),
      createdAt: row.created_at,
    }));
  }

  async createSpace(name: string, details: CreateSpaceDetails = {}): Promise<Space> {
    const id = details.id ?? (name.toLowerCase().replace(/[^a-z0-9_-]/g, "-") || `space-${Date.now()}`);
    const { data, error } = await this.client
      .from("spaces")
      .insert({
        id,
        name,
        display_name: details.displayName,
        type: details.type,
        baseline_kwh_per_day: details.baselineKwhPerDay,
        people_count: details.peopleCount,
      })
      .select("id, name, display_name, type, baseline_kwh_per_day, people_count, created_at")
      .single();

    if (error) {
      logger.error("Failed to create space in Supabase", { error });
      throw new Error(`Supabase createSpace failed: ${error.message}`);
    }

    const row = data as DatabaseSpace;
    return {
      id: row.id,
      name: row.name,
      displayName: row.display_name ?? undefined,
      type: row.type,
      baselineKwhPerDay: row.baseline_kwh_per_day === null || row.baseline_kwh_per_day === undefined
        ? undefined
        : Number(row.baseline_kwh_per_day),
      peopleCount: row.people_count === null || row.people_count === undefined
        ? undefined
        : Number(row.people_count),
      createdAt: row.created_at,
    };
  }

  async getReadings(
    spaceId: string,
    options?: GetReadingsOptions,
  ): Promise<Page<Reading>> {
    let query = this.client
      .from("readings")
      .select("space_id, date, kwh", { count: "exact" })
      .eq("space_id", spaceId)
      .order("date", { ascending: true });

    if (options?.from) {
      query = query.gte("date", options.from);
    }
    if (options?.to) {
      query = query.lte("date", options.to);
    }
    if (options?.cursor) {
      query = query.gt("date", options.cursor);
    }

    const limit = options?.limit ?? 1000;
    if (options?.offset !== undefined) {
      query = query.range(options.offset, options.offset + limit - 1);
    } else {
      query = query.limit(limit);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error("Failed to fetch readings from Supabase", { error });
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    const rows = (data as DatabaseReading[] || []).map((row) => ({
      spaceId: row.space_id,
      date: row.date,
      kwh: Number(row.kwh),
    }));

    const nextCursor =
      rows.length > 0 && count !== null && rows.length < count
        ? rows[rows.length - 1].date
        : undefined;

    return {
      items: rows,
      nextCursor,
      total: count ?? rows.length,
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

    if (readings.length === 0) return;

    // Batch upserts to stay under Postgres statement/parameter thresholds
    for (let i = 0; i < readings.length; i += DB_BATCH_SIZE) {
      const batch = readings.slice(i, i + DB_BATCH_SIZE).map((r) => ({
        space_id: targetSpaceId,
        date: r.date,
        kwh: r.kwh,
      }));

      const { error } = await this.client
        .from("readings")
        .upsert(batch, { onConflict: "space_id,date" });

      if (error) {
        logger.error("Failed to batch upsert readings in Supabase", {
          error,
          batchSize: batch.length,
        });
        throw new Error(`Supabase upsert failed: ${error.message}`);
      }
    }
  }

  async deleteReadings(spaceId: string): Promise<void> {
    const { error } = await this.client
      .from("readings")
      .delete()
      .eq("space_id", spaceId);

    if (error) {
      logger.error("Failed to delete readings from Supabase", { error, spaceId });
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  async countReadings(spaceId: string): Promise<number> {
    const { count, error } = await this.client
      .from("readings")
      .select("*", { count: "exact", head: true })
      .eq("space_id", spaceId);

    if (error) {
      logger.error("Failed to count readings from Supabase", { error, spaceId });
      throw new Error(`Supabase count failed: ${error.message}`);
    }

    return count ?? 0;
  }

  async listChallengeCompletions(profileId: string): Promise<readonly ChallengeCompletion[]> {
    const { data, error } = await this.client
      .from("challenge_completions")
      .select("profile_id, challenge_id, date, points_awarded")
      .eq("profile_id", profileId)
      .order("date", { ascending: true });

    if (error) {
      logger.error("Failed to list challenge completions from Supabase", { error, profileId });
      throw new Error(`Supabase challenge completions query failed: ${error.message}`);
    }

    return (data ?? []) as ChallengeCompletion[];
  }

  async getChallengeCompletion(
    profileId: string,
    challengeId: string,
    date: string,
  ): Promise<ChallengeCompletion | null> {
    const { data, error } = await this.client
      .from("challenge_completions")
      .select("profile_id, challenge_id, date, points_awarded")
      .eq("profile_id", profileId)
      .eq("challenge_id", challengeId)
      .eq("date", date)
      .maybeSingle();

    if (error) {
      logger.error("Failed to fetch challenge completion from Supabase", {
        error,
        profileId,
        challengeId,
        date,
      });
      throw new Error(`Supabase challenge completion query failed: ${error.message}`);
    }

    return (data as ChallengeCompletion | null) ?? null;
  }

  async completeChallenge(
    profileId: string,
    completion: ChallengeCompletion,
  ): Promise<ChallengeCompletion> {
    const { data, error } = await this.client
      .from("challenge_completions")
      .insert({
        profile_id: profileId,
        challenge_id: completion.challenge_id,
        date: completion.date,
        points_awarded: completion.points_awarded,
      })
      .select("profile_id, challenge_id, date, points_awarded")
      .single();

    if (error) {
      logger.error("Failed to insert challenge completion in Supabase", {
        error,
        profileId,
        completion,
      });
      throw new Error(`Supabase challenge completion insert failed: ${error.message}`);
    }

    return data as ChallengeCompletion;
  }

  async listChallengeCompletionsInRange(
    from: string,
    to: string,
  ): Promise<readonly ChallengeCompletion[]> {
    const { data, error } = await this.client
      .from("challenge_completions")
      .select("profile_id, challenge_id, date, points_awarded")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true });

    if (error) {
      logger.error("Failed to list challenge completions in date range", { error, from, to });
      throw new Error(`Supabase challenge completion range query failed: ${error.message}`);
    }

    return (data ?? []) as ChallengeCompletion[];
  }

  async listPointsLedger(profileId: string): Promise<readonly PointsLedgerEntry[]> {
    const { data, error } = await this.client
      .from("points_ledger")
      .select("profile_id, date, source, points, reason")
      .eq("profile_id", profileId)
      .order("date", { ascending: true });

    if (error) {
      logger.error("Failed to list points ledger from Supabase", { error, profileId });
      throw new Error(`Supabase points ledger query failed: ${error.message}`);
    }

    return (data ?? []) as PointsLedgerEntry[];
  }

  async addPointsLedger(entries: readonly PointsLedgerEntry[]): Promise<void> {
    if (entries.length === 0) return;
    const { error } = await this.client
      .from("points_ledger")
      .upsert(entries, { onConflict: "profile_id,date,source", ignoreDuplicates: true });

    if (error) {
      logger.error("Failed to add points to ledger in Supabase", { error, count: entries.length });
      throw new Error(`Supabase points ledger insert failed: ${error.message}`);
    }
  }

  async listCommunityGoals(spaceId?: string): Promise<readonly CommunityGoal[]> {
    let query = this.client
      .from("community_goals")
      .select("id, space_id, target_percent, period_start, period_end, created_at")
      .order("period_start", { ascending: false });
    if (spaceId) {
      query = query.eq("space_id", spaceId);
    }

    const { data, error } = await query;
    if (error) {
      logger.error("Failed to list community goals from Supabase", { error, spaceId });
      throw new Error(`Supabase community goals query failed: ${error.message}`);
    }

    return ((data ?? []) as DatabaseGoal[]).map((row) => ({
      id: row.id,
      space_id: row.space_id,
      target_percent: Number(row.target_percent),
      period_start: row.period_start,
      period_end: row.period_end,
      created_at: row.created_at,
    }));
  }

  async createCommunityGoal(goal: CommunityGoal): Promise<CommunityGoal> {
    const { data, error } = await this.client
      .from("community_goals")
      .insert({
        id: goal.id,
        space_id: goal.space_id,
        target_percent: goal.target_percent,
        period_start: goal.period_start,
        period_end: goal.period_end,
      })
      .select("id, space_id, target_percent, period_start, period_end, created_at")
      .single();

    if (error) {
      logger.error("Failed to create community goal in Supabase", { error, goal });
      throw new Error(`Supabase community goal insert failed: ${error.message}`);
    }

    const row = data as DatabaseGoal;
    return {
      id: row.id,
      space_id: row.space_id,
      target_percent: Number(row.target_percent),
      period_start: row.period_start,
      period_end: row.period_end,
      created_at: row.created_at,
    };
  }
}
