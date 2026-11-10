import { describe, expect, it } from "vitest";
import {
  detectStateAndDiscom,
  generateDailyReadingsFromMonthlyKwh,
  parseElectricityBillText,
  SAMPLE_INDIAN_BILLS,
} from "../../src/services/universalBillParserService";
import { calculateStateBill } from "../../src/domain/nationalTariff";

describe("universalBillParserService", () => {
  it("detects state and DISCOM for Delhi BSES correctly", () => {
    const res = detectStateAndDiscom("BSES RAJDHANI POWER LIMITED NEW DELHI");
    expect(res.stateCode).toBe("DL");
    expect(res.discomId).toBe("bses_rajdhani");
  });

  it("distinguishes Delhi, Mumbai, and Gujarat DISCOMs by their bill headers", () => {
    expect(detectStateAndDiscom("BSES YAMUNA POWER LIMITED").discomId).toBe(
      "bses_yamuna"
    );
    expect(detectStateAndDiscom("TATA POWER MUMBAI").discomId).toBe(
      "tata_mumbai"
    );
    expect(detectStateAndDiscom("TATA POWER DELHI LIMITED").discomId).toBe(
      "tpddl"
    );
    expect(detectStateAndDiscom("MGVCL Gujarat").discomId).toBe("mgvcl");
    expect(detectStateAndDiscom("PGVCL Gujarat").discomId).toBe("pgvcl");
    expect(detectStateAndDiscom("UGVCL Gujarat").discomId).toBe("ugvcl");
    expect(detectStateAndDiscom("TORRENT POWER").discomId).toBe(
      "torrent_power"
    );
    expect(detectStateAndDiscom("BESCOM Karnataka").discomId).toBe("bescom");
    expect(detectStateAndDiscom("UPPCL Urban").discomId).toBe("uppcl_urban");
    expect(detectStateAndDiscom("TANGEDCO Tamil Nadu").discomId).toBe(
      "tangedco"
    );
  });

  it("detects state and DISCOM for Maharashtra MSEDCL correctly", () => {
    const res = detectStateAndDiscom("MAHARASHTRA STATE ELECTRICITY DISTRIBUTION MAHAVITARAN");
    expect(res.stateCode).toBe("MH");
    expect(res.discomId).toBe("msedcl");
  });

  it("detects state and DISCOM for Gujarat DGVCL correctly", () => {
    const res = detectStateAndDiscom("DAKSHIN GUJARAT VIJ COMPANY LIMITED GUVNL TARIFF RGPR");
    expect(res.stateCode).toBe("GJ");
    expect(res.discomId).toBe("dgvcl");
  });

  it("parses all bundled sample Indian bills accurately", () => {
    for (const sample of SAMPLE_INDIAN_BILLS) {
      const parsed = parseElectricityBillText(sample.sampleText);
      expect(parsed.detectedStateCode).toBe(sample.stateCode);
      expect(parsed.totalKwh).toBe(sample.previewKwh);
      expect(parsed.billAmountInr).toBe(sample.previewAmountInr);
      expect(parsed.billAmountIsEstimated).toBe(false);
      expect(parsed.billingPeriodDays).toBe(30);
      expect(parsed.generatedDailyReadings.length).toBe(
        parsed.billingPeriodDays
      );

      // Verify daily readings sum close to the total monthly kWh
      const sumKwh = parsed.generatedDailyReadings.reduce((acc, r) => acc + r.kwh, 0);
      expect(Math.abs(sumKwh - sample.previewKwh)).toBeLessThan(1.0);
    }

    const delhiBill = parseElectricityBillText(SAMPLE_INDIAN_BILLS[0].sampleText);
    expect(delhiBill.detectedDiscomId).toBe("bses_yamuna");
    expect(delhiBill.consumerNumber).toBe("1029384752");
    expect(delhiBill.billDate).toBe("2026-11-01");
    expect(delhiBill.billingPeriodStartDate).toBe("2026-10-02");
    expect(delhiBill.billingPeriodEndDate).toBe("2026-10-31");
    expect(delhiBill.billingPeriodDaysIsEstimated).toBe(false);
  });

  it("uses the parsed sanctioned load when estimating a bill amount", () => {
    const parsed = parseElectricityBillText(
      "BESCOM Karnataka\nTotal kWh Billed: 250 kWh\nSanctioned Load: 3.00 kW"
    );
    expect(parsed.sanctionedLoadKw).toBe(3);
    expect(parsed.billAmountIsEstimated).toBe(true);
    expect(parsed.billAmountInr).toBe(
      calculateStateBill(250, "KA", "bescom", 3).totalBillInr
    );
  });

  it("rejects bill text that does not contain a valid consumption value", () => {
    expect(() => parseElectricityBillText("BESCOM Karnataka\nNo meter units listed")).toThrow(
      RangeError
    );
    expect(() =>
      parseElectricityBillText("BESCOM Karnataka\nUnits Consumed: 50000 kWh")
    ).toThrow(RangeError);
  });

  it("generates authentic daily readings with correct count and non-zero values", () => {
    const readings = generateDailyReadingsFromMonthlyKwh(300, "2026-11-09", 30);
    expect(readings.length).toBe(30);
    for (const r of readings) {
      expect(r.kwh).toBeGreaterThan(0);
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
