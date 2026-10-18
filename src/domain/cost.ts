/**
 * Cost and CO₂ conversion functions.
 * Pure domain logic — no framework, I/O, or env imports.
 */

/** Round a number to 2 decimal places mitigating floating point inaccuracies. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Convert kWh to cost in Indian Rupees.
 * @param kwh - Electricity in kilowatt-hours (must be >= 0)
 * @param tariffPerKwh - Cost in ₹ per kWh (must be >= 0)
 */
export function kwhToRupees(kwh: number, tariffPerKwh: number): number {
  if (kwh < 0) {
    throw new RangeError("kWh must be non-negative");
  }
  if (tariffPerKwh < 0) {
    throw new RangeError("Tariff must be non-negative");
  }
  return round2(kwh * tariffPerKwh);
}

/**
 * Convert kWh to CO₂ emissions in kilograms.
 * @param kwh - Electricity in kilowatt-hours (must be >= 0)
 * @param emissionFactor - Emission intensity in kg CO₂/kWh (must be >= 0)
 */
export function kwhToCo2(kwh: number, emissionFactor: number): number {
  if (kwh < 0) {
    throw new RangeError("kWh must be non-negative");
  }
  if (emissionFactor < 0) {
    throw new RangeError("Emission factor must be non-negative");
  }
  return round2(kwh * emissionFactor);
}

/**
 * Convert rupees to equivalent kWh.
 * @param rupees - Amount in INR (must be >= 0)
 * @param tariffPerKwh - Cost in ₹ per kWh (must be > 0)
 */
export function rupeesToKwh(rupees: number, tariffPerKwh: number): number {
  if (rupees < 0) {
    throw new RangeError("Rupees amount must be non-negative");
  }
  if (tariffPerKwh <= 0) {
    throw new RangeError("Tariff must be positive");
  }
  return round2(rupees / tariffPerKwh);
}

/** Format a rupee amount for display with Indian comma groupings. */
export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format CO₂ kg for display in kg or metric tonnes. */
export function formatCo2(kg: number): string {
  if (kg >= 1000) {
    return `${round2(kg / 1000)} tonnes CO₂`;
  }
  return `${round2(kg)} kg CO₂`;
}
