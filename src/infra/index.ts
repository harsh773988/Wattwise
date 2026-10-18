/**
 * Repository provider.
 * Returns SupabaseRepository if configured, otherwise falls back to MemoryRepository.
 */

import { ReadingRepository } from "./repository";
import { MemoryRepository } from "./memoryRepository";
import { SupabaseRepository } from "./supabaseRepository";
import { getEnv, isSupabaseConfigured } from "@/lib/config";
import { logger } from "@/lib/logger";

// Shared memory instance across requests in memory mode
let memoryRepoInstance: MemoryRepository | null = null;
let activeRepoInstance: ReadingRepository | null = null;

export function getRepository(): ReadingRepository {
  if (activeRepoInstance) {
    return activeRepoInstance;
  }

  const env = getEnv();
  if (isSupabaseConfigured() && env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    logger.info("Using SupabaseRepository for persistence");
    activeRepoInstance = new SupabaseRepository(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  } else {
    logger.info("Supabase credentials not found. Falling back to MemoryRepository demo mode.");
    if (!memoryRepoInstance) {
      memoryRepoInstance = new MemoryRepository();
    }
    activeRepoInstance = memoryRepoInstance;
  }

  return activeRepoInstance;
}

/** Helper for tests to override or reset repository instance */
export function setRepository(repo: ReadingRepository | null): void {
  activeRepoInstance = repo;
}
