import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMocks = vi.hoisted(() => ({
  getApiAuthContext: vi.fn(),
  resolveOwnedSpaceId: vi.fn(),
  unauthorizedResponse: vi.fn(),
}));

vi.mock("@/lib/supabase/apiAuth", () => authMocks);

import { GET, POST } from "./route";

describe("readings API authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getApiAuthContext.mockResolvedValue({
      enabled: true,
      user: null,
      supabase: null,
    });
    authMocks.unauthorizedResponse.mockImplementation(
      () => new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }),
    );
  });

  it("rejects reading queries without a signed-in user", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/readings?spaceId=default"),
    );
    expect(response.status).toBe(401);
    expect(authMocks.resolveOwnedSpaceId).not.toHaveBeenCalled();
  });

  it("rejects reading writes without a signed-in user", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/readings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          spaceId: "default",
          readings: [{ date: "2026-11-09", kwh: 10 }],
        }),
      }),
    );
    expect(response.status).toBe(401);
    expect(authMocks.resolveOwnedSpaceId).not.toHaveBeenCalled();
  });
});
