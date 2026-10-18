/**
 * Cost and CO₂ conversion functions.
 * Pure domain logic — no framework, I/O, or env imports.
 */

/** Convert kWh to cost in Indian Rupees. */
export function kwhToRupees(kwh: number, tariffPerKwh: number): number {
  if (kwh < 0) throw new RangeError("kWh must be non-negative");
  if (tariffPerKwh < 0) throw new RangeError("Tariff must be non-negative");
  return round2(kwh * tariffPerKwh);
}

/** Convert kWh to CO₂ emissions in kilograms. */
export function kwhToCo2(kwh: number, emissionFactor: number): number {
  if (kwh < 0) throw new RangeError("kWh must be non-negative");
  if (emissionFactor < 0)
    throw new RangeError("Emission factor must be non-negative");
  return round2(kwh * emissionFactor);
}

/** Convert rupees to kWh (inverse). */
export function rupeesToKwh(rupees: number, tariffPerKwh: number): number {
  if (tariffPerKwh <= 0) throw new RangeError("Tariff must be positive");
  return round2(rupees / tariffPerKwh);
}

/** Format a rupee amount for display. */
export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format CO₂ kg for display. */
export function formatCo2(kg: number): string {
  if (kg >= 1000) {
    return `${round2(kg / 1000)} tonnes CO₂`;
  }
  return `${round2(kg)} kg CO₂`;
}

/** Round a number to 2 decimal places. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
