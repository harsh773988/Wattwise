import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { MemoryRepository } from "@/infra/memoryRepository";
import { setRepository } from "@/infra";
import { GET, POST } from "./route";

afterEach(() => {
  setRepository(null);
});

describe("/api/goals", () => {
  it("creates and reads a validated community goal with progress", async () => {
    const repository = new MemoryRepository();
    setRepository(repository);
    const today = new Date().toISOString().slice(0, 10);
    const created = await POST(new NextRequest("http://localhost/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        spaceId: "default",
        targetPercent: 10,
        periodStart: today,
        periodEnd: today,
      }),
    }));

    expect(created.status).toBe(201);
    expect((await created.json()).data.target_percent).toBe(10);

    const response = await GET(new NextRequest(`http://localhost/api/goals?spaceId=default`));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.activeGoal.target_percent).toBe(10);
    expect(body.data.progress.daysLeft).toBe(1);
    expect(body.data.baselineEstimated).toBe(true);
  });

  it("rejects malformed goal periods and communities that do not exist", async () => {
    setRepository(new MemoryRepository());
    const invalidPeriod = await POST(new NextRequest("http://localhost/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        spaceId: "default",
        targetPercent: 10,
        periodStart: "2026-03-31",
        periodEnd: "2026-03-01",
      }),
    }));
    expect(invalidPeriod.status).toBe(400);

    const missingSpace = await POST(new NextRequest("http://localhost/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        spaceId: "unknown",
        targetPercent: 10,
        periodStart: "2026-03-01",
        periodEnd: "2026-03-31",
      }),
    }));
    expect(missingSpace.status).toBe(404);
  });
});
