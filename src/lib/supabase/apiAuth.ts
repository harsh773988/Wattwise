import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient, isSupabaseAuthConfigured } from "./server";

export interface ApiAuthContext {
  readonly enabled: boolean;
  readonly user: User | null;
  readonly supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | null;
}

export async function getApiAuthContext(): Promise<ApiAuthContext> {
  if (!isSupabaseAuthConfigured()) {
    return { enabled: false, user: null, supabase: null };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error && data.user) {
    throw new Error(`Could not verify the current user: ${error.message}`);
  }

  return { enabled: true, user: data.user, supabase };
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Sign in to access this resource." } },
    { status: 401 },
  );
}

export async function resolveOwnedSpaceId(
  auth: ApiAuthContext,
  requestedSpaceId: string,
): Promise<string | null> {
  if (!auth.enabled) return requestedSpaceId;
  if (!auth.user || !auth.supabase) return null;

  const spaceId = requestedSpaceId === "default" ? auth.user.id : requestedSpaceId;
  const { data, error } = await auth.supabase
    .from("spaces")
    .select("id")
    .eq("id", spaceId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not verify space access: ${error.message}`);
  }

  return data?.id ?? null;
}

export function resolveProfileId(
  auth: ApiAuthContext,
  requestedProfileId: string,
): string | null {
  if (!auth.enabled) return requestedProfileId;
  return auth.user?.id ?? null;
}
