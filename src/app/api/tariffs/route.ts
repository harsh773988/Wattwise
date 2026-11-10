/**
 * Pan-India DISCOM Tariff Calculation API.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateStateBill, listSupportedStates } from "@/domain/nationalTariff";
import { withApi } from "@/lib/apiWrapper";

const tariffQuerySchema = z.object({
  state: z.string().trim().default("PAN_INDIA"),
  discom: z.string().trim().optional(),
  kwh: z.coerce.number().min(0).max(100000).default(250),
});

export const GET = withApi(async (req) => {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = tariffQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { state, discom, kwh } = parsed.data;
  const bill = calculateStateBill(kwh, state, discom);
  const supportedStates = listSupportedStates().map((s) => ({
    code: s.code,
    name: s.name,
    region: s.region,
    discomCount: s.discoms.length,
  }));

  return NextResponse.json({
    data: {
      bill,
      supportedStates,
    },
  });
});
