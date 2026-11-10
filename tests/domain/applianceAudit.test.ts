import { describe, expect, it } from "vitest";
import {
  performHomeEnergyAudit,
  STANDARD_HOUSEHOLD_APPLIANCES,
} from "../../src/domain/applianceAudit";

describe("applianceAudit domain module", () => {
  it("audits standard household appliances and identifies highest consumers", () => {
    const audit = performHomeEnergyAudit(STANDARD_HOUSEHOLD_APPLIANCES, 7.0);

    expect(audit.items.length).toBe(STANDARD_HOUSEHOLD_APPLIANCES.length);
    expect(audit.totalDailyKwh).toBeGreaterThan(0);
    expect(audit.totalMonthlyKwh).toBeGreaterThan(0);
    expect(audit.totalMonthlyCostInr).toBeGreaterThan(0);
    expect(audit.highestConsumerName).toBeTruthy();

    // Sum of shares should equal ~100%
    const totalShare = audit.items.reduce((sum, item) => sum + item.sharePercent, 0);
    expect(totalShare).toBeGreaterThanOrEqual(99.0);
    expect(totalShare).toBeLessThanOrEqual(101.0);
  });

  it("calculates BLDC fan retrofit savings and payback period", () => {
    const audit = performHomeEnergyAudit(STANDARD_HOUSEHOLD_APPLIANCES, 7.0);
    const fanResult = audit.items.find((i) => i.id === "ceiling_fans");

    expect(fanResult).toBeDefined();
    expect(fanResult?.recommendedUpgrade).toBeDefined();
    expect(fanResult?.recommendedUpgrade?.newWatts).toBe(28);
    expect(fanResult?.recommendedUpgrade?.monthlySavedInr).toBeGreaterThan(0);
    expect(fanResult?.recommendedUpgrade?.paybackMonths).toBeGreaterThan(0);
  });

  it("calculates total potential monthly savings across all upgrades", () => {
    const audit = performHomeEnergyAudit(STANDARD_HOUSEHOLD_APPLIANCES, 7.0);
    expect(audit.totalPotentialMonthlySavingsInr).toBeGreaterThan(0);
  });
});

