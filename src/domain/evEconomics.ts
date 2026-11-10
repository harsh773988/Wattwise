/**
 * EV vs Petrol Economics & Solar Charging Optimizer (Pan-India).
 * Aligned with Mission LiFE (Sustainable Mobility) and FAME / State EV Policies.
 * Pure domain logic — zero framework, I/O, or env imports.
 */

import { round2 } from "./cost";
import { CEA_CARBON_INTENSITY } from "./nationalGridClock";

export type EvVehicleType = "two_wheeler" | "three_wheeler" | "four_wheeler";

export interface EvModelPreset {
  readonly id: string;
  readonly name: string;
  readonly type: EvVehicleType;
  readonly batteryCapacityKwh: number;
  readonly realWorldRangeKm: number;
  readonly equivalentPetrolMileageKmPerLitre: number;
}

export interface EvEconomicsResult {
  readonly vehicleName: string;
  readonly monthlyDistanceKm: number;
  readonly monthlyElectricityKwh: number;
  readonly monthlyEvChargingCostInr: number;
  readonly monthlyPetrolCostInr: number;
  readonly monthlySavingsInr: number;
  readonly annualSavingsInr: number;
  readonly costPerKmEvInr: number;
  readonly costPerKmPetrolInr: number;
  readonly annualCo2AvoidedKg: number;
  readonly solarChargingAnnualSavingsInr: number; // if charged during Green Solar Hours
}

export const POPULAR_INDIAN_EV_PRESETS: readonly EvModelPreset[] = [
  {
    id: "scooter_standard",
    name: "Electric 2-Wheeler (Ather / Ola / TVS iQube)",
    type: "two_wheeler",
    batteryCapacityKwh: 3.4,
    realWorldRangeKm: 95,
    equivalentPetrolMileageKmPerLitre: 45,
  },
  {
    id: "auto_rickshaw",
    name: "Electric 3-Wheeler Auto (Mahindra / Piaggio)",
    type: "three_wheeler",
    batteryCapacityKwh: 7.5,
    realWorldRangeKm: 110,
    equivalentPetrolMileageKmPerLitre: 25,
  },
  {
    id: "car_compact",
    name: "Electric 4-Wheeler Car (Tata Tiago / Nexon EV)",
    type: "four_wheeler",
    batteryCapacityKwh: 24.0,
    realWorldRangeKm: 210,
    equivalentPetrolMileageKmPerLitre: 16,
  },
];

/**
 * Calculate financial and carbon savings of electric vehicle home charging vs petrol in India.
 *
 * @param dailyDistanceKm Average daily commute in km (e.g. 30 km)
 * @param preset Selected vehicle preset
 * @param petrolPriceInr Cost of petrol per litre (default ₹103.50/L)
 * @param electricityTariffInr Cost of grid electricity per kWh (default ₹6.80/kWh)
 */
export function calculateEvEconomics(
  dailyDistanceKm: number,
  preset: EvModelPreset = POPULAR_INDIAN_EV_PRESETS[0],
  petrolPriceInr = 103.5,
  electricityTariffInr = 6.8
): EvEconomicsResult {
  if (dailyDistanceKm <= 0 || !Number.isFinite(dailyDistanceKm)) {
    throw new RangeError("Daily distance must be positive");
  }

  const monthlyDistanceKm = dailyDistanceKm * 30;

  // Energy consumed per km = battery capacity / range
  const energyKwhPerKm = preset.batteryCapacityKwh / preset.realWorldRangeKm;
  const monthlyElectricityKwh = round2(monthlyDistanceKm * energyKwhPerKm);

  // Cost per km
  const costPerKmEvInr = round2(energyKwhPerKm * electricityTariffInr);
  const costPerKmPetrolInr = round2(
    petrolPriceInr / preset.equivalentPetrolMileageKmPerLitre
  );

  const monthlyEvChargingCostInr = round2(monthlyElectricityKwh * electricityTariffInr);
  const monthlyPetrolLitres = monthlyDistanceKm / preset.equivalentPetrolMileageKmPerLitre;
  const monthlyPetrolCostInr = round2(monthlyPetrolLitres * petrolPriceInr);

  const monthlySavingsInr = round2(
    Math.max(0, monthlyPetrolCostInr - monthlyEvChargingCostInr)
  );
  const annualSavingsInr = round2(monthlySavingsInr * 12);

  // Carbon analysis:
  // Burning 1 L of petrol produces ~2.31 kg CO2.
  // EV grid emissions = monthlyElectricityKwh * 0.716 kg CO2/kWh.
  const annualPetrolCo2Kg = monthlyPetrolLitres * 12 * 2.31;
  const annualEvGridCo2Kg =
    monthlyElectricityKwh * 12 * CEA_CARBON_INTENSITY.NATIONAL_GRID_AVERAGE;
  const annualCo2AvoidedKg = round2(
    Math.max(0, annualPetrolCo2Kg - annualEvGridCo2Kg)
  );

  // If charged using on-site rooftop solar during Green Hours (zero marginal fuel cost)
  const solarChargingAnnualSavingsInr = round2(monthlyPetrolCostInr * 12);

  return {
    vehicleName: preset.name,
    monthlyDistanceKm,
    monthlyElectricityKwh,
    monthlyEvChargingCostInr,
    monthlyPetrolCostInr,
    monthlySavingsInr,
    annualSavingsInr,
    costPerKmEvInr,
    costPerKmPetrolInr,
    annualCo2AvoidedKg,
    solarChargingAnnualSavingsInr,
  };
}

