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
      { spaceId: "test", date: "2026-10-01", kwh: 7 },
      { spaceId: "test", date: "2026-10-02", kwh: 7.2 },
      { spaceId: "test", date: "2026-10-03", kwh: 6.8 },
    ];
    const stats = computeStats(readings, mockAssumptions);
    const spikes = detectSpikes(readings, 1.5);
    const tips = generateTips(readings, stats, spikes);

    expect(tips.length).toBeGreaterThanOrEqual(3);
    expect(tips.length).toBeLessThanOrEqual(5);
  });

  it("triggers high average usage tip when avg > 10 kWh", () => {
    const readings: Reading[] = [
      { spaceId: "test", date: "2026-10-01", kwh: 14 },
      { spaceId: "test", date: "2026-10-02", kwh: 16 },
    ];
    const stats = computeStats(readings, mockAssumptions);
    const spikes = detectSpikes(readings, 1.5);
    const tips = generateTips(readings, stats, spikes);

    const highAvgTip = tips.find((t) => t.id === "high-avg");
    expect(highAvgTip).toBeDefined();
    expect(highAvgTip?.category).toBe("high-usage");
  });

  it("triggers spike day tip when spikes are present", () => {
    const readings: Reading[] = [
      { spaceId: "test", date: "2026-10-01", kwh: 5 },
      { spaceId: "test", date: "2026-10-02", kwh: 5 },
      { spaceId: "test", date: "2026-10-03", kwh: 15 },
    ];
    const stats = computeStats(readings, mockAssumptions);
    const spikes = detectSpikes(readings, 1.5);
    const tips = generateTips(readings, stats, spikes);

    const spikeTip = tips.find((t) => t.id === "spike-days");
    expect(spikeTip).toBeDefined();
    expect(spikeTip?.title).toContain("1 spike day");
    expect(spikeTip?.description).toContain("1 day");
  });

  it("identifies weekend vs weekday imbalance", () => {
    // 2026-10-09 is Friday (weekday), 2026-10-10 is Saturday (weekend), 2026-10-11 is Sunday (weekend)
    const readings: Reading[] = [
      { spaceId: "test", date: "2026-10-08", kwh: 5 }, // Thu
      { spaceId: "test", date: "2026-10-09", kwh: 5 }, // Fri
      { spaceId: "test", date: "2026-10-10", kwh: 12 }, // Sat
      { spaceId: "test", date: "2026-10-11", kwh: 14 }, // Sun
    ];
    const stats = computeStats(readings, mockAssumptions);
    const spikes = detectSpikes(readings, 1.5);
    const tips = generateTips(readings, stats, spikes);

    const weekendTip = tips.find((t) => t.id === "weekend-high");
    expect(weekendTip).toBeDefined();
  });
});
