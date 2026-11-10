/**
 * PM Surya Ghar: Muft Bijli Yojana (National Rooftop Solar Engine).
 * Models central subsidy assumptions, configured state top-ups,
 * and 25-year lifecycle financial estimates.
 * Pure domain logic — zero framework, I/O, or env imports.
 */

import { round2 } from "./cost";

export interface SuryaGharInput {
  readonly monthlyBillInr: number;
  readonly roofAreaSqFt: number;
  readonly stateCode?: string;
}

export interface StateSolarPolicy {
  readonly stateCode: string;
  readonly stateName: string;
  readonly solarHoursPerDay: number; // average peak sun hours (NREL / PVGIS)
  readonly stateSubsidyPerKw: number; // additional state top-up (₹/kW)
  readonly stateSubsidyFlatInr?: number;
  readonly maxStateSubsidy?: number; // state subsidy cap
  readonly stateSubsidyStatus: "included" | "none" | "unverified";
  readonly netMeteringExportRateInr: number; // feed-in credit for excess units exported to grid
}

export const STATE_SOLAR_POLICIES: readonly StateSolarPolicy[] = [
  {
    stateCode: "GJ",
    stateName: "Gujarat",
    solarHoursPerDay: 5.5,
    stateSubsidyPerKw: 0,
    stateSubsidyStatus: "unverified",
    netMeteringExportRateInr: 2.25,
  },
  {
    stateCode: "DL",
    stateName: "Delhi",
    solarHoursPerDay: 4.6,
    stateSubsidyPerKw: 0,
    stateSubsidyStatus: "unverified",
    netMeteringExportRateInr: 2.25,
  },
  {
    stateCode: "UP",
    stateName: "Uttar Pradesh",
    solarHoursPerDay: 4.6,
    stateSubsidyPerKw: 0,
    stateSubsidyFlatInr: 15000,
    maxStateSubsidy: 15000,
    stateSubsidyStatus: "included",
    netMeteringExportRateInr: 2.25,
  },
  {
    stateCode: "MH",
    stateName: "Maharashtra",
    solarHoursPerDay: 5.5,
    stateSubsidyPerKw: 0,
    stateSubsidyStatus: "none",
    netMeteringExportRateInr: 2.25,
  },
  {
    stateCode: "KA",
    stateName: "Karnataka",
    solarHoursPerDay: 5.0,
    stateSubsidyPerKw: 0,
    stateSubsidyStatus: "none",
    netMeteringExportRateInr: 2.25,
  },
  {
    stateCode: "RJ",
    stateName: "Rajasthan",
    solarHoursPerDay: 5.5,
    stateSubsidyPerKw: 0,
    stateSubsidyStatus: "none",
    netMeteringExportRateInr: 2.25,
  },
  {
    stateCode: "PAN_INDIA",
    stateName: "National Benchmark",
    solarHoursPerDay: 5.0,
    stateSubsidyPerKw: 0,
    stateSubsidyStatus: "none",
    netMeteringExportRateInr: 2.25,
  },
  {
    stateCode: "TN",
    stateName: "Tamil Nadu",
    solarHoursPerDay: 5.0,
    stateSubsidyPerKw: 0,
    stateSubsidyStatus: "none",
    netMeteringExportRateInr: 2.25,
  },
  {
    stateCode: "WB",
    stateName: "West Bengal",
    solarHoursPerDay: 4.2,
    stateSubsidyPerKw: 0,
    stateSubsidyStatus: "none",
    netMeteringExportRateInr: 2.25,
  },
  { stateCode: "AP", stateName: "Andhra Pradesh", solarHoursPerDay: 5.0, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "AR", stateName: "Arunachal Pradesh", solarHoursPerDay: 4.2, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "AS", stateName: "Assam", solarHoursPerDay: 4.2, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "BR", stateName: "Bihar", solarHoursPerDay: 4.2, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "CG", stateName: "Chhattisgarh", solarHoursPerDay: 5.0, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "GA", stateName: "Goa", solarHoursPerDay: 5.5, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "HR", stateName: "Haryana", solarHoursPerDay: 4.6, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "HP", stateName: "Himachal Pradesh", solarHoursPerDay: 4.6, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "JH", stateName: "Jharkhand", solarHoursPerDay: 4.2, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "KL", stateName: "Kerala", solarHoursPerDay: 5.0, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "MP", stateName: "Madhya Pradesh", solarHoursPerDay: 5.0, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "MN", stateName: "Manipur", solarHoursPerDay: 4.2, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "ML", stateName: "Meghalaya", solarHoursPerDay: 4.2, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "MZ", stateName: "Mizoram", solarHoursPerDay: 4.2, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "NL", stateName: "Nagaland", solarHoursPerDay: 4.2, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "OD", stateName: "Odisha", solarHoursPerDay: 4.2, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "PB", stateName: "Punjab", solarHoursPerDay: 4.6, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "SK", stateName: "Sikkim", solarHoursPerDay: 4.2, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "TG", stateName: "Telangana", solarHoursPerDay: 5.0, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "TR", stateName: "Tripura", solarHoursPerDay: 4.2, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "UK", stateName: "Uttarakhand", solarHoursPerDay: 4.6, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "CH", stateName: "Chandigarh", solarHoursPerDay: 4.6, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "PY", stateName: "Puducherry", solarHoursPerDay: 5.0, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "LD", stateName: "Lakshadweep", solarHoursPerDay: 5.0, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "DN", stateName: "Dadra and Nagar Haveli and Daman and Diu", solarHoursPerDay: 5.5, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "JK", stateName: "Jammu and Kashmir", solarHoursPerDay: 4.6, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "LA", stateName: "Ladakh", solarHoursPerDay: 4.6, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
  { stateCode: "AN", stateName: "Andaman and Nicobar Islands", solarHoursPerDay: 4.2, stateSubsidyPerKw: 0, stateSubsidyStatus: "unverified", netMeteringExportRateInr: 2.25 },
];

export interface SuryaGharCalculation {
  readonly stateCode: string;
  readonly stateName: string;
  readonly estimatedMonthlyConsumptionKwh: number;
  readonly recommendedSystemKw: number;
  readonly roofLimitKw: number;
  readonly isRoofConstrained: boolean;
  readonly grossCostInr: number;
  readonly centralSubsidyInr: number;
  readonly stateSubsidyInr: number;
  readonly stateSubsidyStatus: StateSolarPolicy["stateSubsidyStatus"];
  readonly totalSubsidyInr: number;
  readonly netCustomerCostInr: number;
  readonly monthlyGenerationKwh: number;
  readonly annualGenerationKwh: number;
  readonly monthlySavingsInr: number;
  readonly annualSavingsInr: number;
  readonly monthlyExportRevenueInr: number;
  readonly annualExportRevenueInr: number;
  readonly netMeteringExportRateInr: number;
  readonly paybackYears: number | null;
  readonly net25YearSavingsInr: number;
  readonly yearlyProjections: readonly SuryaGharYearProjection[];
  readonly co2AvoidedKgPerYear: number;
  readonly treesEquivalent: number;
}

export interface SuryaGharYearProjection {
  readonly year: number;
  readonly annualSavingsInr: number;
  readonly cumulativeNetSavingsInr: number;
  readonly inverterReplacementCostInr: number;
}

/**
 * Estimate central subsidy from the current configured PM Surya Ghar model.
 * Rules:
 * - 1 kW system: ₹30,000
 * - 2 kW system: ₹60,000
 * - 3 kW to 10 kW system: ₹78,000 flat cap.
 * - Above 10 kW: ₹78,000 (residential cap).
 */
export function calculateCentralSubsidy(systemKw: number): number {
  if (!Number.isFinite(systemKw)) {
    throw new RangeError("System capacity must be a finite number");
  }
  if (systemKw <= 0) return 0;
  if (systemKw < 1) {
    return round2(systemKw * 30000);
  }
  if (systemKw <= 2) {
    return round2(30000 + (systemKw - 1) * 30000);
  }
  if (systemKw < 3) {
    return round2(60000 + (systemKw - 2) * 18000);
  }
  return 78000;
}

export function getStateSolarPolicy(stateCode = "PAN_INDIA"): StateSolarPolicy {
  const match = STATE_SOLAR_POLICIES.find(
    (p) => p.stateCode.toUpperCase() === stateCode.toUpperCase()
  );
  if (match) return match;
  return STATE_SOLAR_POLICIES.find((p) => p.stateCode === "PAN_INDIA")!;
}

/**
 * Calculate complete PM Surya Ghar solar economics for a household in India.
 */
export function calculateSuryaGharPlan(
  input: SuryaGharInput
): SuryaGharCalculation {
  const { monthlyBillInr, roofAreaSqFt, stateCode = "PAN_INDIA" } = input;

  if (monthlyBillInr <= 0 || !Number.isFinite(monthlyBillInr)) {
    throw new RangeError("Monthly bill must be positive");
  }
  if (roofAreaSqFt <= 0 || !Number.isFinite(roofAreaSqFt)) {
    throw new RangeError("Roof area must be positive");
  }

  const policy = getStateSolarPolicy(stateCode);

  // Standard benchmark assumptions
  const tariffEstimatePerKwh = 6.8; // ₹/kWh average
  const costPerKw = 60000; // Benchmark MNRE cost per kW for residential systems
  const sqFtPerKw = 100; // Standard shadow-free area needed per kW
  const usableRoofFraction = 0.7; // 70% usable roof fraction
  const daysInMonth = 30.4;
  const emissionFactor = 0.716; // CEA national factor kg CO2 / kWh

  // 1. Consumption estimate
  const estimatedMonthlyConsumptionKwh = round2(
    monthlyBillInr / tariffEstimatePerKwh
  );

  // 2. Generation required to achieve net-zero bill
  const targetMonthlyKwh = estimatedMonthlyConsumptionKwh;
  const kwhGeneratedPerKwPerDay = policy.solarHoursPerDay * 0.78; // Performance ratio ~78%
  const monthlyKwhPerKw = kwhGeneratedPerKwPerDay * daysInMonth;
  const requiredKw = round2(targetMonthlyKwh / monthlyKwhPerKw);

  // 3. Physical roof limits
  const usableRoofArea = roofAreaSqFt * usableRoofFraction;
  const roofLimitKw = round2(usableRoofArea / sqFtPerKw);

  const capacityBeforeRoofLimit =
    Math.round(Math.min(requiredKw, roofLimitKw) * 2) / 2;
  const recommendedSystemKw = Math.min(capacityBeforeRoofLimit, roofLimitKw);
  const isRoofConstrained = roofLimitKw < requiredKw;

  // 5. Cost and Subsidies
  const grossCostInr = round2(recommendedSystemKw * costPerKw);
  const centralSubsidyInr = calculateCentralSubsidy(recommendedSystemKw);

  const potentialStateSubsidy =
    recommendedSystemKw * policy.stateSubsidyPerKw +
    (policy.stateSubsidyFlatInr ?? 0);
  const cappedStateSubsidy =
    policy.maxStateSubsidy === undefined
      ? potentialStateSubsidy
      : Math.min(potentialStateSubsidy, policy.maxStateSubsidy);
  const stateSubsidyInr =
    policy.stateSubsidyStatus === "included" ? round2(cappedStateSubsidy) : 0;

  const totalSubsidyInr = round2(centralSubsidyInr + stateSubsidyInr);
  const netCustomerCostInr = Math.max(0, round2(grossCostInr - totalSubsidyInr));

  // 6. Generation & Savings
  const monthlyGenerationKwh = round2(recommendedSystemKw * monthlyKwhPerKw);
  const annualGenerationKwh = round2(monthlyGenerationKwh * 12);

  // Units offset vs units exported
  const selfConsumedKwh = Math.min(
    monthlyGenerationKwh,
    estimatedMonthlyConsumptionKwh
  );
  const exportedKwh = Math.max(
    0,
    monthlyGenerationKwh - estimatedMonthlyConsumptionKwh
  );

  const monthlyExportRevenueInr = round2(
    exportedKwh * policy.netMeteringExportRateInr
  );
  const monthlySavingsInr = round2(
    selfConsumedKwh * tariffEstimatePerKwh + monthlyExportRevenueInr
  );
  const annualSavingsInr = round2(monthlySavingsInr * 12);
  const annualExportRevenueInr = round2(monthlyExportRevenueInr * 12);

  // 7. Payback and 25-Year Lifecycle
  const inverterReplacementCost =
    recommendedSystemKw === 0 ? 0 : recommendedSystemKw >= 3 ? 25000 : 15000;
  let cumulativeSavings = 0;
  const yearlyProjections: SuryaGharYearProjection[] = [];
  for (let year = 1; year <= 25; year++) {
    const annualSavings = round2(annualSavingsInr * Math.pow(1 - 0.007, year - 1));
    const replacementCost = year === 12 ? inverterReplacementCost : 0;
    cumulativeSavings += annualSavings;
    yearlyProjections.push({
      year,
      annualSavingsInr: annualSavings,
      cumulativeNetSavingsInr: round2(
        cumulativeSavings - netCustomerCostInr - (year >= 12 ? inverterReplacementCost : 0)
      ),
      inverterReplacementCostInr: replacementCost,
    });
  }
  const paybackYears =
    annualSavingsInr > 0 ? round2(netCustomerCostInr / annualSavingsInr) : null;
  const net25YearSavingsInr =
    yearlyProjections[yearlyProjections.length - 1].cumulativeNetSavingsInr;

  // 8. Environmental Impact
  const co2AvoidedKgPerYear = round2(annualGenerationKwh * emissionFactor);
  // 1 mature tree absorbs ~20 kg CO2 / year
  const treesEquivalent = Math.round(co2AvoidedKgPerYear / 20);

  return {
    stateCode: policy.stateCode,
    stateName: policy.stateName,
    estimatedMonthlyConsumptionKwh,
    recommendedSystemKw,
    roofLimitKw,
    isRoofConstrained,
    grossCostInr,
    centralSubsidyInr,
    stateSubsidyInr,
    stateSubsidyStatus: policy.stateSubsidyStatus,
    totalSubsidyInr,
    netCustomerCostInr,
    monthlyGenerationKwh,
    annualGenerationKwh,
    monthlySavingsInr,
    annualSavingsInr,
    monthlyExportRevenueInr,
    annualExportRevenueInr,
    netMeteringExportRateInr: policy.netMeteringExportRateInr,
    paybackYears,
    net25YearSavingsInr,
    yearlyProjections,
    co2AvoidedKgPerYear,
    treesEquivalent,
  };
}
