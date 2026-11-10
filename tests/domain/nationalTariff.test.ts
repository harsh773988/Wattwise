import { describe, expect, it } from "vitest";
import {
  calculateStateBill,
  getStateInfo,
  getStateTariffSummary,
  listSupportedStates,
} from "../../src/domain/nationalTariff";

describe("nationalTariff domain module", () => {
  it("lists all supported states including major regions and national benchmark", () => {
    const states = listSupportedStates();
    expect(states.length).toBeGreaterThanOrEqual(10);
    const codes = states.map((s) => s.code);
    expect(codes).toContain("MH");
    expect(codes).toContain("DL");
    expect(codes).toContain("GJ");
    expect(codes).toContain("KA");
    expect(codes).toContain("UP");
    expect(codes).toContain("PAN_INDIA");
  });

  it("retrieves state info accurately or falls back to PAN_INDIA", () => {
    const dl = getStateInfo("DL");
    expect(dl.name).toBe("Delhi");
    expect(dl.defaultDiscomId).toBe("bses_rajdhani");

    const fallback = getStateInfo("UNKNOWN_XYZ");
    expect(fallback.code).toBe("PAN_INDIA");
  });

  it("summarizes all DISCOM tariffs for a state", () => {
    const summary = getStateTariffSummary("MH");
    expect(summary.stateCode).toBe("MH");
    expect(summary.defaultDiscomId).toBe("msedcl");
    expect(summary.discoms.map((discom) => discom.id)).toEqual(
      expect.arrayContaining(["msedcl", "best", "adani_mumbai"])
    );
    expect(
      getStateTariffSummary("DL").discoms.map((discom) => discom.id)
    ).toContain("bses_yamuna");
  });

  it("calculates telescopic slabs accurately for Delhi BSES", () => {
    // 0-200 @ 3.0, 201-400 @ 4.5. If 250 units: 200*3.0 (600) + 50*4.5 (225) = 825
    // Fixed: 40, FPPPA: 250 * 0.86 = 215. Duty: 5% of (825 + 40) = 43.25
    // Total = 825 + 40 + 215 + 43.25 = 1123.25
    const bill = calculateStateBill(250, "DL", "bses_rajdhani");
    expect(bill.stateCode).toBe("DL");
    expect(bill.energyCharges).toBe(825);
    expect(bill.fixedCharges).toBe(40);
    expect(bill.fpppaCharges).toBe(215);
    expect(bill.totalBillInr).toBe(1123.25);
    expect(bill.slabBreakdown.length).toBe(2);
  });

  it("uses the Delhi upper slab rate above 800 kWh", () => {
    const bill = calculateStateBill(900, "DL");
    expect(bill.energyCharges).toBe(4800);
    expect(bill.slabBreakdown.at(-1)?.ratePerKwh).toBe(7);
  });

  it("calculates telescopic slabs for Gujarat DGVCL", () => {
    // 0-50 @ 3.05 (152.5), 51-100 @ 3.5 (175). If 100 units: energy = 327.5
    // Fixed: 35, FPPPA: 100 * 2.85 = 285. Duty: 15% of (327.5 + 35) = 54.38
    const bill = calculateStateBill(100, "GJ", "dgvcl");
    expect(bill.stateCode).toBe("GJ");
    expect(bill.energyCharges).toBe(327.5);
    expect(bill.fpppaCharges).toBe(285);
    expect(bill.fixedCharges).toBe(35);
    expect(bill.totalBillInr).toBe(701.88);
  });

  it("provides all GUVNL DISCOMs and the common Gujarat tariff structure", () => {
    const summary = getStateTariffSummary("GJ");
    const guvnlDiscoms = ["dgvcl", "mgvcl", "pgvcl", "ugvcl"];
    expect(summary.discoms.map((discom) => discom.id)).toEqual(
      expect.arrayContaining([...guvnlDiscoms, "torrent_power"])
    );
    for (const id of guvnlDiscoms) {
      expect(calculateStateBill(280, "GJ", id).energyCharges).toBe(1106);
    }
  });

  it("calculates Karnataka fixed charges from sanctioned kW", () => {
    const oneKwBill = calculateStateBill(250, "KA", "bescom", 1);
    const threeKwBill = calculateStateBill(250, "KA", "bescom", 3);
    expect(threeKwBill.fixedCharges).toBe(330);
    expect(threeKwBill.fixedCharges - oneKwBill.fixedCharges).toBe(220);
  });

  it("applies Tamil Nadu bi-monthly fixed charges", () => {
    const bill = calculateStateBill(150, "TN");
    expect(getStateTariffSummary("TN").discoms[0].billingCycleDays).toBe(60);
    expect(bill.energyCharges).toBe(112.5);
    expect(bill.fixedCharges).toBe(100);
  });

  it("uses the national average as a flat ₹6.80/kWh fallback", () => {
    const bill = calculateStateBill(250, "PAN_INDIA");
    expect(bill.energyCharges).toBe(1700);
    expect(bill.totalBillInr).toBe(1700);
    expect(calculateStateBill(100, "UNKNOWN").stateCode).toBe("PAN_INDIA");
  });

  it("handles 0 kWh gracefully", () => {
    const bill = calculateStateBill(0, "MH");
    expect(bill.energyCharges).toBe(0);
    expect(bill.totalKwh).toBe(0);
    expect(bill.fixedCharges).toBeGreaterThan(0);
    expect(bill.effectiveRatePerKwh).toBe(0);
  });

  it("throws RangeError for negative or invalid kWh", () => {
    expect(() => calculateStateBill(-10, "KA")).toThrow(RangeError);
    expect(() => calculateStateBill(NaN, "KA")).toThrow(RangeError);
    expect(() => calculateStateBill(10, "KA", undefined, -1)).toThrow(RangeError);
    expect(() => calculateStateBill(10, "KA", "not-a-discom")).toThrow(RangeError);
  });
});
