import { describe, expect, it } from "vitest";
import { MemoryRepository } from "./memoryRepository";
import type {
  ChallengeCompletion,
  CommunityGoal,
  PointsLedgerEntry,
} from "@/domain/types";
import type { CreateSpaceDetails, ReadingRepository, Space } from "./repository";
import { SupabaseRepository } from "./supabaseRepository";

class TestSupabaseRepository extends SupabaseRepository {
  private challengeCompletions = new Map<string, ChallengeCompletion>();
  private pointsLedger = new Map<string, PointsLedgerEntry>();
  private goals = new Map<string, CommunityGoal>();
  private spaces: Space[] = [{ id: "default", name: "My Room" }];

  constructor() {
    super("https://example.supabase.co", "demo-key");
  }

  override async listSpaces(): Promise<readonly Space[]> {
    return this.spaces;
  }

  override async createSpace(name: string, details: CreateSpaceDetails = {}): Promise<Space> {
    const space = {
      id: details.id ?? name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
      name,
      displayName: details.displayName,
      type: details.type,
      baselineKwhPerDay: details.baselineKwhPerDay,
      peopleCount: details.peopleCount,
    };
    this.spaces.push(space);
    return space;
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

  override async listPointsLedger(profileId: string): Promise<readonly PointsLedgerEntry[]> {
    return Array.from(this.pointsLedger.values()).filter((entry) => entry.profile_id === profileId);
  }

  override async addPointsLedger(entries: readonly PointsLedgerEntry[]): Promise<void> {
    for (const entry of entries) {
      this.pointsLedger.set(`${entry.profile_id}:${entry.date}:${entry.source}`, entry);
    }
  }

  override async listCommunityGoals(spaceId?: string): Promise<readonly CommunityGoal[]> {
    return Array.from(this.goals.values()).filter((goal) => !spaceId || goal.space_id === spaceId);
  }

  override async createCommunityGoal(goal: CommunityGoal): Promise<CommunityGoal> {
    this.goals.set(goal.id, goal);
    return goal;
  }
}

async function expectChallengeContract(repo: Pick<
  ReadingRepository,
  | "listChallengeCompletions"
  | "listSpaces"
  | "createSpace"
  | "getChallengeCompletion"
  | "completeChallenge"
  | "listPointsLedger"
  | "addPointsLedger"
  | "listCommunityGoals"
  | "createCommunityGoal"
>) {
  const createdSpace = await repo.createSpace("Contract Campus", {
    id: "contract-campus",
    displayName: "Contract Test Campus",
    type: "campus",
    baselineKwhPerDay: 14,
    peopleCount: 22,
  });
  expect(createdSpace).toMatchObject({
    id: "contract-campus",
    displayName: "Contract Test Campus",
    type: "campus",
    baselineKwhPerDay: 14,
    peopleCount: 22,
  });
  expect((await repo.listSpaces()).some((space) => space.id === "contract-campus")).toBe(true);

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

  const ledger: PointsLedgerEntry = {
    profile_id: profileId,
    date: "2026-10-31",
    source: "measured-reduction",
    points: 15,
    reason: "Measured reduction against baseline.",
  };
  await repo.addPointsLedger([ledger]);
  expect(await repo.listPointsLedger(profileId)).toEqual([ledger]);

  const goal: CommunityGoal = {
    id: "goal-contract",
    space_id: "default",
    target_percent: 10,
    period_start: "2026-10-01",
    period_end: "2026-10-31",
  };
  expect(await repo.createCommunityGoal(goal)).toMatchObject(goal);
  expect(await repo.listCommunityGoals("default")).toMatchObject([goal]);
}

describe("reading repository contract", () => {
  it("supports challenge completion tracking in the in-memory adapter", async () => {
    const repo = new MemoryRepository();
    await expectChallengeContract(repo);
  });

  it("supports challenge completion tracking in the supabase-style adapter", async () => {
    const repo = new TestSupabaseRepository();
    await expectChallengeContract(repo);
  });
});
