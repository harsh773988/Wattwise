import { challengeCatalog } from "@/domain/challenges";
import type { ChallengeCompletion } from "@/domain/types";
import type { ReadingRepository } from "@/infra/repository";
import { DEFAULT_GAMIFICATION_CONFIG } from "@/lib/config";

export type ChallengeAwardErrorCode = "unknown_challenge" | "duplicate" | "completion_cap" | "points_cap";

export class ChallengeAwardError extends Error {
  constructor(
    readonly code: ChallengeAwardErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ChallengeAwardError";
  }
}

export async function awardChallengeCompletion(
  repository: ReadingRepository,
  profileId: string,
  challengeId: string,
  date: string,
): Promise<ChallengeCompletion> {
  const challenge = challengeCatalog.find((item) => item.id === challengeId);
  if (!challenge) {
    throw new ChallengeAwardError("unknown_challenge", `Unknown challenge id: ${challengeId}`);
  }

  const existing = await repository.getChallengeCompletion(profileId, challengeId, date);
  if (existing) {
    throw new ChallengeAwardError("duplicate", "This challenge has already been completed for the selected date.");
  }

  const completions = (await repository.listChallengeCompletions(profileId))
    .filter((completion) => completion.date === date);
  if (completions.length >= DEFAULT_GAMIFICATION_CONFIG.challengeCompletionsDailyCap) {
    throw new ChallengeAwardError("completion_cap", "Challenge cap reached for this day.");
  }

  const ledger = await repository.listPointsLedger(profileId);
  const pointsAlreadyAwarded = ledger
    .filter((entry) => entry.date === date && entry.source.startsWith("challenge:"))
    .reduce((sum, entry) => sum + entry.points, 0);
  const points = Math.min(
    Math.max(0, DEFAULT_GAMIFICATION_CONFIG.challengePointsDailyCap - pointsAlreadyAwarded),
    Math.floor(challenge.points * DEFAULT_GAMIFICATION_CONFIG.selfReportedChallengeMultiplier),
  );
  if (points <= 0) {
    throw new ChallengeAwardError("points_cap", "The daily self-reported challenge points cap has been reached.");
  }

  const completion = await repository.completeChallenge(profileId, {
    profile_id: profileId,
    challenge_id: challengeId,
    date,
    points_awarded: points,
  });
  await repository.addPointsLedger([{
    profile_id: profileId,
    date,
    source: `challenge:${challengeId}`,
    points,
    reason: `Self-reported challenge: ${challenge.title}.`,
  }]);

  return completion;
}
