export interface SolarAssumptions {
  tariffPerKwh: number;
  emissionFactor: number;
  generationKwhPerKwPerDay: number;
  areaSqFtPerKw: number;
  usableRoofFraction: number;
  costPerKw: number;
}

export interface SolarInput {
  monthlyBillInr: number;
  roofAreaSqFt: number;
}

export interface SolarEstimate {
  monthlyConsumptionKwh: number;
  requiredKw: number;
  roofLimitKw: number;
  recommendedKw: number;
  monthlyGenerationKwh: number;
  usefulKwh: number;
  estimatedCostInr: number;
  monthlySavingsInr: number;
  annualSavingsInr: number;
  paybackYears: number | null;
  monthlyCo2ReductionKg: number;
  annualCo2ReductionKg: number;
  offsetFraction: number;
  roofLimited: boolean;
}

export type SolarValidation =
  | { ok: true; input: SolarInput }
  | { ok: false; errors: string[] };

export function validateSolarInput(raw: {
  monthlyBillInr: unknown;
  roofAreaSqFt: unknown;
}): SolarValidation {
  const errors: string[] = [];
  const monthlyBillInr = parsePositiveNumber(raw.monthlyBillInr);
  const roofAreaSqFt = parsePositiveNumber(raw.roofAreaSqFt);

  if (!Number.isFinite(monthlyBillInr) || monthlyBillInr <= 0) {
    errors.push("Enter a monthly electricity bill greater than ₹0.");
  } else if (monthlyBillInr > 1_000_000) {
    errors.push("Monthly electricity bill must be ₹1,000,000 or less.");
  }

  if (!Number.isFinite(roofAreaSqFt) || roofAreaSqFt <= 0) {
    errors.push("Enter a roof area greater than 0 sq ft.");
  } else if (roofAreaSqFt > 100_000) {
    errors.push("Roof area must be 100,000 sq ft or less.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    input: { monthlyBillInr, roofAreaSqFt },
  };
}

function parsePositiveNumber(value: unknown): number {
  if (typeof value !== "number" && typeof value !== "string") {
    return Number.NaN;
  }
  if (typeof value === "string" && value.trim() === "") {
    return Number.NaN;
  }
  return Number(value);
}

export function estimateSolar(
  input: SolarInput,
  assumptions: SolarAssumptions,
): SolarEstimate {
  const monthlyConsumptionKwh = input.monthlyBillInr / assumptions.tariffPerKwh;
  const requiredKw =
    monthlyConsumptionKwh /
    (assumptions.generationKwhPerKwPerDay * 30);
  const roofLimitKw =
    (input.roofAreaSqFt * assumptions.usableRoofFraction) /
    assumptions.areaSqFtPerKw;
  const rawKw = Math.min(requiredKw, roofLimitKw);
  const monthlyGenerationKwh =
    rawKw * assumptions.generationKwhPerKwPerDay * 30;
  const usefulKwh = Math.min(monthlyGenerationKwh, monthlyConsumptionKwh);
  const estimatedCostInr = rawKw * assumptions.costPerKw;
  const monthlySavingsInr = usefulKwh * assumptions.tariffPerKwh;
  const annualSavingsInr = monthlySavingsInr * 12;
  const monthlyCo2ReductionKg = usefulKwh * assumptions.emissionFactor;
  const annualCo2ReductionKg = monthlyCo2ReductionKg * 12;

  return {
    monthlyConsumptionKwh: Math.round(monthlyConsumptionKwh),
    requiredKw: roundToOneDecimal(requiredKw),
    roofLimitKw: roundToOneDecimal(roofLimitKw),
    recommendedKw: roundToOneDecimal(rawKw),
    monthlyGenerationKwh: Math.round(monthlyGenerationKwh),
    usefulKwh: Math.round(usefulKwh),
    estimatedCostInr: Math.round(estimatedCostInr),
    monthlySavingsInr: Math.min(
      Math.round(monthlySavingsInr),
      Math.floor(input.monthlyBillInr),
    ),
    annualSavingsInr: Math.round(annualSavingsInr),
    paybackYears:
      annualSavingsInr === 0
        ? null
        : roundToOneDecimal(estimatedCostInr / annualSavingsInr),
    monthlyCo2ReductionKg: Math.round(monthlyCo2ReductionKg),
    annualCo2ReductionKg: Math.round(annualCo2ReductionKg),
    offsetFraction: usefulKwh / monthlyConsumptionKwh,
    roofLimited: roofLimitKw < requiredKw,
  };
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
