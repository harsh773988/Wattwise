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
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isSupabaseConfigured() && url && key) {
    logger.info("Using SupabaseRepository for persistent storage (Supabase PostgreSQL)");
    activeRepoInstance = new SupabaseRepository(url, key);
  } else {
    logger.info("Using MemoryRepository demo mode (in-memory storage)");
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
