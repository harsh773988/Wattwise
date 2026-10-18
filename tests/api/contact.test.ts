import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/contact/route";

function createMockRequest(body: unknown): NextRequest {
  return new NextRequest(
    new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("/api/contact", () => {
  it("accepts a valid message and returns a success envelope", async () => {
    const req = createMockRequest({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "I would like to ask about a pricing question for the dashboard.",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.success).toBe(true);
    expect(json.data.mode).toMatch(/(email|demo)/i);
  });

  it("rejects bot-style spam submissions with a honeypot field", async () => {
    const req = createMockRequest({
      name: "Bot", 
      email: "bot@example.com",
      message: "Hi there",
      website: "https://example.com",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });
});
