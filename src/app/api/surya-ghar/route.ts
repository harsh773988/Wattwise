/**
 * PM Surya Ghar: Muft Bijli Yojana Calculation API.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateSuryaGharPlan, STATE_SOLAR_POLICIES } from "@/domain/suryaGharNational";
import { withApi } from "@/lib/apiWrapper";

const suryaGharQuerySchema = z.object({
  bill: z.coerce.number().positive().max(1000000).default(3000),
  roof: z.coerce.number().positive().max(100000).default(500),
  state: z.string().trim().default("PAN_INDIA"),
});

export const GET = withApi(async (req) => {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = suryaGharQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { bill, roof, state } = parsed.data;
  const plan = calculateSuryaGharPlan({
    monthlyBillInr: bill,
    roofAreaSqFt: roof,
    stateCode: state,
  });

  return NextResponse.json({
    data: {
      plan,
      availableStatePolicies: STATE_SOLAR_POLICIES.map((p) => ({
        code: p.stateCode,
        name: p.stateName,
        sunHours: p.solarHoursPerDay,
        stateSubsidyPerKw: p.stateSubsidyPerKw,
        stateSubsidyFlatInr: p.stateSubsidyFlatInr ?? 0,
        maxStateSubsidy: p.maxStateSubsidy ?? null,
        stateSubsidyStatus: p.stateSubsidyStatus,
        netMeteringExportRateInr: p.netMeteringExportRateInr,
      })),
    },
  });
});
