/**
 * Multi-State DISCOM Tariff Engine for WattWise (Pan-India).
 * Pure domain logic — zero framework, I/O, or env imports.
 */

import { round2 } from "./cost";

export interface TariffSlab {
  readonly upToKwh: number; // upper bound of slab (Infinity for top slab)
  readonly ratePerKwh: number; // ₹ per kWh
}

export interface DiscomInfo {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly slabs: readonly TariffSlab[];
  readonly fixedMonthlyCharge: number; // ₹ per month
  readonly fixedChargePerKw?: number;
  readonly billingCycleDays?: number;
  readonly fpppaPerKwh: number; // Fuel and Power Purchase Price Adjustment (₹/kWh)
  readonly dutyPercent: number; // Electricity duty (% on energy + fixed charges)
}

export interface StateInfo {
  readonly code: string; // ISO 3166-2:IN code (e.g. "MH", "DL", "KA", "GJ", "UP", "TN", "WB", "RJ", "TS", "KL")
  readonly name: string;
  readonly region: "North" | "South" | "West" | "East" | "Central" | "North-East";
  readonly discoms: readonly DiscomInfo[];
  readonly defaultDiscomId: string;
}

export interface StateBillBreakdown {
  readonly stateCode: string;
  readonly stateName: string;
  readonly discomName: string;
  readonly totalKwh: number;
  readonly energyCharges: number; // slab-based cost
  readonly fixedCharges: number;
  readonly fpppaCharges: number;
  readonly electricityDuty: number;
  readonly totalBillInr: number;
  readonly effectiveRatePerKwh: number;
  readonly slabBreakdown: readonly {
    readonly slabLabel: string;
    readonly kwhInSlab: number;
    readonly ratePerKwh: number;
    readonly slabCost: number;
  }[];
}

export interface TariffSummary {
  readonly stateCode: string;
  readonly stateName: string;
  readonly region: StateInfo["region"];
  readonly defaultDiscomId: string;
  readonly discoms: readonly DiscomInfo[];
}

/**
 * State & DISCOM registry with realistic slab structures for major Indian states.
 */
export const STATE_DISCOM_REGISTRY: readonly StateInfo[] = [
  {
    code: "MH",
    name: "Maharashtra",
    region: "West",
    defaultDiscomId: "msedcl",
    discoms: [
      {
        id: "msedcl",
        name: "Maharashtra State Electricity Distribution Co. Ltd",
        shortName: "MSEDCL (Mahavitaran)",
        fixedMonthlyCharge: 128,
        fpppaPerKwh: 0.65,
        dutyPercent: 16,
        slabs: [
          { upToKwh: 100, ratePerKwh: 4.71 },
          { upToKwh: 300, ratePerKwh: 10.29 },
          { upToKwh: 500, ratePerKwh: 14.55 },
          { upToKwh: Infinity, ratePerKwh: 16.64 },
        ],
      },
      {
        id: "best",
        name: "Brihanmumbai Electric Supply and Transport Undertaking",
        shortName: "BEST",
        fixedMonthlyCharge: 128,
        fpppaPerKwh: 0.65,
        dutyPercent: 16,
        slabs: [
          { upToKwh: 100, ratePerKwh: 4.71 },
          { upToKwh: 300, ratePerKwh: 10.29 },
          { upToKwh: 500, ratePerKwh: 14.55 },
          { upToKwh: Infinity, ratePerKwh: 16.64 },
        ],
      },
      {
        id: "adani_mumbai",
        name: "Adani Electricity Mumbai Limited",
        shortName: "Adani Electricity",
        fixedMonthlyCharge: 128,
        fpppaPerKwh: 0.65,
        dutyPercent: 16,
        slabs: [
          { upToKwh: 100, ratePerKwh: 4.71 },
          { upToKwh: 300, ratePerKwh: 10.29 },
          { upToKwh: 500, ratePerKwh: 14.55 },
          { upToKwh: Infinity, ratePerKwh: 16.64 },
        ],
      },
      {
        id: "tata_mumbai",
        name: "Tata Power Mumbai",
        shortName: "Tata Power",
        fixedMonthlyCharge: 120,
        fpppaPerKwh: 0.55,
        dutyPercent: 16,
        slabs: [
          { upToKwh: 100, ratePerKwh: 4.45 },
          { upToKwh: 300, ratePerKwh: 8.92 },
          { upToKwh: 500, ratePerKwh: 13.2 },
          { upToKwh: Infinity, ratePerKwh: 15.4 },
        ],
      },
    ],
  },
  {
    code: "DL",
    name: "Delhi",
    region: "North",
    defaultDiscomId: "bses_rajdhani",
    discoms: [
      {
        id: "bses_rajdhani",
        name: "BSES Rajdhani Power Limited",
        shortName: "BRPL",
        fixedMonthlyCharge: 40,
        fpppaPerKwh: 0.86,
        dutyPercent: 5,
        slabs: [
          { upToKwh: 200, ratePerKwh: 3.0 },
          { upToKwh: 400, ratePerKwh: 4.5 },
          { upToKwh: 800, ratePerKwh: 6.5 },
          { upToKwh: Infinity, ratePerKwh: 7.0 },
        ],
      },
      {
        id: "bses_yamuna",
        name: "BSES Yamuna Power Limited",
        shortName: "BYPL",
        fixedMonthlyCharge: 40,
        fpppaPerKwh: 0.86,
        dutyPercent: 5,
        slabs: [
          { upToKwh: 200, ratePerKwh: 3.0 },
          { upToKwh: 400, ratePerKwh: 4.5 },
          { upToKwh: 800, ratePerKwh: 6.5 },
          { upToKwh: Infinity, ratePerKwh: 7.0 },
        ],
      },
      {
        id: "tpddl",
        name: "Tata Power Delhi Distribution Limited",
        shortName: "TPDDL",
        fixedMonthlyCharge: 40,
        fpppaPerKwh: 0.82,
        dutyPercent: 5,
        slabs: [
          { upToKwh: 200, ratePerKwh: 3.0 },
          { upToKwh: 400, ratePerKwh: 4.5 },
          { upToKwh: 800, ratePerKwh: 6.5 },
          { upToKwh: Infinity, ratePerKwh: 7.0 },
        ],
      },
    ],
  },
  {
    code: "GJ",
    name: "Gujarat",
    region: "West",
    defaultDiscomId: "dgvcl",
    discoms: [
      {
        id: "dgvcl",
        name: "Dakshin Gujarat Vij Company Limited",
        shortName: "DGVCL (GUVNL)",
        fixedMonthlyCharge: 35,
        fpppaPerKwh: 2.85,
        dutyPercent: 15,
        slabs: [
          { upToKwh: 50, ratePerKwh: 3.05 },
          { upToKwh: 100, ratePerKwh: 3.5 },
          { upToKwh: 250, ratePerKwh: 4.15 },
          { upToKwh: Infinity, ratePerKwh: 5.2 },
        ],
      },
      ...[
        ["mgvcl", "Madhya Gujarat Vij Company Limited", "MGVCL"],
        ["pgvcl", "Paschim Gujarat Vij Company Limited", "PGVCL"],
        ["ugvcl", "Uttar Gujarat Vij Company Limited", "UGVCL"],
      ].map(([id, name, shortName]) => ({
        id,
        name,
        shortName,
        fixedMonthlyCharge: 35,
        fpppaPerKwh: 2.85,
        dutyPercent: 15,
        slabs: [
          { upToKwh: 50, ratePerKwh: 3.05 },
          { upToKwh: 100, ratePerKwh: 3.5 },
          { upToKwh: 250, ratePerKwh: 4.15 },
          { upToKwh: Infinity, ratePerKwh: 5.2 },
        ],
      })),
      {
        id: "torrent_power",
        name: "Torrent Power (Ahmedabad/Surat)",
        shortName: "Torrent Power",
        fixedMonthlyCharge: 40,
        fpppaPerKwh: 2.85,
        dutyPercent: 15,
        slabs: [
          { upToKwh: 50, ratePerKwh: 3.05 },
          { upToKwh: 100, ratePerKwh: 3.5 },
          { upToKwh: 250, ratePerKwh: 4.15 },
          { upToKwh: Infinity, ratePerKwh: 5.2 },
        ],
      },
    ],
  },
  {
    code: "KA",
    name: "Karnataka",
    region: "South",
    defaultDiscomId: "bescom",
    discoms: [
      {
        id: "bescom",
        name: "Bangalore Electricity Supply Company Limited",
        shortName: "BESCOM",
        fixedMonthlyCharge: 0,
        fixedChargePerKw: 110,
        fpppaPerKwh: 0.43,
        dutyPercent: 9,
        slabs: [
          { upToKwh: 100, ratePerKwh: 4.75 },
          { upToKwh: Infinity, ratePerKwh: 7.0 },
        ],
      },
    ],
  },
  {
    code: "UP",
    name: "Uttar Pradesh",
    region: "North",
    defaultDiscomId: "uppcl_urban",
    discoms: [
      {
        id: "uppcl_urban",
        name: "Uttar Pradesh Power Corporation Limited (Urban)",
        shortName: "UPPCL Urban",
        fixedMonthlyCharge: 110,
        fpppaPerKwh: 0.5,
        dutyPercent: 5,
        slabs: [
          { upToKwh: 150, ratePerKwh: 5.5 },
          { upToKwh: 300, ratePerKwh: 6.0 },
          { upToKwh: Infinity, ratePerKwh: 6.5 },
        ],
      },
    ],
  },
  {
    code: "TN",
    name: "Tamil Nadu",
    region: "South",
    defaultDiscomId: "tangedco",
    discoms: [
      {
        id: "tangedco",
        name: "Tamil Nadu Generation and Distribution Corporation",
        shortName: "TANGEDCO",
        fixedMonthlyCharge: 50,
        billingCycleDays: 60,
        fpppaPerKwh: 0.35,
        dutyPercent: 5,
        slabs: [
          { upToKwh: 100, ratePerKwh: 0.0 }, // First 100 units free in Tamil Nadu
          { upToKwh: 200, ratePerKwh: 2.25 },
          { upToKwh: 400, ratePerKwh: 4.5 },
          { upToKwh: 500, ratePerKwh: 6.0 },
          { upToKwh: Infinity, ratePerKwh: 8.0 },
        ],
      },
    ],
  },
  {
    code: "WB",
    name: "West Bengal",
    region: "East",
    defaultDiscomId: "cesc",
    discoms: [
      {
        id: "cesc",
        name: "Calcutta Electric Supply Corporation",
        shortName: "CESC Kolkata",
        fixedMonthlyCharge: 60,
        fpppaPerKwh: 0.45,
        dutyPercent: 5,
        slabs: [
          { upToKwh: 25, ratePerKwh: 4.89 },
          { upToKwh: 60, ratePerKwh: 5.4 },
          { upToKwh: 100, ratePerKwh: 6.41 },
          { upToKwh: 150, ratePerKwh: 7.16 },
          { upToKwh: 300, ratePerKwh: 7.33 },
          { upToKwh: Infinity, ratePerKwh: 8.92 },
        ],
      },
    ],
  },
  {
    code: "RJ",
    name: "Rajasthan",
    region: "North",
    defaultDiscomId: "jvvnl",
    discoms: [
      {
        id: "jvvnl",
        name: "Jaipur Vidyut Vitran Nigam Limited",
        shortName: "JVVNL",
        fixedMonthlyCharge: 125,
        fpppaPerKwh: 0.52,
        dutyPercent: 9.5,
        slabs: [
          { upToKwh: 50, ratePerKwh: 4.75 },
          { upToKwh: 150, ratePerKwh: 6.5 },
          { upToKwh: 300, ratePerKwh: 7.35 },
          { upToKwh: 500, ratePerKwh: 7.65 },
          { upToKwh: Infinity, ratePerKwh: 7.95 },
        ],
      },
    ],
  },
  {
    code: "TS",
    name: "Telangana",
    region: "South",
    defaultDiscomId: "tsspdcl",
    discoms: [
      {
        id: "tsspdcl",
        name: "Telangana State Southern Power Distribution Co.",
        shortName: "TSSPDCL",
        fixedMonthlyCharge: 70,
        fpppaPerKwh: 0.3,
        dutyPercent: 6,
        slabs: [
          { upToKwh: 100, ratePerKwh: 3.3 },
          { upToKwh: 200, ratePerKwh: 4.3 },
          { upToKwh: 300, ratePerKwh: 7.2 },
          { upToKwh: 400, ratePerKwh: 8.5 },
          { upToKwh: Infinity, ratePerKwh: 9.5 },
        ],
      },
    ],
  },
  {
    code: "KL",
    name: "Kerala",
    region: "South",
    defaultDiscomId: "kseb",
    discoms: [
      {
        id: "kseb",
        name: "Kerala State Electricity Board",
        shortName: "KSEB",
        fixedMonthlyCharge: 80,
        fpppaPerKwh: 0.19,
        dutyPercent: 10,
        slabs: [
          { upToKwh: 50, ratePerKwh: 3.15 },
          { upToKwh: 100, ratePerKwh: 3.7 },
          { upToKwh: 150, ratePerKwh: 4.8 },
          { upToKwh: 200, ratePerKwh: 6.4 },
          { upToKwh: 250, ratePerKwh: 7.6 },
          { upToKwh: Infinity, ratePerKwh: 8.5 },
        ],
      },
    ],
  },
  {
    code: "PAN_INDIA",
    name: "Pan-India National Average",
    region: "Central",
    defaultDiscomId: "national_avg",
    discoms: [
      {
        id: "national_avg",
        name: "National Average Benchmark",
        shortName: "National Benchmark",
        fixedMonthlyCharge: 0,
        fpppaPerKwh: 0,
        dutyPercent: 0,
        slabs: [
          { upToKwh: Infinity, ratePerKwh: 6.8 },
        ],
      },
    ],
  },
];

/**
 * List all supported states and territories.
 */
export function listSupportedStates(): readonly StateInfo[] {
  return STATE_DISCOM_REGISTRY;
}

export function getStateTariffSummary(stateCode: string): TariffSummary {
  const state = getStateInfo(stateCode);
  return {
    stateCode: state.code,
    stateName: state.name,
    region: state.region,
    defaultDiscomId: state.defaultDiscomId,
    discoms: state.discoms,
  };
}

/**
 * Retrieve a specific state by ISO code or fallback to PAN_INDIA.
 */
export function getStateInfo(stateCode: string): StateInfo {
  const match = STATE_DISCOM_REGISTRY.find(
    (s) => s.code.toUpperCase() === stateCode.toUpperCase()
  );
  if (match) return match;
  return STATE_DISCOM_REGISTRY.find((s) => s.code === "PAN_INDIA")!;
}

/**
 * Calculate electricity bill using authentic telescopic slab logic for any Indian state & DISCOM.
 *
 * @param totalKwh Total energy consumed (must be >= 0)
 * @param stateCode State identifier (e.g. "MH", "DL", "GJ", "KA", "UP", "TN", "PAN_INDIA")
 * @param discomId Optional specific DISCOM ID within that state
 */
export function calculateStateBill(
  totalKwh: number,
  stateCode = "PAN_INDIA",
  discomId?: string,
  sanctionedLoadKw = 1
): StateBillBreakdown {
  if (totalKwh < 0 || !Number.isFinite(totalKwh)) {
    throw new RangeError("Total kWh must be non-negative");
  }
  if (sanctionedLoadKw < 0 || !Number.isFinite(sanctionedLoadKw)) {
    throw new RangeError("Sanctioned load must be a non-negative number");
  }

  const state = getStateInfo(stateCode);
  const requestedDiscom = discomId
    ? state.discoms.find((d) => d.id === discomId)
    : undefined;
  if (discomId && !requestedDiscom) {
    throw new RangeError(`DISCOM "${discomId}" is not supported in ${state.code}`);
  }
  const discom =
    requestedDiscom ||
    state.discoms.find((d) => d.id === state.defaultDiscomId);
  if (!discom) {
    throw new Error(`No default DISCOM is configured for ${state.code}`);
  }

  let remainingKwh = totalKwh;
  let previousLimit = 0;
  let energyCharges = 0;

  const slabBreakdown: {
    slabLabel: string;
    kwhInSlab: number;
    ratePerKwh: number;
    slabCost: number;
  }[] = [];

  for (let i = 0; i < discom.slabs.length; i++) {
    const slab = discom.slabs[i];
    const slabCapacity = slab.upToKwh - previousLimit;

    if (remainingKwh <= 0) {
      break;
    }

    const kwhInThisSlab = Math.min(remainingKwh, slabCapacity);
    const slabCost = round2(kwhInThisSlab * slab.ratePerKwh);
    energyCharges += slabCost;

    const label =
      slab.upToKwh === Infinity
        ? `> ${previousLimit} kWh`
        : `${previousLimit + 1}–${slab.upToKwh} kWh`;

    slabBreakdown.push({
      slabLabel: label,
      kwhInSlab: round2(kwhInThisSlab),
      ratePerKwh: slab.ratePerKwh,
      slabCost,
    });

    remainingKwh -= kwhInThisSlab;
    previousLimit = slab.upToKwh;
  }

  energyCharges = round2(energyCharges);
  const cycleMultiplier = (discom.billingCycleDays ?? 30) / 30;
  const fixedCharges = round2(
    (discom.fixedMonthlyCharge + (discom.fixedChargePerKw ?? 0) * sanctionedLoadKw) *
      cycleMultiplier
  );
  const fpppaCharges = round2(totalKwh * discom.fpppaPerKwh);
  const taxableBase = energyCharges + fixedCharges;
  const electricityDuty = round2(taxableBase * (discom.dutyPercent / 100));
  const totalBillInr = round2(
    energyCharges + fixedCharges + fpppaCharges + electricityDuty
  );
  const effectiveRatePerKwh =
    totalKwh > 0 ? round2(totalBillInr / totalKwh) : 0;

  return {
    stateCode: state.code,
    stateName: state.name,
    discomName: discom.shortName,
    totalKwh: round2(totalKwh),
    energyCharges,
    fixedCharges,
    fpppaCharges,
    electricityDuty,
    totalBillInr,
    effectiveRatePerKwh,
    slabBreakdown,
  };
}
