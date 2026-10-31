import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { MemoryRepository } from "@/infra/memoryRepository";
import { setRepository } from "@/infra";

describe("GET /api/admin/summary", () => {
  let repository: MemoryRepository;

  beforeEach(async () => {
    vi.stubEnv("ADMIN_KEY", "unit-test-admin-key");
    repository = new MemoryRepository();
    setRepository(repository);
    const today = new Date().toISOString().slice(0, 10);
    await repository.createSpace("Private community", {
      id: "private-community",
      baselineKwhPerDay: 12,
    });
    await repository.upsertReadings("private-community", [
      { date: today, kwh: 10 },
    ]);
    await repository.completeChallenge("private-profile-id", {
      profile_id: "private-profile-id",
      challenge_id: "lights-empty-rooms",
      date: today,
      points_awarded: 5,
    });
  });

  afterEach(() => {
    setRepository(null);
    vi.unstubAllEnvs();
  });

  it("returns the standard 401 response without a valid key", async () => {
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/admin/summary", {
      headers: { "x-forwarded-for": "192.0.2.1" },
    }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "UNAUTHORIZED", message: "A valid administrator key is required." },
    });
  });

  it("returns aggregate-only data with the configured key", async () => {
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/admin/summary", {
      headers: {
        "x-admin-key": "unit-test-admin-key",
        "x-forwarded-for": "192.0.2.2",
      },
    }));
    const responseText = await response.clone().text();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toMatchObject({
      communityCount: 2,
      activeUsers: 1,
      totalKwh: 10,
      kwhSaved: 2,
      challengeCompletionCount: 1,
    });
    expect(responseText).not.toContain("private-profile-id");
    expect(json.data.communities[0]).not.toHaveProperty("readings");
    expect(json.data.trend[0]).not.toHaveProperty("profile_id");
  });
});
