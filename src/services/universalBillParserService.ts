/**
 * Universal Indian Electricity Bill Parser & OCR Extraction Service.
 * Parses bill text, auto-detects State & DISCOM, extracts key meter metadata,
 * and generates daily consumption series for seamless dashboard ingestion.
 */

import { calculateStateBill, getStateInfo } from "../domain/nationalTariff";
import { Reading } from "../domain/types";

export interface ParsedBillData {
  readonly rawText: string;
  readonly detectedStateCode: string;
  readonly detectedStateName: string;
  readonly detectedDiscomId: string;
  readonly detectedDiscomName: string;
  readonly consumerNumber: string;
  readonly consumerName: string;
  readonly billingPeriodDays: number;
  readonly billingPeriodDaysIsEstimated: boolean;
  readonly billingPeriodStartDate: string | null;
  readonly billingPeriodEndDate: string | null;
  readonly billDate: string; // YYYY-MM-DD
  readonly totalKwh: number;
  readonly sanctionedLoadKw: number;
  readonly billAmountInr: number;
  readonly billAmountIsEstimated: boolean;
  readonly confidenceScore: number; // 0-1
  readonly generatedDailyReadings: readonly Reading[];
}

export interface SampleIndianBillPreset {
  readonly id: string;
  readonly label: string;
  readonly stateCode: string;
  readonly discomName: string;
  readonly sampleText: string;
  readonly previewKwh: number;
  readonly previewAmountInr: number;
}

/**
 * 1-Click Sample Indian Bills for quick evaluation without requiring a camera or physical bill.
 */
export const SAMPLE_INDIAN_BILLS: readonly SampleIndianBillPreset[] = [
  {
    id: "delhi_bses",
    label: "Delhi (BSES Yamuna)",
    stateCode: "DL",
    discomName: "BSES Yamuna Power Limited",
    previewKwh: 340,
    previewAmountInr: 1780,
    sampleText: `BSES YAMUNA POWER LIMITED
ELECTRICITY BILL FOR RESIDENTIAL CONSUMER (DOMESTIC)
CA Number: 1029384752 | Sub-Division: Yamuna Vihar
Consumer Name: Vikramaditya Malhotra
Bill Date: 01-11-2026 | Due Date: 15-11-2026
Billing Period: 02-10-2026 to 31-10-2026
Billing Period Days: 30
Sanctioned Load: 3.00 kW | Meter No: BR982341
Current Reading: 12450 kWh | Previous Reading: 12110 kWh
Total Units Consumed: 340 kWh (Billed Units)
Energy Charges: ₹ 1380.00
Fixed Charges: ₹ 40.00
PPAC / FPPPA Surcharge: ₹ 292.40
Delhi Electricity Duty (5%): ₹ 71.00
Current Bill Amount: ₹ 1783.40 | Total Payable: ₹ 1780.00`,
  },
  {
    id: "mumbai_msedcl",
    label: "Mumbai / Pune (MSEDCL)",
    stateCode: "MH",
    discomName: "MSEDCL (Mahavitaran)",
    previewKwh: 410,
    previewAmountInr: 5030,
    sampleText: `MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD.
MAHAVITARAN - ENERGY BILL (LT-I RESIDENTIAL)
Consumer No: 028519482710 | Billing Unit: 4120 Kothrud
Consumer Name: Ananya Deshmukh
Bill Date: 28-10-2026 | Due Date: 12-11-2026
Connected Load: 4.00 kW | Phase: 1
Units Consumed (kWh): 410 Units (Days: 30)
Energy Charges: ₹ 3980.50
Fixed / Demand Charges: ₹ 128.00
Fuel Adjustment Charge (FAC): ₹ 266.50
Electricity Duty (16%): ₹ 657.36
Total Bill Amount Payable: ₹ 5030.00`,
  },
  {
    id: "gujarat_dgvcl",
    label: "Gujarat (DGVCL / GUVNL)",
    stateCode: "GJ",
    discomName: "Dakshin Gujarat Vij Company Limited",
    previewKwh: 280,
    previewAmountInr: 2145,
    sampleText: `DAKSHIN GUJARAT VIJ COMPANY LIMITED (GUVNL)
TARIFF RGPR (RESIDENTIAL GENERAL PURPOSE)
Consumer Number: 84729104859 | Sub-Division: Surat City
Consumer Name: Hardik K. Patel
Bill Issue Date: 02-11-2026 | Due Date: 16-11-2026
Contract Demand: 3.00 kW
Meter Reading: Current 8920 | Previous 8640
Consumption: 280 Units (kWh)
Energy Charges: ₹ 1137.00
Fixed Charges: ₹ 35.00
FPPPA Charges @ ₹2.85/Unit: ₹ 798.00
Electricity Duty (15%): ₹ 175.80
Total Amount Payable: ₹ 2145.00`,
  },
  {
    id: "bengaluru_bescom",
    label: "Bengaluru (BESCOM)",
    stateCode: "KA",
    discomName: "Bangalore Electricity Supply Company Limited",
    previewKwh: 320,
    previewAmountInr: 2450,
    sampleText: `BANGALORE ELECTRICITY SUPPLY COMPANY LIMITED (BESCOM)
LT-2(a) RESIDENTIAL DOMESTIC BILL
Account ID: 8940284710 | Sub-Division: Indiranagar
Consumer Name: Arvind Swaminathan
Bill Date: 03-11-2026 | Due Date: 18-11-2026
Sanctioned Load: 3.00 kW
Total kWh Billed: 320 kWh
Energy Charges: ₹ 2015.00
Fixed Charges: ₹ 110.00
Fuel Cost Adjustment (FAC): ₹ 137.60
Tax / Duty (9%): ₹ 191.25
Net Amount Payable: ₹ 2450.00`,
  },
  {
    id: "up_uppcl",
    label: "Uttar Pradesh (UPPCL)",
    stateCode: "UP",
    discomName: "UPPCL Urban (PVVNL / MVVNL)",
    previewKwh: 360,
    previewAmountInr: 2570,
    sampleText: `UTTAR PRADESH POWER CORPORATION LIMITED
MVVNL / PVVNL DOMESTIC URBAN BILL (LMV-1)
Account Number: 6739201948 | Discom: Madhyanchal
Consumer Name: Rajesh K. Srivastava
Bill Date: 29-10-2026 | Due Date: 14-11-2026
Sanctioned Load: 2.00 kW
Units Consumed: 360 kWh
Energy Charges: ₹ 2165.00
Fixed Charges: ₹ 110.00
Regulatory Surcharge: ₹ 180.00
Electricity Duty (5%): ₹ 113.75
Net Payable Amount: ₹ 2570.00`,
  },
];

function parseIndianDate(value: string): string | null {
  const dateParts = value.split(/[/-]/);
  const parts = dateParts.map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    return null;
  }

  const [first, second, third] = parts;
  const yearFirst = dateParts[0].length === 4;
  const year = yearFirst ? first : third;
  const month = second;
  const day = yearFirst ? third : first;
  if (year < 1000 || year > 9999) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

/**
 * Detect state and DISCOM from text keywords.
 */
export function detectStateAndDiscom(text: string): {
  stateCode: string;
  discomId: string;
  discomName: string;
} {
  const upper = text.toUpperCase();

  if (upper.includes("TATA POWER MUMBAI") || upper.includes("TATA POWER (MUMBAI)")) {
    return { stateCode: "MH", discomId: "tata_mumbai", discomName: "Tata Power Mumbai" };
  }
  if (upper.includes("MAHAVITARAN") || upper.includes("MSEDCL")) {
    return { stateCode: "MH", discomId: "msedcl", discomName: "MSEDCL (Mahavitaran)" };
  }
  if (upper.includes("BSES YAMUNA") || upper.includes("BYPL")) {
    return { stateCode: "DL", discomId: "bses_yamuna", discomName: "BSES Yamuna (Delhi)" };
  }
  if (upper.includes("TPDDL") || upper.includes("TATA POWER DELHI")) {
    return { stateCode: "DL", discomId: "tpddl", discomName: "Tata Power Delhi (TPDDL)" };
  }
  if (upper.includes("BSES") || upper.includes("BRPL") || upper.includes("DELHI")) {
    return { stateCode: "DL", discomId: "bses_rajdhani", discomName: "BSES Rajdhani (Delhi)" };
  }
  if (upper.includes("TORRENT POWER")) {
    return { stateCode: "GJ", discomId: "torrent_power", discomName: "Torrent Power" };
  }
  if (upper.includes("MGVCL")) {
    return { stateCode: "GJ", discomId: "mgvcl", discomName: "MGVCL" };
  }
  if (upper.includes("PGVCL")) {
    return { stateCode: "GJ", discomId: "pgvcl", discomName: "PGVCL" };
  }
  if (upper.includes("UGVCL")) {
    return { stateCode: "GJ", discomId: "ugvcl", discomName: "UGVCL" };
  }
  if (upper.includes("GUVNL") || upper.includes("DGVCL") || upper.includes("GUJARAT")) {
    return { stateCode: "GJ", discomId: "dgvcl", discomName: "DGVCL (Gujarat)" };
  }
  if (upper.includes("BESCOM") || upper.includes("KARNATAKA")) {
    return { stateCode: "KA", discomId: "bescom", discomName: "BESCOM (Karnataka)" };
  }
  if (upper.includes("UPPCL") || upper.includes("PVVNL") || upper.includes("MVVNL") || upper.includes("UTTAR PRADESH")) {
    return { stateCode: "UP", discomId: "uppcl_urban", discomName: "UPPCL Urban (UP)" };
  }
  if (upper.includes("TANGEDCO") || upper.includes("TAMIL NADU")) {
    return { stateCode: "TN", discomId: "tangedco", discomName: "TANGEDCO (Tamil Nadu)" };
  }
  if (upper.includes("CESC") || upper.includes("WBSEDCL") || upper.includes("WEST BENGAL")) {
    return { stateCode: "WB", discomId: "cesc", discomName: "CESC (Kolkata)" };
  }

  // Fallback to Pan-India
  return { stateCode: "PAN_INDIA", discomId: "national_avg", discomName: "National Benchmark" };
}

/**
 * Generate a realistic 30-day daily reading series that sums up exactly to the monthly billed kWh,
 * with weekday/weekend variance and typical household fluctuations.
 */
export function generateDailyReadingsFromMonthlyKwh(
  totalKwh: number,
  endDateIso = new Date().toISOString().slice(0, 10),
  days = 30
): Reading[] {
  if (totalKwh <= 0 || days <= 0) return [];

  const rawWeights: number[] = [];
  let weightSum = 0;

  for (let i = 0; i < days; i++) {
    // Slight weekend spike simulation (every 7th day)
    const isWeekend = i % 7 === 5 || i % 7 === 6;
    const randomVariation = 0.85 + Math.sin(i * 1.3) * 0.2 + (isWeekend ? 0.25 : 0);
    rawWeights.push(randomVariation);
    weightSum += randomVariation;
  }

  const readings: Reading[] = [];
  const endDate = new Date(endDateIso);
  let accumulatedKwh = 0;

  for (let i = days - 1; i >= 0; i--) {
    const dayDate = new Date(endDate);
    dayDate.setDate(dayDate.getDate() - i);
    const dateStr = dayDate.toISOString().slice(0, 10);

    const proportion = rawWeights[days - 1 - i] / weightSum;
    let dayKwh = Math.round(totalKwh * proportion * 100) / 100;

    // Adjust last day for exact sum matching
    if (i === 0) {
      dayKwh = Math.max(0.5, Math.round((totalKwh - accumulatedKwh) * 100) / 100);
    } else {
      accumulatedKwh += dayKwh;
    }

    readings.push({
      date: dateStr,
      kwh: dayKwh,
    });
  }

  return readings;
}

/**
 * Parse raw electricity bill text into structured metadata.
 */
export function parseElectricityBillText(rawText: string): ParsedBillData {
  const { stateCode, discomId, discomName } = detectStateAndDiscom(rawText);
  const state = getStateInfo(stateCode);

  // Extract units consumed (kWh)
  let totalKwh: number | undefined;
  const unitsMatch =
    rawText.match(
      /(?:Units Consumed|Total Units|Consumption|Total kWh Billed|Billed Units)[^0-9\n]*([0-9,.]+)/i
    ) || rawText.match(/([0-9,.]+)\s*(?:kWh|Units)\b/i);

  if (unitsMatch && unitsMatch[1]) {
    const parsed = parseFloat(unitsMatch[1].replace(/,/g, ""));
    if (Number.isFinite(parsed) && parsed > 0 && parsed < 50000) {
      totalKwh = parsed;
    }
  }
  if (totalKwh === undefined) {
    throw new RangeError("Could not extract a valid positive kWh value from the bill");
  }

  let sanctionedLoadKw = 3.0;
  const loadMatch = rawText.match(/(?:Sanctioned Load|Connected Load|Contract Demand)[:\s]*([0-9.]+)\s*(?:kW|HP)?/i);
  if (loadMatch && loadMatch[1]) {
    const parsed = parseFloat(loadMatch[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      sanctionedLoadKw = parsed;
    }
  }

  // Extract bill amount (INR)
  let billAmountInr = 0;
  const payableAmountMatch = rawText.match(
    /(?:Total Payable(?: Amount)?|Net Payable Amount|Net Amount Payable|Total Bill Amount Payable|Total Amount Payable|Amount Payable)[:\s]*[^0-9\n]*([0-9,.]+)/i
  );
  const amountMatch =
    payableAmountMatch ??
    rawText.match(/Current Bill Amount[:\s]*[^0-9\n]*([0-9,.]+)/i) ??
    rawText.match(/(?:₹|Rs\.?)\s*([0-9,.]+)/i);

  let billAmountIsEstimated = true;
  if (amountMatch && amountMatch[1]) {
    const parsed = parseFloat(amountMatch[1].replace(/,/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      billAmountInr = parsed;
      billAmountIsEstimated = false;
    }
  }

  // If amount was not directly in text, calculate from state tariff
  if (billAmountInr === 0) {
    const calculated = calculateStateBill(
      totalKwh,
      stateCode,
      discomId,
      sanctionedLoadKw
    );
    billAmountInr = calculated.totalBillInr;
  }

  // Extract consumer number
  let consumerNumber = "Not detected";
  const consMatch = rawText.match(
    /(?:Consumer No|Consumer Number|CA Number|Account ID|Account Number)[:\s]*([A-Z0-9-]+)/i
  );
  if (consMatch && consMatch[1]) {
    consumerNumber = consMatch[1].trim();
  }

  // Extract consumer name
  let consumerName = "Valued Citizen";
  const nameMatch = rawText.match(/(?:Consumer Name|Name)[:\s]*([A-Za-z\s.]+)/i);
  if (nameMatch && nameMatch[1]) {
    consumerName = nameMatch[1].trim().split("\n")[0];
  }

  const billDateMatch = rawText.match(
    /(?:Bill Date|Bill Issue Date|Issue Date|Billing Date)[:\s]+(\d{1,4}[/-]\d{1,2}[/-]\d{1,4})/i
  );
  const billDate = billDateMatch?.[1]
    ? parseIndianDate(billDateMatch[1]) ?? new Date().toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const billingPeriodMatch = rawText.match(
    /(?:Billing Period|Bill Period)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})\s+(?:to|through|–|—)\s+(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i
  );
  const billingPeriodStartDate = billingPeriodMatch?.[1]
    ? parseIndianDate(billingPeriodMatch[1])
    : null;
  const billingPeriodEndDate = billingPeriodMatch?.[2]
    ? parseIndianDate(billingPeriodMatch[2])
    : null;
  const billingDaysMatch =
    rawText.match(/(?:Billing Period Days|Billing Days|Days Billed|Billed Days)[:\s]+(\d{1,3})/i) ??
    rawText.match(/\(\s*Days\s*:\s*(\d{1,3})\s*\)/i);
  const explicitBillingDays = billingDaysMatch?.[1]
    ? Number.parseInt(billingDaysMatch[1], 10)
    : undefined;
  const rangeBillingDays =
    billingPeriodStartDate && billingPeriodEndDate
      ? Math.floor(
          (Date.parse(`${billingPeriodEndDate}T00:00:00Z`) -
            Date.parse(`${billingPeriodStartDate}T00:00:00Z`)) /
            86400000
        ) + 1
      : undefined;
  const billingPeriodDays =
    explicitBillingDays && explicitBillingDays > 0 && explicitBillingDays <= 366
      ? explicitBillingDays
      : rangeBillingDays && rangeBillingDays > 0 && rangeBillingDays <= 366
        ? rangeBillingDays
        : 30;
  const billingPeriodDaysIsEstimated =
    !(explicitBillingDays && explicitBillingDays > 0 && explicitBillingDays <= 366) &&
    !(rangeBillingDays && rangeBillingDays > 0 && rangeBillingDays <= 366);

  const dailyReadings = generateDailyReadingsFromMonthlyKwh(
    totalKwh,
    billingPeriodEndDate ?? billDate,
    billingPeriodDays
  );

  return {
    rawText,
    detectedStateCode: state.code,
    detectedStateName: state.name,
    detectedDiscomId: discomId,
    detectedDiscomName: discomName,
    consumerNumber,
    consumerName,
    billingPeriodDays,
    billingPeriodDaysIsEstimated,
    billingPeriodStartDate,
    billingPeriodEndDate,
    billDate,
    totalKwh,
    sanctionedLoadKw,
    billAmountInr,
    billAmountIsEstimated,
    confidenceScore: 0.95,
    generatedDailyReadings: dailyReadings,
  };
}
