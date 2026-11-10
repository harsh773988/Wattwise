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
export const EMISSION_FACTOR_KG_PER_KWH = 0.82;
export const EMISSION_FACTOR_SOURCE = "Approximate India grid average (configurable)";

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  tariffPerKwh: 7, // ₹7/kWh default tariff
  emissionFactor: EMISSION_FACTOR_KG_PER_KWH,
  spikeMultiplier: 1.5, // 1.5x average threshold
};

/** Environment variable schema — validated once at module load. */
const envSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_GA_ID: z.string().trim().min(1).optional(),
  CONTACT_EMAIL: z.string().email().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  ADMIN_KEY: z.string().min(1).optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
});

export type EnvConfig = z.infer<typeof envSchema>;

/** Parse and cache env once. Throws on invalid env vars. */
function loadEnv(): EnvConfig {
  const result = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    CONTACT_EMAIL: process.env.CONTACT_EMAIL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    ADMIN_KEY: process.env.ADMIN_KEY,
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
  return Boolean(url && env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Chart downsampling threshold — switch to weekly aggregation above this. */
export const CHART_DOWNSAMPLE_THRESHOLD = 365;

/** Assumed evening peak window for residential scheduling nudges. Verify source with your local DISCOM before production use. */
export const ASSUMED_PEAK_HOUR_START = "18:00";
/** Assumed evening peak window for residential scheduling nudges. Verify source with your local DISCOM before production use. */
export const ASSUMED_PEAK_HOUR_END = "22:00";

/** Assumed tolerance for nudges triggered when daily use exceeds a resident's baseline. Verify source with local usage data before production use. */
export const ASSUMED_BASELINE_TOLERANCE_KWH = 1.5;

/** Assumed micro-task savings estimate. Verify source with appliance load data before production use. */
export const ASSUMED_MICRO_TASK_KWH_SAVING = 1.4;
/** Assumed monthly AC reduction estimate used by contextual nudges. Verify with appliance tests before production use. */
export const ASSUMED_AC_NUDGE_MONTHLY_SAVING_KWH = 1.8;
/** Assumed monthly reduction estimate after a high-baseline day. Verify with appliance tests before production use. */
export const ASSUMED_BASELINE_NUDGE_MONTHLY_SAVING_KWH = 2.1;
/** Assumed monthly standby reduction estimate. Verify with appliance tests before production use. */
export const ASSUMED_STANDBY_NUDGE_MONTHLY_SAVING_KWH = 0.8;

/** Assumed points awarded per percentage point of measured reduction; review this assumption before use. */
export const ASSUMED_POINTS_PER_REDUCTION_PERCENT = 2;
/** Assumed daily cap for points based on measured reduction; review this assumption before use. */
export const ASSUMED_DAILY_REDUCTION_POINTS_CAP = 100;
/** Assumed streak bonus for each consecutive day under baseline; review this assumption before use. */
export const ASSUMED_STREAK_BONUS_POINTS_PER_DAY = 5;
/** Assumed maximum streak bonus awarded per day; review this assumption before use. */
export const ASSUMED_STREAK_BONUS_POINTS_CAP = 25;
/** Assumed point multiplier for self-reported challenges; deliberately lower than measured reductions. Review before use. */
export const ASSUMED_SELF_REPORTED_CHALLENGE_POINTS_MULTIPLIER = 0.4;
/** Assumed daily cap on self-reported challenge points; review this assumption before use. */
export const ASSUMED_CHALLENGE_POINTS_DAILY_CAP = 30;
/** Assumed maximum self-reported challenge completions per profile/day; review this assumption before use. */
export const ASSUMED_CHALLENGE_COMPLETIONS_DAILY_CAP = 3;
/** Assumed badge thresholds; review these assumptions before use. */
export const ASSUMED_BADGE_THRESHOLDS = {
  threeDayStreak: 3,
  sevenDayStreak: 7,
  reductionPercent: 10,
  completedChallenges: 5,
} as const;
/** Assumed default household baseline for demo-only and not-yet-configured profiles. Verify with user onboarding data before production use. */
export const ASSUMED_DEFAULT_BASELINE_KWH_PER_DAY = 10;
/** Assumed lookback length for generated community demonstration readings. Verify before any non-demo use. */
export const ASSUMED_DEMO_READING_DAYS = 30;
/** Assumed demo community fixture values. They are synthetic demonstration data, not real communities or statistics. Verify before any non-demo use. */
export const ASSUMED_DEMO_COMMUNITIES = [
  { id: "demo-room", displayName: "Demo Home Cluster", type: "room", baselineKwhPerDay: 18, peopleCount: 4, dailyUseKwh: 15 },
  { id: "demo-hostel", displayName: "Demo Hostel", type: "hostel", baselineKwhPerDay: 180, peopleCount: 40, dailyUseKwh: 162 },
  { id: "demo-society", displayName: "Demo Housing Society", type: "society", baselineKwhPerDay: 520, peopleCount: 120, dailyUseKwh: 442 },
  { id: "demo-campus", displayName: "Demo Campus", type: "campus", baselineKwhPerDay: 1500, peopleCount: 300, dailyUseKwh: 1335 },
  { id: "demo-hostel-north", displayName: "Demo North Hostel", type: "hostel", baselineKwhPerDay: 220, peopleCount: 50, dailyUseKwh: 198 },
] as const;

/** Gamification assumptions; every rule remains configurable and explicitly estimated. */
export const DEFAULT_GAMIFICATION_CONFIG = {
  pointsPerReductionPercent: ASSUMED_POINTS_PER_REDUCTION_PERCENT,
  dailyReductionPointsCap: ASSUMED_DAILY_REDUCTION_POINTS_CAP,
  streakBonusPerDay: ASSUMED_STREAK_BONUS_POINTS_PER_DAY,
  streakBonusDailyCap: ASSUMED_STREAK_BONUS_POINTS_CAP,
  selfReportedChallengeMultiplier: ASSUMED_SELF_REPORTED_CHALLENGE_POINTS_MULTIPLIER,
  challengePointsDailyCap: ASSUMED_CHALLENGE_POINTS_DAILY_CAP,
  challengeCompletionsDailyCap: ASSUMED_CHALLENGE_COMPLETIONS_DAILY_CAP,
  badgeThresholds: ASSUMED_BADGE_THRESHOLDS,
} as const;

/** Maximum CSV file size in bytes (10 MB). */
export const MAX_CSV_SIZE_BYTES = 10 * 1024 * 1024;

/** Maximum number of rows in a CSV file. */
export const MAX_CSV_ROWS = 200_000;

/** CSV parsing chunk size for progress reporting. */
export const CSV_CHUNK_SIZE = 5_000;

/** Batch size for database upserts. */
export const DB_BATCH_SIZE = 500;

/** Nudge assumptions used for scheduling, baseline, and estimate calculations. */
export const DEFAULT_NUDGE_CONFIG = {
  peakHourStart: ASSUMED_PEAK_HOUR_START,
  peakHourEnd: ASSUMED_PEAK_HOUR_END,
  baselineToleranceKwh: ASSUMED_BASELINE_TOLERANCE_KWH,
  estimatedSavingsKwh: ASSUMED_MICRO_TASK_KWH_SAVING,
  acEstimatedMonthlySavingsKwh: ASSUMED_AC_NUDGE_MONTHLY_SAVING_KWH,
  baselineEstimatedMonthlySavingsKwh: ASSUMED_BASELINE_NUDGE_MONTHLY_SAVING_KWH,
  standbyEstimatedMonthlySavingsKwh: ASSUMED_STANDBY_NUDGE_MONTHLY_SAVING_KWH,
} as const;

/** Planning estimates only; no subsidy included. Verify with official sources and written quotes. */
export const DEFAULT_SOLAR_ASSUMPTIONS = {
  tariffPerKwh: DEFAULT_ASSUMPTIONS.tariffPerKwh,
  emissionFactor: EMISSION_FACTOR_KG_PER_KWH,
  generationKwhPerKwPerDay: 4,
  areaSqFtPerKw: 100,
  usableRoofFraction: 0.7,
  costPerKw: 60000,
} as const;
