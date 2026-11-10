import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/infra";
import { buildGamificationOverview } from "@/services/gamificationService";
import { withApi } from "@/lib/apiWrapper";
import {
  getApiAuthContext,
  resolveOwnedSpaceId,
  resolveProfileId,
  unauthorizedResponse,
} from "@/lib/supabase/apiAuth";

const querySchema = z.object({
  profileId: z.string().trim().min(1).default("demo-profile"),
  spaceId: z.string().trim().min(1).default("default"),
});

export const GET = withApi<unknown, z.infer<typeof querySchema>>(
  async (_request, { query }) => {
    const auth = await getApiAuthContext();
    if (auth.enabled && !auth.user) return unauthorizedResponse();
    const profileId = resolveProfileId(auth, query.profileId);
    if (!profileId) return unauthorizedResponse();
    const spaceId = await resolveOwnedSpaceId(auth, query.spaceId);
    if (!spaceId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You do not have access to this space." } },
        { status: 403 },
      );
    }
    const overview = await buildGamificationOverview(
      getRepository(),
      profileId,
      spaceId,
    );
    return NextResponse.json({
      data: {
        profileId: overview.profileId,
        baselineEstimated: overview.baselineEstimated,
        points: overview.points,
        streak: overview.streak,
        badges: overview.badges,
        latestBadge: overview.badges.at(-1) ?? null,
        myRank: overview.myRank,
      },
    });
  },
  { querySchema },
);
