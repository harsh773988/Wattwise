/**
 * Behavioural nudges API for the resident profile.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateNudges } from "@/domain/nudges";
import { DEFAULT_NUDGE_CONFIG } from "@/lib/config";
import { withApi } from "@/lib/apiWrapper";

const nudgeQuerySchema = z.object({
  profileId: z.string().trim().min(1).default("demo-profile"),
  appliances: z.string().optional(),
  baseline: z.coerce.number().min(0).default(10),
});

function buildRecentReadings(profileId: string, appliances: readonly string[], baseline: number, now: Date) {
  const base = appliances.length > 0 ? appliances : ["geyser", "washing machine", "ac"];
  const readings = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    let kwh = baseline + (index % 3) * 0.8;
    if (base.includes("geyser")) kwh += 1.8;
    if (base.includes("ac")) kwh += 1.5;
    if (base.includes("washing machine")) kwh += 0.9;
    if (base.includes("iron")) kwh += 0.7;
    if (base.includes("pump")) kwh += 0.6;
    return {
      date: date.toISOString().slice(0, 10),
      kwh: Number(kwh.toFixed(1)),
      spaceId: profileId,
    };
  });

  return readings;
}

export const GET = withApi(async (req, { query }) => {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = nudgeQuerySchema.safeParse({ ...query, ...params });
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  }

  const { profileId, appliances, baseline } = parsed.data;
  const profileAppliances = appliances
    ? appliances.split(",").map((value) => value.trim()).filter(Boolean)
    : ["geyser", "washing machine", "ac"];

  const profile = {
    id: profileId,
    name: "Demo resident",
    baselineKwhPerDay: baseline,
    main_appliances: profileAppliances,
  };

  const recentReadings = buildRecentReadings(profileId, profileAppliances, baseline, new Date());
  const nudges = generateNudges(profile, recentReadings, new Date(), DEFAULT_NUDGE_CONFIG);

  return NextResponse.json({
    data: {
      profileId,
      profile: {
        ...profile,
        label: "Demo data",
      },
      nudges,
      assumptions: {
        peakWindow: `${DEFAULT_NUDGE_CONFIG.peakHourStart} to ${DEFAULT_NUDGE_CONFIG.peakHourEnd}`,
        note: "Assumed peak hours, configurable; verify with your DISCOM.",
      },
    },
  });
}, { querySchema: nudgeQuerySchema });
