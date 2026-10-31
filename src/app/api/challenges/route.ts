/**
 * Challenge-management API for daily micro-tasks.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { challengeCatalog, pickDailyChallenges } from "@/domain/challenges";
import { getRepository } from "@/infra";
import { ApiErrors } from "@/lib/apiError";
import { withApi } from "@/lib/apiWrapper";

const challengesQuerySchema = z.object({
  profileId: z.string().trim().min(1).default("demo-profile"),
  appliances: z.string().optional(),
  baseline: z.coerce.number().min(0).default(10),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(new Date().toISOString().slice(0, 10)),
});

export const GET = withApi(async (req, { query }) => {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = challengesQuerySchema.safeParse({ ...query, ...params });
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  }

  const { profileId, appliances, baseline, date } = parsed.data;
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
  const recentChallengeIds = completions
    .filter((completion) => completion.date >= new Date(Date.parse(`${date}T00:00:00Z`) - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    .map((completion) => completion.challenge_id);

  const challenges = pickDailyChallenges(profile, date, recentChallengeIds);
  const completedToday = completions.filter((completion) => completion.date === date).map((completion) => completion.challenge_id);

  return NextResponse.json({
    data: {
      profileId,
      date,
      profile: {
        ...profile,
        label: "Demo data",
      },
      challenges,
      completedChallengeIds: completedToday,
      count: challenges.length,
    },
  });
}, { querySchema: challengesQuerySchema });

const completeChallengeSchema = z.object({
  profileId: z.string().trim().min(1),
  challengeId: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  points_awarded: z.coerce.number().int().nonnegative().optional(),
});

export const POST = withApi(async (_req, { body }) => {
  const repo = getRepository();
  const parsed = completeChallengeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  }

  const { profileId, challengeId, date, points_awarded } = parsed.data;
  const challenge = challengeCatalog.find((item) => item.id === challengeId);
  if (!challenge) {
    return ApiErrors.badRequest(`Unknown challenge id: ${challengeId}`);
  }

  const existing = await repo.getChallengeCompletion(profileId, challengeId, date);
  if (existing) {
    return ApiErrors.badRequest("This challenge has already been completed for the selected date.");
  }

  const todayCompletions = (await repo.listChallengeCompletions(profileId)).filter((item) => item.date === date);
  if (todayCompletions.length >= 3) {
    return ApiErrors.badRequest("Challenge cap reached for this day.");
  }

  const points = points_awarded ?? challenge.points;
  const completion = await repo.completeChallenge(profileId, {
    profile_id: profileId,
    challenge_id: challengeId,
    date,
    points_awarded: points,
  });

  return NextResponse.json({
    data: {
      success: true,
      completion,
      challenge,
      message: "Challenge marked complete.",
    },
  }, { status: 201 });
}, { bodySchema: completeChallengeSchema });
