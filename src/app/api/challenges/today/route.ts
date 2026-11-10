/**
 * Returns the three daily challenges selected for a resident profile.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateChallengeStreak, pickDailyChallenges } from "@/domain/challenges";
import { getRepository } from "@/infra";
import { withApi } from "@/lib/apiWrapper";
import { getApiAuthContext, resolveProfileId, unauthorizedResponse } from "@/lib/supabase/apiAuth";

const challengeQuerySchema = z.object({
  profileId: z.string().trim().min(1).default("demo-profile"),
  appliances: z.string().optional(),
  baseline: z.coerce.number().min(0).default(10),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(new Date().toISOString().slice(0, 10)),
});

export const GET = withApi(async (req, { query }) => {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = challengeQuerySchema.safeParse({ ...query, ...params });
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  }

  const auth = await getApiAuthContext();
  if (auth.enabled && !auth.user) return unauthorizedResponse();
  const profileId = resolveProfileId(auth, parsed.data.profileId);
  if (!profileId) return unauthorizedResponse();
  const { appliances, baseline, date } = parsed.data;
  const profileAppliances = appliances
    ? appliances.split(",").map((value) => value.trim()).filter(Boolean)
    : ["geyser", "washing machine", "ac"];

  const profile = {
    id: profileId,
    name: "Demo resident",
    baselineKwhPerDay: baseline,
    main_appliances: profileAppliances,
  };

  const repo = getRepository();
  const completions = await repo.listChallengeCompletions(profileId);
  const threeDaysAgo = new Date(Date.parse(`${date}T00:00:00Z`) - 3 * 24 * 60 * 60 * 1000);
  const recentHistory = completions
    .filter((completion) => completion.date >= threeDaysAgo.toISOString().slice(0, 10))
    .map((completion) => completion.challenge_id);

  const selected = pickDailyChallenges(profile, date, recentHistory);
  const completedToday = completions.filter((completion) => completion.date === date).map((completion) => completion.challenge_id);
  const streak = calculateChallengeStreak(completions.filter((completion) => completion.profile_id === profileId), date);

  return NextResponse.json({
    data: {
      profileId,
      date,
      profile: {
        ...profile,
        label: "Demo data",
      },
      challenges: selected,
      completedChallengeIds: completedToday,
      streak,
      count: selected.length,
    },
  });
}, { querySchema: challengeQuerySchema });
