import { NextResponse } from "next/server";
import { getRepository } from "@/infra";
import { seedDemoCommunities } from "@/services/demoCommunityService";
import { withApi } from "@/lib/apiWrapper";

export const POST = withApi(async () => {
  const result = await seedDemoCommunities(
    getRepository(),
    new Date().toISOString().slice(0, 10),
  );
  return NextResponse.json({ data: result });
});
