/**
 * Records a challenge completion for a resident profile.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getChallengeById } from "@/domain/challenges";
import { getRepository } from "@/infra";
import { ApiErrors } from "@/lib/apiError";
import { withApi } from "@/lib/apiWrapper";
import { awardChallengeCompletion, ChallengeAwardError } from "@/services/challengeCompletionService";
import type { ChallengeCompletion } from "@/domain/types";
import { getApiAuthContext, resolveProfileId, unauthorizedResponse } from "@/lib/supabase/apiAuth";

const completeChallengeSchema = z.object({
  profileId: z.string().trim().min(1),
  challengeId: z.string().trim().min(1),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((date) => {
      const parsed = new Date(`${date}T00:00:00.000Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
    }, "Date must be a valid calendar date.")
    .refine((date) => date === new Date().toISOString().slice(0, 10), "Challenges can only be completed for today."),
});

export const POST = withApi(async (_req, { body }) => {
  const auth = await getApiAuthContext();
  if (auth.enabled && !auth.user) return unauthorizedResponse();
  const repo = getRepository();
  const parsed = completeChallengeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
  }

  const profileId = resolveProfileId(auth, parsed.data.profileId);
  if (!profileId) return unauthorizedResponse();
  const { challengeId, date } = parsed.data;
  const challenge = getChallengeById(challengeId);
  if (!challenge) {
    return ApiErrors.badRequest(`Unknown challenge id: ${challengeId}`);
  }
  let completion: ChallengeCompletion;
  try {
    completion = await awardChallengeCompletion(repo, profileId, challengeId, date);
  } catch (error: unknown) {
    if (error instanceof ChallengeAwardError) {
      return ApiErrors.badRequest(error.message);
    }
    throw error;
  }

  return NextResponse.json({
    data: {
      success: true,
      completion,
      challenge,
      message: "Challenge marked complete. Self-reported actions earn fewer points than measured reductions.",
    },
  }, { status: 201 });
}, { bodySchema: completeChallengeSchema });
