/**
 * Supabase implementation of the ReadingRepository interface.
 * Accesses Postgres via Supabase client, supporting spaces and batching.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Reading } from "@/domain/types";
import type { ReadingRepository, PaginationOptions } from "./repository";
import { DB_BATCH_SIZE } from "@/lib/config";
import { logger } from "@/lib/logger";

interface DatabaseReading {
  space_id: string;
  date: string;
  kwh: number;
}

export class SupabaseRepository implements ReadingRepository {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    this.client = createClient(supabaseUrl, supabaseAnonKey);
  }

  async getReadings(
    spaceId: string,
    options?: PaginationOptions,
  ): Promise<readonly Reading[]> {
    let query = this.client
      .from("readings")
      .select("space_id, date, kwh")
      .eq("space_id", spaceId)
      .order("date", { ascending: true });

    if (options?.offset !== undefined && options?.limit !== undefined) {
      query = query.range(options.offset, options.offset + options.limit - 1);
    } else if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Failed to fetch readings from Supabase", { error });
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    return (data as DatabaseReading[] || []).map((row) => ({
      spaceId: row.space_id,
      date: row.date,
      kwh: Number(row.kwh),
    }));
  }

  async upsertReadings(readings: readonly Reading[]): Promise<void> {
    if (readings.length === 0) return;

    // Batch upserts to stay under Supabase statement/parameter limits
    for (let i = 0; i < readings.length; i += DB_BATCH_SIZE) {
      const batch = readings.slice(i, i + DB_BATCH_SIZE).map((r) => ({
        space_id: r.spaceId,
        date: r.date,
        kwh: r.kwh,
      }));

      const { error } = await this.client
        .from("readings")
        .upsert(batch, { onConflict: "space_id,date" });

      if (error) {
        logger.error("Failed to batch upsert readings in Supabase", { error, batchSize: batch.length });
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
}
