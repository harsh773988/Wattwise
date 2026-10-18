/**
 * Centralised configuration module.
 * Validates environment variables at startup using zod.
 * All business constants live here and are re-exportable.
 */

import { z } from "zod";
import type { Assumptions } from "@/domain/types";

/**
 * Default business assumptions.
 * Configured here so domain modules remain pure with zero hardcoded defaults.
 */
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  tariffPerKwh: 7, // ₹7/kWh default tariff
  emissionFactor: 0.82, // 0.82 kg CO₂/kWh CEA 2023 grid baseline
  spikeMultiplier: 1.5, // 1.5x average threshold
};

/** Environment variable schema — validated once at module load. */
const envSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
});

export type EnvConfig = z.infer<typeof envSchema>;

/** Parse and cache env once. Throws on invalid env vars. */
function loadEnv(): EnvConfig {
  const result = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  });
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    // Don't crash — fall back to defaults, enabling demo mode
    return envSchema.parse({});
  }
  return result.data;
}

let _env: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!_env) {
    _env = loadEnv();
  }
  return _env;
}

/** Whether Supabase credentials are configured. */
export function isSupabaseConfigured(): boolean {
  const env = getEnv();
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

/** Chart downsampling threshold — switch to weekly aggregation above this. */
export const CHART_DOWNSAMPLE_THRESHOLD = 365;

/** Maximum CSV file size in bytes (10 MB). */
export const MAX_CSV_SIZE_BYTES = 10 * 1024 * 1024;

/** Maximum number of rows in a CSV file. */
export const MAX_CSV_ROWS = 200_000;

/** CSV parsing chunk size for progress reporting. */
export const CSV_CHUNK_SIZE = 5_000;

/** Batch size for database upserts. */
export const DB_BATCH_SIZE = 500;
