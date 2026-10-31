/**
 * Records a challenge completion for a resident profile.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { challengeCatalog } from "@/domain/challenges";
import { getRepository } from "@/infra";
import { ApiErrors } from "@/lib/apiError";
import { withApi } from "@/lib/apiWrapper";

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

  const completion = await repo.completeChallenge(profileId, {
    profile_id: profileId,
    challenge_id: challengeId,
    date,
    points_awarded: points_awarded ?? challenge.points,
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
