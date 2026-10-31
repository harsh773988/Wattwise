import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { communityGoalProgress } from "@/domain/gamification";
import { getRepository } from "@/infra";
import { withApi } from "@/lib/apiWrapper";
import { ASSUMED_DEFAULT_BASELINE_KWH_PER_DAY } from "@/lib/config";

const querySchema = z.object({
  spaceId: z.string().trim().min(1).default("default"),
});

function isValidDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const GET = withApi<unknown, z.infer<typeof querySchema>>(
  async (_request, { query }) => {
    const repository = getRepository();
    const [goals, spaces] = await Promise.all([
      repository.listCommunityGoals(query.spaceId),
      repository.listSpaces(),
    ]);
    const space = spaces.find((item) => item.id === query.spaceId);
    const now = new Date();
    const active = goals.find((goal) =>
      goal.period_start <= now.toISOString().slice(0, 10)
      && goal.period_end >= now.toISOString().slice(0, 10),
    ) ?? null;
    const readings = active
      ? (await repository.getReadings(query.spaceId, {
        from: active.period_start,
        to: active.period_end,
        limit: 5000,
      })).items
      : [];
    return NextResponse.json({
      data: {
        goals,
        activeGoal: active,
        progress: active
          ? communityGoalProgress(
            active,
            readings,
            space?.baselineKwhPerDay ?? ASSUMED_DEFAULT_BASELINE_KWH_PER_DAY,
            now,
          )
          : null,
        baselineEstimated: space?.baselineKwhPerDay === undefined,
      },
    });
  },
  { querySchema },
);

const createGoalSchema = z.object({
  spaceId: z.string().trim().min(1).default("default"),
  targetPercent: z.number().finite().min(0.1).max(100),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidDate),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidDate),
}).refine((value) => value.periodStart <= value.periodEnd, {
  message: "Goal period end must be on or after the start date.",
  path: ["periodEnd"],
});

export const POST = withApi<z.infer<typeof createGoalSchema>>(
  async (_request, { body }) => {
    const repository = getRepository();
    const spaces = await repository.listSpaces();
    if (!spaces.some((space) => space.id === body.spaceId)) {
      return NextResponse.json({
        error: {
          code: "NOT_FOUND",
          message: "The selected community does not exist.",
        },
      }, { status: 404 });
    }

    const goal = await repository.createCommunityGoal({
      id: randomUUID(),
      space_id: body.spaceId,
      target_percent: body.targetPercent,
      period_start: body.periodStart,
      period_end: body.periodEnd,
    });
    return NextResponse.json({ data: goal }, { status: 201 });
  },
  { bodySchema: createGoalSchema },
);
