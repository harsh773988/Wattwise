/**
 * /api/readings endpoint — query, upsert, and delete electricity readings.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/infra";
import { withApi } from "@/lib/apiWrapper";
import type { Reading } from "@/domain/types";

const getReadingsQuerySchema = z.object({
  spaceId: z.string().min(1).default("default"),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().positive().max(5000).optional(),
  cursor: z.string().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

type GetReadingsQuery = z.infer<typeof getReadingsQuerySchema>;

const postReadingsBodySchema = z.object({
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

type PostReadingsBody = z.infer<typeof postReadingsBodySchema>;

export const GET = withApi<unknown, GetReadingsQuery>(
  async (_req, { query }) => {
    const { spaceId, from, to, limit, cursor, offset } = query;
    const repo = getRepository();

    const page = await repo.getReadings(spaceId, {
      from,
      to,
      limit,
      cursor,
      offset,
    });
    const count = await repo.countReadings(spaceId);

    return NextResponse.json({
      data: page.items,
      meta: {
        spaceId,
        count,
        limit: limit ?? page.items.length,
        nextCursor: page.nextCursor,
        total: page.total ?? count,
      },
    });
  },
  {
    querySchema: getReadingsQuerySchema,
  },
);

export const POST = withApi<PostReadingsBody>(
  async (_req, { body }) => {
    const { spaceId, readings } = body;
    const repo = getRepository();

    const domainReadings: Reading[] = readings.map((r) => ({
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
  },
  {
    bodySchema: postReadingsBodySchema,
  },
);

export const DELETE = withApi(async (req) => {
  const url = new URL(req.url);
  const spaceId = url.searchParams.get("spaceId") || "default";

  const repo = getRepository();
  await repo.deleteReadings(spaceId);

  return NextResponse.json({
    data: {
      success: true,
      message: `All readings for space "${spaceId}" deleted`,
    },
  });
});
