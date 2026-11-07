/**
 * Rooftop solar feasibility estimator (pure domain logic, no I/O).
 *
 * All numbers are PLANNING ESTIMATES driven by configurable assumptions.
 * No subsidy, vendor price or payback guarantee is hardcoded or claimed.
 * Always confirm with an official source and a written site-specific quote.
 */

export interface SolarAssumptions {
  /** Grid tariff in ₹/kWh. Varies by state, DISCOM and slab. */
  tariffPerKwh: number;
  /** Average daily generation per installed kW (kWh/kW/day). */
  generationKwhPerKwPerDay: number;
  /** Shadow-free roof area needed per kW (sq ft/kW). */
  areaSqFtPerKw: number;
  /** Fraction of the entered roof area that is realistically usable (0-1). */
  usableRoofFraction: number;
  /** Installed cost placeholder in ₹/kW, BEFORE any incentive. */
  costPerKw: number;
  /** Grid emission factor in kg CO₂ per kWh. */
  gridEmissionKgPerKwh: number;
  /** Panel/system degradation is ignored; payback is simple (undiscounted). */
}

export const DEFAULT_SOLAR_ASSUMPTIONS: SolarAssumptions = {
  tariffPerKwh: 7,
  generationKwhPerKwPerDay: 4,
  areaSqFtPerKw: 100,
  usableRoofFraction: 0.7,
  costPerKw: 60000,
  gridEmissionKgPerKwh: 0.82,
};

export interface SolarInput {
  monthlyBillInr: number;
  roofAreaSqFt: number;
}

export interface SolarEstimate {
  monthlyConsumptionKwh: number;
  /** Capacity needed to offset the full consumption. */
  requiredKw: number;
  /** Max capacity the usable roof can host. */
  roofLimitKw: number;
  /** Recommended capacity = min(required, roofLimit), rounded to 0.1 kW. */
  recommendedKw: number;
  roofLimited: boolean;
  monthlyGenerationKwh: number;
  /** Share of monthly consumption covered by solar (0-1). */
  offsetFraction: number;
  estimatedCostInr: number;
  monthlySavingsInr: number;
  annualSavingsInr: number;
  /** Simple payback in years, or null if savings are zero. */
  paybackYears: number | null;
  monthlyCo2ReductionKg: number;
  annualCo2ReductionKg: number;
}

export type SolarValidation =
  | { ok: true; input: SolarInput }
  | { ok: false; errors: string[] };

const MAX_BILL_INR = 1_000_000;
const MAX_ROOF_SQFT = 100_000;

export function validateSolarInput(raw: {
  monthlyBillInr: unknown;
  roofAreaSqFt: unknown;
}): SolarValidation {
  const errors: string[] = [];
  const bill = Number(raw.monthlyBillInr);
  const roof = Number(raw.roofAreaSqFt);

  if (!Number.isFinite(bill) || bill <= 0) {
    errors.push("Enter a monthly electricity bill greater than ₹0.");
  } else if (bill > MAX_BILL_INR) {
    errors.push("Monthly bill looks too high. Enter a value up to ₹10,00,000.");
  }
  if (!Number.isFinite(roof) || roof <= 0) {
    errors.push("Enter a roof area greater than 0 sq ft.");
  } else if (roof > MAX_ROOF_SQFT) {
    errors.push("Roof area looks too large. Enter a value up to 100,000 sq ft.");
  }

  return errors.length
    ? { ok: false, errors }
    : { ok: true, input: { monthlyBillInr: bill, roofAreaSqFt: roof } };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round0 = (n: number) => Math.round(n);

export function estimateSolar(
  input: SolarInput,
  overrides: Partial<SolarAssumptions> = {},
): SolarEstimate {
  const a: SolarAssumptions = { ...DEFAULT_SOLAR_ASSUMPTIONS, ...overrides };

  const monthlyConsumptionKwh = input.monthlyBillInr / a.tariffPerKwh;
  const monthlyKwhPerKw = a.generationKwhPerKwPerDay * 30;

  const requiredKw = monthlyConsumptionKwh / monthlyKwhPerKw;
  const roofLimitKw =
    (input.roofAreaSqFt * a.usableRoofFraction) / a.areaSqFtPerKw;

  const rawRecommended = Math.min(requiredKw, roofLimitKw);
  const recommendedKw = round1(rawRecommended);
  const roofLimited = roofLimitKw < requiredKw;

  // Use unrounded capacity for money/energy math so outputs stay consistent.
  const monthlyGenerationKwh = rawRecommended * monthlyKwhPerKw;
  const usefulKwh = Math.min(monthlyGenerationKwh, monthlyConsumptionKwh);
  const offsetFraction =
    monthlyConsumptionKwh > 0 ? usefulKwh / monthlyConsumptionKwh : 0;

  const estimatedCostInr = rawRecommended * a.costPerKw;
  const monthlySavingsInr = usefulKwh * a.tariffPerKwh;
  const annualSavingsInr = monthlySavingsInr * 12;
  const paybackYears =
    annualSavingsInr > 0 ? round1(estimatedCostInr / annualSavingsInr) : null;

  const monthlyCo2ReductionKg = usefulKwh * a.gridEmissionKgPerKwh;

  return {
    monthlyConsumptionKwh: round0(monthlyConsumptionKwh),
    requiredKw: round1(requiredKw),
    roofLimitKw: round1(roofLimitKw),
    recommendedKw,
    roofLimited,
    monthlyGenerationKwh: round0(monthlyGenerationKwh),
    offsetFraction,
    estimatedCostInr: round0(estimatedCostInr),
    monthlySavingsInr: round0(monthlySavingsInr),
    annualSavingsInr: round0(annualSavingsInr),
    paybackYears,
    monthlyCo2ReductionKg: round0(monthlyCo2ReductionKg),
    annualCo2ReductionKg: round0(monthlyCo2ReductionKg * 12),
  };
}
