import { describe, it, expect } from "vitest";
import { generateTips } from "@/domain/tips";
import { computeStats, detectSpikes } from "@/domain/analytics";
import type { Reading, Assumptions } from "@/domain/types";

const mockAssumptions: Assumptions = {
  tariffPerKwh: 7,
  emissionFactor: 0.82,
  spikeMultiplier: 1.5,
};

describe("domain/tips", () => {
  it("generates between 3 and 5 tips for any valid pattern", () => {
    const readings: Reading[] = [
      { date: "2026-10-01", kwh: 7 },
      { date: "2026-10-02", kwh: 7.2 },
      { date: "2026-10-03", kwh: 6.8 },
    ];
    const stats = computeStats(readings, mockAssumptions);
    const spikes = detectSpikes(readings, 1.5);
    const tips = generateTips(readings, stats, spikes);

    expect(tips.length).toBeGreaterThanOrEqual(3);
    expect(tips.length).toBeLessThanOrEqual(5);

    // Each tip has required domain attributes
    for (const tip of tips) {
      expect(tip.id).toBeDefined();
      expect(typeof tip.title).toBe("string");
      expect(typeof tip.message).toBe("string");
      expect(typeof tip.estimatedMonthlySavingKwh).toBe("number");
      expect(tip.estimatedMonthlySavingKwh).toBeGreaterThanOrEqual(0);
    }
  });

  it("triggers high average usage tip when avg > baseline", () => {
    const readings: Reading[] = [
      { date: "2026-10-01", kwh: 14 },
      { date: "2026-10-02", kwh: 16 },
    ];
    const stats = computeStats(readings, mockAssumptions);
    const spikes = detectSpikes(readings, 1.5);
    const tips = generateTips(readings, stats, spikes);

    const highAvgTip = tips.find((t) => t.id === "high-avg");
    expect(highAvgTip).toBeDefined();
    expect(highAvgTip?.category).toBe("high-usage");
    expect(highAvgTip?.estimatedMonthlySavingKwh).toBeGreaterThan(0);
    expect(highAvgTip?.message).toContain("above the typical baseline");
  });

  it("respects custom baseline when provided", () => {
    const readings: Reading[] = [
      { date: "2026-10-01", kwh: 12 },
      { date: "2026-10-02", kwh: 12 },
    ];
    const stats = computeStats(readings, mockAssumptions);
    // Baseline is 15 -> 12 is not above baseline
    const tips = generateTips(readings, stats, [], 15);
    expect(tips.find((t) => t.id === "high-avg")).toBeUndefined();
  });

  it("triggers spike day tip when a single spike is present", () => {
    const readings: Reading[] = [
      { date: "2026-10-01", kwh: 5 },
      { date: "2026-10-02", kwh: 5 },
      { date: "2026-10-03", kwh: 15 },
    ];
    const stats = computeStats(readings, mockAssumptions);
    const spikes = detectSpikes(readings, 1.5);
    const tips = generateTips(readings, stats, spikes);

    const spikeTip = tips.find((t) => t.id === "spike-days");
    expect(spikeTip).toBeDefined();
    expect(spikeTip?.title).toContain("1 spike day");
    expect(spikeTip?.description).toContain("1 day");
    expect(spikeTip?.category).toBe("spike");
    expect(spikeTip?.estimatedMonthlySavingKwh).toBeGreaterThan(0);
  });

  it("handles plural phrasing and accumulated savings for multiple spikes", () => {
    const spikes = [
      { date: "2026-10-03", kwh: 20, averageKwh: 8, multiplier: 2.5 },
      { date: "2026-10-04", kwh: 22, averageKwh: 8, multiplier: 2.75 },
    ];
    const readings: Reading[] = [
      { date: "2026-10-01", kwh: 6 },
      { date: "2026-10-02", kwh: 6 },
      { date: "2026-10-03", kwh: 20 },
      { date: "2026-10-04", kwh: 22 },
    ];
    const stats = computeStats(readings, mockAssumptions);
    const tips = generateTips(readings, stats, spikes);

    const spikeTip = tips.find((t) => t.id === "spike-days");
    expect(spikeTip).toBeDefined();
    expect(spikeTip?.title).toBe("2 spike days detected");
    expect(spikeTip?.message).toContain("2 days");
  });

  it("identifies weekend vs weekday pattern when weekend is significantly higher", () => {
    // 2026-10-08 is Thu, 2026-10-09 is Fri, 2026-10-10 is Sat, 2026-10-11 is Sun
    const readings: Reading[] = [
      { date: "2026-10-08", kwh: 5 },
      { date: "2026-10-09", kwh: 5 },
      { date: "2026-10-10", kwh: 12 },
      { date: "2026-10-11", kwh: 14 },
    ];
    const stats = computeStats(readings, mockAssumptions);
    const spikes = detectSpikes(readings, 1.5);
    const tips = generateTips(readings, stats, spikes);

    const weekendTip = tips.find((t) => t.id === "weekend-high");
    expect(weekendTip).toBeDefined();
    expect(weekendTip?.category).toBe("consistency");
    expect(weekendTip?.estimatedMonthlySavingKwh).toBeGreaterThan(0);
  });

  it("identifies weekday vs weekend pattern when weekday is significantly higher", () => {
    // Weekday (Mon/Tue): 15 kWh, Weekend (Sat/Sun): 6 kWh
    const readings: Reading[] = [
      { date: "2026-10-05", kwh: 15 }, // Mon
      { date: "2026-10-06", kwh: 15 }, // Tue
      { date: "2026-10-10", kwh: 6 }, // Sat
      { date: "2026-10-11", kwh: 6 }, // Sun
    ];
    const stats = computeStats(readings, mockAssumptions);
    const tips = generateTips(readings, stats, []);

    const weekdayTip = tips.find((t) => t.id === "weekday-high");
    expect(weekdayTip).toBeDefined();
    expect(weekdayTip?.category).toBe("consistency");
  });

  it("triggers upward trend tip when usage is escalating", () => {
    const readings: Reading[] = [
      { date: "2026-10-01", kwh: 5 },
      { date: "2026-10-02", kwh: 5 },
      { date: "2026-10-03", kwh: 10 },
      { date: "2026-10-04", kwh: 10 },
    ];
    const stats = computeStats(readings, mockAssumptions);
    const tips = generateTips(readings, stats, []);

    const trendTip = tips.find((t) => t.id === "trend-up");
    expect(trendTip).toBeDefined();
    expect(trendTip?.category).toBe("reduction");
    expect(trendTip?.title).toBe("Consumption Trending Upward");
  });

  it("provides fallback general tips when user pattern has no spikes or anomalies", () => {
    // Flat low usage: 4 kWh every day
    const readings: Reading[] = [
      { date: "2026-10-05", kwh: 4 }, // Mon
      { date: "2026-10-06", kwh: 4 }, // Tue
      { date: "2026-10-10", kwh: 4 }, // Sat
      { date: "2026-10-11", kwh: 4 }, // Sun
    ];
    const stats = computeStats(readings, mockAssumptions);
    const tips = generateTips(readings, stats, []);

    expect(tips.length).toBe(3);
    const ids = tips.map((t) => t.id);
    expect(ids).toContain("led-retrofit");
    expect(ids).toContain("star-rated-appliances");
    expect(ids).toContain("thermostat-setpoint");
  });

  it("handles edge cases gracefully: empty series and zero readings", () => {
    const emptyStats = computeStats([], mockAssumptions);
    const emptyTips = generateTips([], emptyStats, []);
    expect(emptyTips.length).toBeGreaterThanOrEqual(3);
    expect(emptyTips.length).toBeLessThanOrEqual(5);

    // With 0 average kWh, fallback star-rated appliances tip defaults saving to 35
    const starTip = emptyTips.find((t) => t.id === "star-rated-appliances");
    expect(starTip?.estimatedMonthlySavingKwh).toBe(35);
  });

  it("caps total tips returned at maximum 5", () => {
    // Construct scenario that triggers baseline-high, spikes, weekend-high, and trend-up + fallbacks
    const readings: Reading[] = [
      { date: "2026-10-05", kwh: 9 }, // Mon
      { date: "2026-10-06", kwh: 9 }, // Tue
      { date: "2026-10-10", kwh: 35 }, // Sat (Spike!)
      { date: "2026-10-11", kwh: 40 }, // Sun (Spike!)
    ];
    const stats = computeStats(readings, mockAssumptions);
    const spikes = detectSpikes(readings, 1.5);
    const tips = generateTips(readings, stats, spikes);

    expect(tips.length).toBeLessThanOrEqual(5);
  });
});
