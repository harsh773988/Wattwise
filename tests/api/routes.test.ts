import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as getSpaces, POST as postSpaces } from "@/app/api/spaces/route";
import {
  GET as getReadings,
  POST as postReadings,
  DELETE as deleteReadings,
} from "@/app/api/readings/route";
import { POST as postImport } from "@/app/api/import/route";
import { resetRateLimiter } from "@/lib/rateLimit";
import { setRepository } from "@/infra";
import { MemoryRepository } from "@/infra/memoryRepository";
import { MAX_CSV_SIZE_BYTES } from "@/lib/config";

function createMockRequest(
  url: string,
  options?: {
    method?: string;
    body?: string | FormData;
    headers?: Record<string, string>;
  },
): NextRequest {
  const reqInit: RequestInit = {
    method: options?.method || "GET",
    headers: options?.headers || {},
  };

  if (options?.body) {
    reqInit.body = options.body;
  }

  return new NextRequest(new Request(url, reqInit));
}

describe("API Routes Suite", () => {
  let memoryRepo: MemoryRepository;

  beforeEach(() => {
    resetRateLimiter();
    memoryRepo = new MemoryRepository();
    memoryRepo.clear();
    setRepository(memoryRepo);
  });

  describe("/api/spaces", () => {
    it("GET /api/spaces returns list of available spaces", async () => {
      const req = createMockRequest("http://localhost:3000/api/spaces");
      const res = await getSpaces(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toBeInstanceOf(Array);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
      expect(json.data[0].id).toBe("default");
    });

    it("POST /api/spaces creates a new space successfully", async () => {
      const req = createMockRequest("http://localhost:3000/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Hostel Block A" }),
      });

      const res = await postSpaces(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data.name).toBe("Hostel Block A");
      expect(json.data.id).toContain("hostel-block-a");
    });

    it("POST /api/spaces rejects invalid body with 400 and consistent error shape", async () => {
      const req = createMockRequest("http://localhost:3000/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });

      const res = await postSpaces(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toContain("Space name is required");
    });
  });

  describe("/api/readings", () => {
    it("GET /api/readings returns paginated readings and metadata", async () => {
      await memoryRepo.upsertReadings("room-1", [
        { spaceId: "room-1", date: "2026-10-01", kwh: 5.5 },
      ]);

      const req = createMockRequest("http://localhost:3000/api/readings?spaceId=room-1");
      const res = await getReadings(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].kwh).toBe(5.5);
      expect(json.meta.spaceId).toBe("room-1");
    });

    it("POST /api/readings accepts valid batch readings", async () => {
      const req = createMockRequest("http://localhost:3000/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: "lab",
          readings: [{ date: "2026-10-01", kwh: 12.4 }],
        }),
      });

      const res = await postReadings(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data.success).toBe(true);
      expect(json.data.count).toBe(1);
    });

    it("POST /api/readings rejects invalid body with 400", async () => {
      const req = createMockRequest("http://localhost:3000/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: "lab",
          readings: [{ date: "invalid-date", kwh: -1 }],
        }),
      });

      const res = await postReadings(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("DELETE /api/readings clears space readings", async () => {
      await memoryRepo.upsertReadings("space-to-clear", [
        { spaceId: "space-to-clear", date: "2026-10-01", kwh: 10 },
      ]);

      const req = createMockRequest("http://localhost:3000/api/readings?spaceId=space-to-clear", {
        method: "DELETE",
      });

      const res = await deleteReadings(req);
      expect(res.status).toBe(200);
      expect(await memoryRepo.countReadings("space-to-clear")).toBe(0);
    });
  });

  describe("/api/import", () => {
    it("POST /api/import accepts valid JSON payload", async () => {
      const req = createMockRequest("http://localhost:3000/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: "demo",
          csvContent: "date,kwh\n2026-10-01,7.5\n2026-10-02,8.0",
        }),
      });

      const res = await postImport(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.success).toBe(true);
      expect(json.data.importedCount).toBe(2);
      expect(json.data.stats.accepted).toBe(2);
    });

    it("POST /api/import rejects wrong file type with 415", async () => {
      const formData = new FormData();
      const fakeBlob = new Blob(["binary data"], { type: "image/png" });
      formData.append("file", fakeBlob, "photo.png");

      const req = createMockRequest("http://localhost:3000/api/import", {
        method: "POST",
        body: formData,
      });

      const res = await postImport(req);
      expect(res.status).toBe(415);

      const json = await res.json();
      expect(json.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    });

    it("POST /api/import rejects too-large upload with 413", async () => {
      const tooLargeBytes = MAX_CSV_SIZE_BYTES + 1024;
      const req = createMockRequest("http://localhost:3000/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "content-length": tooLargeBytes.toString(),
        },
        body: JSON.stringify({ spaceId: "test", csvContent: "date,kwh" }),
      });

      const res = await postImport(req);
      expect(res.status).toBe(413);

      const json = await res.json();
      expect(json.error.code).toBe("PAYLOAD_TOO_LARGE");
    });
  });

  describe("Cross-Cutting: Rate Limiting & Safe Error Mapping", () => {
    it("enforces rate limits and returns 429 with Retry-After header", async () => {
      const ip = "192.168.1.100";
      // Send 60 requests (allowed)
      for (let i = 0; i < 60; i++) {
        const req = createMockRequest("http://localhost:3000/api/spaces", {
          headers: { "x-forwarded-for": ip },
        });
        const res = await getSpaces(req);
        expect(res.status).toBe(200);
      }

      // Request 61 should be blocked by rate limiter
      const blockedReq = createMockRequest("http://localhost:3000/api/spaces", {
        headers: { "x-forwarded-for": ip },
      });
      const blockedRes = await getSpaces(blockedReq);
      expect(blockedRes.status).toBe(429);

      const json = await blockedRes.json();
      expect(json.error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(blockedRes.headers.get("Retry-After")).toBeDefined();

      // Reset and verify recovery
      resetRateLimiter();
      const recoverReq = createMockRequest("http://localhost:3000/api/spaces", {
        headers: { "x-forwarded-for": ip },
      });
      const recoverRes = await getSpaces(recoverReq);
      expect(recoverRes.status).toBe(200);
    });

    it("maps repository exceptions to 500 without leaking secrets or stack traces", async () => {
      // Mock repository throwing unexpected internal error
      const failingRepo = {
        ...memoryRepo,
        listSpaces: vi.fn().mockRejectedValue(new Error("Database connection timed out at 10.0.0.1:5432")),
      };
      setRepository(failingRepo as unknown as MemoryRepository);

      const req = createMockRequest("http://localhost:3000/api/spaces");
      const res = await getSpaces(req);
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(json.error.message).toBe("An unexpected server error occurred. Please try again.");
      expect(json.error.message).not.toContain("10.0.0.1"); // No internal IPs leaked
      expect(json.error.stack).toBeUndefined(); // Zero stack trace leakage
    });
  });
});
