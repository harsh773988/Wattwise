import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getRepository } from "@/infra";
import { createErrorResponse } from "@/lib/apiError";
import { getEnv } from "@/lib/config";
import { withApi } from "@/lib/apiWrapper";
import { buildAdminSummary } from "@/services/adminService";

function hasValidAdminKey(requestKey: string | null, configuredKey: string | undefined): boolean {
  if (!requestKey || !configuredKey) return false;
  const requestBytes = Buffer.from(requestKey);
  const configuredBytes = Buffer.from(configuredKey);
  return requestBytes.length === configuredBytes.length
    && timingSafeEqual(requestBytes, configuredBytes);
}

export const GET = withApi(async (request) => {
  if (!hasValidAdminKey(request.headers.get("x-admin-key"), getEnv().ADMIN_KEY)) {
    return createErrorResponse("UNAUTHORIZED", "A valid administrator key is required.", 401);
  }

  return NextResponse.json({ data: await buildAdminSummary(getRepository()) });
});
