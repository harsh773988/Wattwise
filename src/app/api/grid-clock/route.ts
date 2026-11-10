/**
 * Real-time National Grid Stress & CEA Carbon Intensity API.
 */

import { NextResponse } from "next/server";
import { getGridClockStatus, SHIFTABLE_APPLIANCES } from "@/domain/nationalGridClock";
import { withApi } from "@/lib/apiWrapper";

export const GET = withApi(async () => {
  // Current IST time
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utcTime + 5.5 * 3600000);
  const hour = istDate.getHours();
  const minute = istDate.getMinutes();

  const status = getGridClockStatus(hour, minute);

  return NextResponse.json({
    data: {
      istTime: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} IST`,
      status,
      shiftableAppliances: SHIFTABLE_APPLIANCES,
    },
  });
});

