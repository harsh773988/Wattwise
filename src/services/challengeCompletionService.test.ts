import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/infra/memoryRepository";
import {
  awardChallengeCompletion,
  ChallengeAwardError,
} from "./challengeCompletionService";

describe("awardChallengeCompletion", () => {
  it("awards a reduced self-report score and writes the point ledger", async () => {
    const repository = new MemoryRepository();
    const completion = await awardChallengeCompletion(
      repository,
      "profile-1",
      "ac-one-hour-less",
      "2026-11-01",
    );

    expect(completion.points_awarded).toBe(10);
    expect(await repository.listPointsLedger("profile-1")).toMatchObject([
      { source: "challenge:ac-one-hour-less", points: 10 },
    ]);
  });

  it("rejects unknown and duplicate challenge ids", async () => {
    const repository = new MemoryRepository();
    await expect(awardChallengeCompletion(repository, "p", "unknown", "2026-11-01"))
      .rejects.toMatchObject<Partial<ChallengeAwardError>>({ code: "unknown_challenge" });

    await awardChallengeCompletion(repository, "p", "ac-one-hour-less", "2026-11-01");
    await expect(awardChallengeCompletion(repository, "p", "ac-one-hour-less", "2026-11-01"))
      .rejects.toMatchObject<Partial<ChallengeAwardError>>({ code: "duplicate" });
  });

  it("rejects after the daily completion count or point cap is reached", async () => {
    const repository = new MemoryRepository();
    const date = "2026-11-01";
    for (const challengeId of ["ac-one-hour-less", "full-load-wash", "geyser-shifted"]) {
      await repository.completeChallenge("p", {
        profile_id: "p",
        challenge_id: challengeId,
        date,
        points_awarded: 1,
      });
    }
    await expect(awardChallengeCompletion(repository, "p", "iron-off-peak", date))
      .rejects.toMatchObject<Partial<ChallengeAwardError>>({ code: "completion_cap" });

    const cappedRepository = new MemoryRepository();
    await cappedRepository.addPointsLedger([{
      profile_id: "p",
      date,
      source: "challenge:seed",
      points: 30,
      reason: "Daily cap test.",
    }]);
    await expect(awardChallengeCompletion(cappedRepository, "p", "ac-one-hour-less", date))
      .rejects.toMatchObject<Partial<ChallengeAwardError>>({ code: "points_cap" });
  });
});
