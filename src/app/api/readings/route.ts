import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/infra";
import { checkRateLimit } from "@/lib/rateLimiter";
import { getEnv } from "@/lib/config";
import { logger } from "@/lib/logger";

const getQuerySchema = z.object({
  spaceId: z.string().min(1).default("default"),
  offset: z.coerce.number().int().nonnegative().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

const postBodySchema = z.object({
  spaceId: z.string().min(1).default("default"),
  readings: z
    .array(
      z.object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
          .refine(
            (d) => new Date(d + "T00:00:00Z") <= new Date(),
            "Future dates are not allowed",
          ),
        kwh: z.number().min(0, "kWh must be non-negative").max(1000),
      }),
    )
    .min(1, "At least one reading is required")
    .max(5000, "Maximum batch size is 5000 readings"),
});

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

function enforceRateLimit(ip: string): NextResponse | null {
  const env = getEnv();
  const res = checkRateLimit(ip, {
    maxRequests: env.RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
  });

  if (!res.allowed) {
    logger.warn("Rate limit exceeded", { ip });
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again shortly.",
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((res.resetAt - Date.now()) / 1000).toString(),
        },
      },
    );
  }
  return null;
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimitRes = enforceRateLimit(ip);
  if (rateLimitRes) return rateLimitRes;

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());

  const parseResult = getQuerySchema.safeParse(params);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_QUERY_PARAMS",
          message: parseResult.error.issues.map((i) => i.message).join(", "),
        },
      },
      { status: 400 },
    );
  }

  const { spaceId, offset, limit } = parseResult.data;

  try {
    const repo = getRepository();
    const page = await repo.getReadings(spaceId, { offset, limit });
    const count = await repo.countReadings(spaceId);

    return NextResponse.json({
      data: page.items,
      meta: {
        spaceId,
        count,
        offset: offset ?? 0,
        limit: limit ?? page.items.length,
        nextCursor: page.nextCursor,
      },
    });
  } catch (err: unknown) {
    logger.error("Failed to fetch readings", { error: err });
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Failed to fetch readings",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimitRes = enforceRateLimit(ip);
  if (rateLimitRes) return rateLimitRes;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON",
        },
      },
      { status: 400 },
    );
  }

  const parseResult = postBodySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
        },
      },
      { status: 400 },
    );
  }

  const { spaceId, readings } = parseResult.data;

  try {
    const repo = getRepository();
    const domainReadings = readings.map((r) => ({
      spaceId,
      date: r.date,
      kwh: r.kwh,
    }));

    await repo.upsertReadings(spaceId, domainReadings);

    return NextResponse.json(
      {
        data: {
          success: true,
          count: domainReadings.length,
          spaceId,
        },
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    logger.error("Failed to upsert readings", { error: err });
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Failed to save readings",
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimitRes = enforceRateLimit(ip);
  if (rateLimitRes) return rateLimitRes;

  const url = new URL(req.url);
  const spaceId = url.searchParams.get("spaceId") || "default";

  try {
    const repo = getRepository();
    await repo.deleteReadings(spaceId);

    return NextResponse.json({
      data: {
        success: true,
        message: `All readings for space "${spaceId}" deleted`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Failed to clear readings",
        },
      },
      { status: 500 },
    );
  }
}
