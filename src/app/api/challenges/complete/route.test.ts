import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { MemoryRepository } from "@/infra/memoryRepository";
import { setRepository } from "@/infra";
import { challengeCatalog } from "@/domain/challenges";
import { POST } from "./route";
import { POST as legacyPost } from "../route";

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/challenges/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  setRepository(null);
});

describe("POST /api/challenges/complete", () => {
  it("awards fewer points for a self-reported challenge and rejects a duplicate", async () => {
    const repository = new MemoryRepository();
    setRepository(repository);
    const date = new Date().toISOString().slice(0, 10);
    const payload = {
      profileId: "test-profile",
      challengeId: "ac-one-hour-less",
      date,
    };

    const first = await POST(request(payload));
    const firstBody = await first.json();
    const catalogPoints = challengeCatalog.find((challenge) => challenge.id === payload.challengeId)?.points ?? 0;
    expect(first.status).toBe(201);
    expect(firstBody.data.completion.points_awarded).toBeLessThan(catalogPoints);
    expect(await repository.listPointsLedger("test-profile")).toHaveLength(1);

    const duplicate = await POST(request(payload));
    expect(duplicate.status).toBe(400);
    expect((await duplicate.json()).error.message).toMatch(/already been completed/i);
    expect(await repository.listChallengeCompletions("test-profile")).toHaveLength(1);
  });

  it("rejects unknown ids and caps daily challenge completions", async () => {
    const repository = new MemoryRepository();
    setRepository(repository);
    const date = new Date().toISOString().slice(0, 10);
    const unknown = await POST(request({
      profileId: "test-profile",
      challengeId: "not-a-challenge",
      date,
    }));
    expect(unknown.status).toBe(400);

    for (const challengeId of ["ac-one-hour-less", "full-load-wash", "geyser-shifted"]) {
      const response = await POST(request({ profileId: "test-profile", challengeId, date }));
      expect(response.status).toBe(201);
    }

    const capped = await POST(request({
      profileId: "test-profile",
      challengeId: "iron-off-peak",
      date,
    }));
    expect(capped.status).toBe(400);
    expect((await capped.json()).error.message).toMatch(/cap reached/i);
  });

  it("does not allow the legacy challenge route to accept client-supplied points", async () => {
    const repository = new MemoryRepository();
    setRepository(repository);
    const response = await legacyPost(request({
      profileId: "test-profile",
      challengeId: "ac-one-hour-less",
      date: new Date().toISOString().slice(0, 10),
      points_awarded: 999999,
    }));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.completion.points_awarded).toBe(10);
  });
});
