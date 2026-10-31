/**
 * /api/spaces endpoint — list and create physical monitored spaces (e.g. My Room, Lab, Living Room).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/infra";
import { withApi } from "@/lib/apiWrapper";

const createSpaceSchema = z.object({
  name: z.string().trim().min(1, "Space name is required").max(60, "Space name too long"),
  displayName: z.string().trim().min(1).max(80).optional(),
  type: z.enum(["room", "hostel", "society", "campus"]).default("room"),
  baselineKwhPerDay: z.number().finite().nonnegative().optional(),
  peopleCount: z.number().int().positive().optional(),
});

type CreateSpaceBody = z.infer<typeof createSpaceSchema>;

export const GET = withApi(async () => {
  const repo = getRepository();
  const spaces = await repo.listSpaces();

  return NextResponse.json({
    data: spaces,
  });
});

export const POST = withApi<CreateSpaceBody>(
  async (_req, { body }) => {
    const repo = getRepository();
    const created = await repo.createSpace(body.name, {
      displayName: body.displayName,
      type: body.type,
      baselineKwhPerDay: body.baselineKwhPerDay,
      peopleCount: body.peopleCount,
    });

    return NextResponse.json(
      {
        data: created,
      },
      { status: 201 },
    );
  },
  {
    bodySchema: createSpaceSchema,
  },
);
