/**
 * Smart Meter Telemetry & 24-Hour Load Curve Engine.
 * Aligned with India's Revamped Distribution Sector Scheme (RDSS) and AMI smart meter rollouts.
 * Pure domain logic — zero framework, I/O, or env imports.
 */

import { round2 } from "./cost";
import { CEA_CARBON_INTENSITY } from "./nationalGridClock";

export interface HourlyTelemetryPoint {
  readonly hour: number; // 0-23
  readonly timeLabel: string; // "00:00", "01:00", ...
  readonly demandKw: number; // power demand in kW
  readonly energyKwh: number; // energy consumed in this hour (kWh)
  readonly gridStatus: "green_solar" | "evening_peak" | "morning_surge" | "night_offpeak";
  readonly carbonIntensityKg: number;
  readonly estimatedCostInr: number;
  readonly isVampireBaseLoad: boolean;
}

export interface TelemetryAnalysis {
  readonly points: readonly HourlyTelemetryPoint[];
  readonly totalKwh: number;
  readonly peakDemandKw: number;
  readonly peakDemandHour: number;
  readonly baseLoadKw: number; // continuous 24/7 vampire load
  readonly dailyVampireKwh: number; // baseLoadKw * 24
  readonly peakHoursKwh: number; // consumption between 18:00 and 22:00
  readonly solarHoursKwh: number; // consumption between 10:00 and 16:00
  readonly totalEstimatedCostInr: number;
  readonly totalCarbonKg: number;
  readonly potentialSavingsInrByKillingVampire: number;
}

/**
 * Synthesize or analyze a 24-hour smart meter load profile for an Indian household.
 *
 * @param dailyKwh - Total daily energy consumed (e.g. 10.5 kWh)
 * @param tariffPerKwh - Average tariff in INR/kWh
 * @param hasSolar - Whether rooftop solar is installed (reduces net grid draw during daytime)
 */
export function analyze24HourTelemetry(
  dailyKwh: number,
  tariffPerKwh = 6.8,
  hasSolar = false
): TelemetryAnalysis {
  if (dailyKwh <= 0 || !Number.isFinite(dailyKwh)) {
    throw new RangeError("Daily kWh must be positive");
  }

  // Typical Indian urban household load curve distribution (normalized weights summing to 1.0)
  // Night low (00:00-05:00) -> Morning surge (06:00-09:00) -> Midday moderate (10:00-16:00) -> Evening peak (18:00-22:00)
  const hourlyWeights = [
    0.022, 0.02, 0.018, 0.018, 0.02, 0.028, // 00:00 - 05:00
    0.045, 0.065, 0.06, 0.042, // 06:00 - 09:00 (Morning surge)
    0.038, 0.035, 0.032, 0.034, 0.036, 0.04, // 10:00 - 15:00 (Solar hours)
    0.045, 0.058, // 16:00 - 17:00
    0.075, 0.092, 0.095, 0.078, // 18:00 - 21:00 (Evening peak)
    0.045, 0.028, // 22:00 - 23:00
  ];

  const totalWeight = hourlyWeights.reduce((a, b) => a + b, 0);

  // Estimate 24/7 baseline vampire load (standby TVs, set-top boxes, chargers, router)
  // Typically 8-12% of total daily load
  const baseLoadKw = round2((dailyKwh * 0.1) / 24);

  let totalCalculatedKwh = 0;
  let totalCost = 0;
  let totalCarbon = 0;
  let peakDemand = 0;
  let peakHour = 0;
  let peakHoursKwh = 0;
  let solarHoursKwh = 0;

  const points: HourlyTelemetryPoint[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const proportion = hourlyWeights[hour] / totalWeight;
    let hourKwh = dailyKwh * proportion;

    // If rooftop solar is active, grid draw drops substantially during 11:00 - 16:00
    if (hasSolar && hour >= 10 && hour <= 15) {
      hourKwh = Math.max(baseLoadKw, hourKwh * 0.35); // Solar self-consumption reduces grid draw
    }

    hourKwh = round2(hourKwh);
    const demandKw = round2(hourKwh); // 1 hour -> kW == kWh

    if (demandKw > peakDemand) {
      peakDemand = demandKw;
      peakHour = hour;
    }

    let gridStatus: HourlyTelemetryPoint["gridStatus"] = "night_offpeak";
    let carbonRate: number = CEA_CARBON_INTENSITY.NIGHT_OFF_PEAK;
    let rateMultiplier = 1.0;

    if (hour >= 10 && hour < 16) {
      gridStatus = "green_solar";
      carbonRate = CEA_CARBON_INTENSITY.SOLAR_WINDOW_CLEAN;
      rateMultiplier = 0.9; // Solar window incentive
      solarHoursKwh += hourKwh;
    } else if (hour >= 18 && hour < 22) {
      gridStatus = "evening_peak";
      carbonRate = CEA_CARBON_INTENSITY.EVENING_PEAK_THERMAL;
      rateMultiplier = 1.25; // Peak Time-of-Day surge surcharge
      peakHoursKwh += hourKwh;
    } else if (hour >= 6 && hour < 10) {
      gridStatus = "morning_surge";
      carbonRate = CEA_CARBON_INTENSITY.NATIONAL_GRID_AVERAGE;
    }

    const costInr = round2(hourKwh * tariffPerKwh * rateMultiplier);
    const carbonKg = round2(hourKwh * carbonRate);

    totalCalculatedKwh += hourKwh;
    totalCost += costInr;
    totalCarbon += carbonKg;

    const timeLabel = `${hour.toString().padStart(2, "0")}:00`;

    points.push({
      hour,
      timeLabel,
      demandKw,
      energyKwh: hourKwh,
      gridStatus,
      carbonIntensityKg: carbonRate,
      estimatedCostInr: costInr,
      isVampireBaseLoad: demandKw <= baseLoadKw * 1.2,
    });
  }

  const dailyVampireKwh = round2(baseLoadKw * 24);
  const potentialSavingsInrByKillingVampire = round2(
    dailyVampireKwh * 0.6 * tariffPerKwh * 30
  );

  return {
    points,
    totalKwh: round2(totalCalculatedKwh),
    peakDemandKw: round2(peakDemand),
    peakDemandHour: peakHour,
    baseLoadKw,
    dailyVampireKwh,
    peakHoursKwh: round2(peakHoursKwh),
    solarHoursKwh: round2(solarHoursKwh),
    totalEstimatedCostInr: round2(totalCost),
    totalCarbonKg: round2(totalCarbon),
    potentialSavingsInrByKillingVampire,
  };
}
