/**
 * /api/spaces endpoint — list and create physical monitored spaces (e.g. My Room, Lab, Living Room).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/infra";
import { withApi } from "@/lib/apiWrapper";
import { getApiAuthContext, unauthorizedResponse } from "@/lib/supabase/apiAuth";

const createSpaceSchema = z.object({
  name: z.string().trim().min(1, "Space name is required").max(60, "Space name too long"),
  displayName: z.string().trim().min(1).max(80).optional(),
  type: z.enum(["room", "hostel", "society", "campus"]).default("room"),
  baselineKwhPerDay: z.number().finite().nonnegative().optional(),
  peopleCount: z.number().int().positive().optional(),
});

type CreateSpaceBody = z.infer<typeof createSpaceSchema>;

export const GET = withApi(async () => {
  const auth = await getApiAuthContext();
  if (auth.enabled && !auth.user) return unauthorizedResponse();
  const repo = getRepository();
  const allSpaces = await repo.listSpaces();
  const spaces = auth.enabled && auth.user
    ? allSpaces.filter((space) => space.ownerId === auth.user?.id)
    : allSpaces;

  return NextResponse.json({
    data: spaces,
  });
});

export const POST = withApi<CreateSpaceBody>(
  async (_req, { body }) => {
    const auth = await getApiAuthContext();
    if (auth.enabled && !auth.user) return unauthorizedResponse();
    const repo = getRepository();
    const created = await repo.createSpace(body.name, {
      ownerId: auth.user?.id,
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
