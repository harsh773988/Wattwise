import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/infra";
import { buildGamificationOverview } from "@/services/gamificationService";
import { withApi } from "@/lib/apiWrapper";

const querySchema = z.object({
  profileId: z.string().trim().min(1).default("demo-profile"),
  spaceId: z.string().trim().min(1).default("default"),
});

export const GET = withApi<unknown, z.infer<typeof querySchema>>(
  async (_request, { query }) => {
    const overview = await buildGamificationOverview(
      getRepository(),
      query.profileId,
      query.spaceId,
    );
    return NextResponse.json({
      data: {
        leaderboard: overview.leaderboard,
        myRank: overview.myRank,
      },
    });
  },
  { querySchema },
);
