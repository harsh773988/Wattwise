/**
 * Home Energy Audit & Appliance Disaggregation Engine.
 * Calculates appliance-level energy breakdowns and retrofit return-on-investment (e.g. BLDC fans, Inverter ACs).
 * Pure domain logic — zero framework, I/O, or env imports.
 */

import { round2 } from "./cost";

export interface ApplianceProfileItem {
  readonly id: string;
  readonly name: string;
  readonly category: "cooling" | "heating" | "refrigeration" | "lighting" | "appliances";
  readonly count: number;
  readonly ratedWatts: number;
  readonly dailyUsageHours: number;
}

export interface ApplianceAuditResult {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly dailyKwh: number;
  readonly monthlyKwh: number;
  readonly monthlyCostInr: number;
  readonly sharePercent: number;
  readonly recommendedUpgrade?: {
    readonly upgradeTitle: string;
    readonly newWatts: number;
    readonly monthlySavedKwh: number;
    readonly monthlySavedInr: number;
    readonly equipmentCostInr: number;
    readonly paybackMonths: number;
  };
}

export interface WholeHomeAuditSummary {
  readonly items: readonly ApplianceAuditResult[];
  readonly totalDailyKwh: number;
  readonly totalMonthlyKwh: number;
  readonly totalMonthlyCostInr: number;
  readonly highestConsumerName: string;
  readonly totalPotentialMonthlySavingsInr: number;
}

export const STANDARD_HOUSEHOLD_APPLIANCES: readonly ApplianceProfileItem[] = [
  {
    id: "ceiling_fans",
    name: "Ceiling Fans (Standard)",
    category: "cooling",
    count: 3,
    ratedWatts: 75,
    dailyUsageHours: 12,
  },
  {
    id: "air_conditioner",
    name: "1.5 Ton AC (3-Star Split)",
    category: "cooling",
    count: 1,
    ratedWatts: 1450,
    dailyUsageHours: 6,
  },
  {
    id: "refrigerator",
    name: "Refrigerator (260L Frost-Free)",
    category: "refrigeration",
    count: 1,
    ratedWatts: 180,
    dailyUsageHours: 10, // compressor duty cycle ~10 hrs/day
  },
  {
    id: "water_geyser",
    name: "Storage Water Geyser (25L)",
    category: "heating",
    count: 1,
    ratedWatts: 2000,
    dailyUsageHours: 1.5,
  },
  {
    id: "lighting",
    name: "LED Home Lighting",
    category: "lighting",
    count: 8,
    ratedWatts: 10,
    dailyUsageHours: 5,
  },
  {
    id: "tv_entertainment",
    name: "Smart TV & Set-Top Box",
    category: "appliances",
    count: 1,
    ratedWatts: 120,
    dailyUsageHours: 4,
  },
];

/**
 * Perform a home appliance energy audit with upgrade ROI calculation.
 */
export function performHomeEnergyAudit(
  appliances: readonly ApplianceProfileItem[],
  tariffPerKwh = 6.8
): WholeHomeAuditSummary {
  let totalDailyKwh = 0;

  const rawResults = appliances.map((item) => {
    // daily kWh = count * (watts / 1000) * hours
    const dailyKwh = round2(
      item.count * (item.ratedWatts / 1000) * item.dailyUsageHours
    );
    totalDailyKwh += dailyKwh;
    return { item, dailyKwh };
  });

  totalDailyKwh = round2(totalDailyKwh);
  const totalMonthlyKwh = round2(totalDailyKwh * 30);
  const totalMonthlyCostInr = round2(totalMonthlyKwh * tariffPerKwh);

  let highestConsumerName = "";
  let highestKwh = -1;
  let totalPotentialMonthlySavingsInr = 0;

  const items: ApplianceAuditResult[] = rawResults.map(({ item, dailyKwh }) => {
    const monthlyKwh = round2(dailyKwh * 30);
    const monthlyCostInr = round2(monthlyKwh * tariffPerKwh);
    const sharePercent =
      totalDailyKwh > 0 ? round2((dailyKwh / totalDailyKwh) * 100) : 0;

    if (dailyKwh > highestKwh) {
      highestKwh = dailyKwh;
      highestConsumerName = item.name;
    }

    // Check for standard high-ROI energy efficiency retrofits in India
    let recommendedUpgrade: ApplianceAuditResult["recommendedUpgrade"] | undefined;

    if (item.id === "ceiling_fans" && item.ratedWatts >= 65) {
      // Upgrade standard 75W fan to 28W 5-Star BLDC fan
      const bldcWatts = 28;
      const newDailyKwh = item.count * (bldcWatts / 1000) * item.dailyUsageHours;
      const monthlySavedKwh = round2((dailyKwh - newDailyKwh) * 30);
      const monthlySavedInr = round2(monthlySavedKwh * tariffPerKwh);
      const equipmentCostInr = item.count * 2800; // ~₹2,800 per BLDC fan
      const paybackMonths =
        monthlySavedInr > 0 ? round2(equipmentCostInr / monthlySavedInr) : 0;

      recommendedUpgrade = {
        upgradeTitle: "Retrofit to 5-Star BLDC Fans (28W)",
        newWatts: bldcWatts,
        monthlySavedKwh,
        monthlySavedInr,
        equipmentCostInr,
        paybackMonths,
      };
      totalPotentialMonthlySavingsInr += monthlySavedInr;
    } else if (item.id === "air_conditioner" && item.ratedWatts > 1100) {
      // Upgrade to 5-Star Dual Inverter AC (~950W average compressor draw)
      const inverterWatts = 950;
      const newDailyKwh = item.count * (inverterWatts / 1000) * item.dailyUsageHours;
      const monthlySavedKwh = round2((dailyKwh - newDailyKwh) * 30);
      const monthlySavedInr = round2(monthlySavedKwh * tariffPerKwh);
      const equipmentCostInr = 38000;
      const paybackMonths =
        monthlySavedInr > 0 ? round2(equipmentCostInr / monthlySavedInr) : 0;

      recommendedUpgrade = {
        upgradeTitle: "Upgrade to 5-Star Inverter AC",
        newWatts: inverterWatts,
        monthlySavedKwh,
        monthlySavedInr,
        equipmentCostInr,
        paybackMonths,
      };
      totalPotentialMonthlySavingsInr += monthlySavedInr;
    }

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      dailyKwh,
      monthlyKwh,
      monthlyCostInr,
      sharePercent,
      recommendedUpgrade,
    };
  });

  return {
    items,
    totalDailyKwh,
    totalMonthlyKwh,
    totalMonthlyCostInr,
    highestConsumerName,
    totalPotentialMonthlySavingsInr: round2(totalPotentialMonthlySavingsInr),
  };
}

