import { describe, expect, it } from "vitest";
import { MemoryRepository } from "./memoryRepository";
import type { ChallengeCompletion } from "@/domain/types";
import { SupabaseRepository } from "./supabaseRepository";

class TestSupabaseRepository extends SupabaseRepository {
  private challengeCompletions = new Map<string, ChallengeCompletion>();

  constructor() {
    super("https://example.supabase.co", "demo-key");
  }

  override async listChallengeCompletions(profileId: string): Promise<readonly ChallengeCompletion[]> {
    return Array.from(this.challengeCompletions.values()).filter(
      (completion) => completion.profile_id === profileId,
    );
  }

  override async getChallengeCompletion(
    profileId: string,
    challengeId: string,
    date: string,
  ): Promise<ChallengeCompletion | null> {
    const key = `${profileId}:${challengeId}:${date}`;
    return this.challengeCompletions.get(key) ?? null;
  }

  override async completeChallenge(
    profileId: string,
    completion: ChallengeCompletion,
  ): Promise<ChallengeCompletion> {
    const key = `${profileId}:${completion.challenge_id}:${completion.date}`;
    const existing = this.challengeCompletions.get(key);
    if (existing) {
      return existing;
    }

    const next = { ...completion, profile_id: profileId };
    this.challengeCompletions.set(key, next);
    return next;
  }
}

async function expectChallengeContract(repo: {
  listChallengeCompletions: (profileId: string) => Promise<readonly ChallengeCompletion[]>;
  getChallengeCompletion: (profileId: string, challengeId: string, date: string) => Promise<ChallengeCompletion | null>;
  completeChallenge: (profileId: string, completion: ChallengeCompletion) => Promise<ChallengeCompletion>;
}) {
  const profileId = "contract-profile";
  const completion: ChallengeCompletion = {
    profile_id: profileId,
    challenge_id: "ac-one-hour-less",
    date: "2026-10-31",
    points_awarded: 25,
  };

  const added = await repo.completeChallenge(profileId, completion);
  expect(added.points_awarded).toBe(25);

  const stored = await repo.getChallengeCompletion(profileId, "ac-one-hour-less", "2026-10-31");
  expect(stored).toEqual(completion);

  const list = await repo.listChallengeCompletions(profileId);
  expect(list).toHaveLength(1);
}

describe("reading repository challenge completion contract", () => {
  it("supports challenge completion tracking in the in-memory adapter", async () => {
    const repo = new MemoryRepository();
    await expectChallengeContract(repo);
  });

  it("supports challenge completion tracking in the supabase-style adapter", async () => {
    const repo = new TestSupabaseRepository();
    await expectChallengeContract(repo);
  });
});
