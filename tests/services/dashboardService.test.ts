import { describe, it, expect } from "vitest";
import { buildDashboard, buildDashboardViewModel } from "@/services/dashboardService";
import type { Reading, Assumptions } from "@/domain/types";

const mockAssumptions: Assumptions = {
  tariffPerKwh: 7,
  emissionFactor: 0.82,
  spikeMultiplier: 1.5,
};

describe("services/dashboardService", () => {
  it("handles empty readings series gracefully", () => {
    const vm = buildDashboard([], mockAssumptions);

    expect(vm.readings).toHaveLength(0);
    expect(vm.totals).toBe(0);
    expect(vm.average).toBe(0);
    expect(vm.cost).toBe(0);
    expect(vm.co2).toBe(0);
    expect(vm.spikes).toHaveLength(0);
    expect(vm.tips.length).toBeGreaterThanOrEqual(3);
    expect(vm.weekdayWeekend.higher).toBe("insufficient_data");
    expect(vm.chartSeries).toHaveLength(0);
    expect(vm.isDownsampled).toBe(false);
  });

  it("handles a single reading series accurately", () => {
    const singleReading: Reading[] = [{ date: "2026-10-01", kwh: 10 }];
    const vm = buildDashboard(singleReading, mockAssumptions);

    expect(vm.readings).toHaveLength(1);
    expect(vm.totals).toBe(10);
    expect(vm.average).toBe(10);
    expect(vm.cost).toBe(70); // 10 * 7
    expect(vm.co2).toBe(8.2); // 10 * 0.82
    expect(vm.spikes).toHaveLength(0);
    expect(vm.chartSeries).toHaveLength(1);
    expect(vm.isDownsampled).toBe(false);
  });

  it("builds a complete view model for a normal series sorted chronologically", () => {
    // Pass unsorted readings
    const readings: Reading[] = [
      { spaceId: "space-1", date: "2026-10-03", kwh: 6 },
      { spaceId: "space-1", date: "2026-10-01", kwh: 5 },
      { spaceId: "space-1", date: "2026-10-02", kwh: 20 }, // Spike!
    ];

    const vm = buildDashboard(readings, mockAssumptions);

    // Verify ordering
    expect(vm.readings[0].date).toBe("2026-10-01");
    expect(vm.readings[1].date).toBe("2026-10-02");
    expect(vm.readings[2].date).toBe("2026-10-03");

    // Verify stats & aliases
    expect(vm.stats.days).toBe(3);
    expect(vm.totals).toBe(31);
    expect(vm.stats.totalKwh).toBe(31);
    expect(vm.average).toBe(10.33);
    expect(vm.cost).toBe(217); // 31 * 7
    expect(vm.co2).toBe(25.42); // 31 * 0.82

    // Verify spikes
    expect(vm.spikes.length).toBeGreaterThan(0);
    expect(vm.spikes[0].date).toBe("2026-10-02");

    // Verify tips
    expect(vm.tips.length).toBeGreaterThanOrEqual(3);

    // Verify weekday vs weekend comparison presence
    expect(vm.weekdayWeekend).toBeDefined();

    // Verify chart series & downsampling flag
    expect(vm.chartSeries).toHaveLength(3);
    expect(vm.isDownsampled).toBe(false);

    // Verify alias buildDashboardViewModel behaves identically
    const aliasVm = buildDashboardViewModel(readings, mockAssumptions);
    expect(aliasVm).toEqual(vm);
  });

  it("triggers chart downsampling to weekly buckets when points exceed threshold", () => {
    // Generate 400 daily readings
    const readings: Reading[] = [];
    const baseDate = new Date("2025-01-01T00:00:00Z");

    for (let i = 0; i < 400; i++) {
      const d = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
      const iso = d.toISOString().slice(0, 10);
      readings.push({ date: iso, kwh: 5 + (i % 5) });
    }

    // Default threshold is 365
    const vm = buildDashboard(readings, mockAssumptions);
    expect(vm.isDownsampled).toBe(true);
    expect(vm.readings).toHaveLength(400);
    // 400 daily points grouped weekly will yield ~58 weekly points
    expect(vm.chartSeries.length).toBeLessThan(70);
    expect(vm.chartSeries.length).toBeGreaterThan(50);
  });

  it("respects custom downsampling threshold parameter", () => {
    const readings: Reading[] = [
      { date: "2026-10-01", kwh: 5 },
      { date: "2026-10-02", kwh: 5 },
      { date: "2026-10-03", kwh: 5 },
      { date: "2026-10-04", kwh: 5 },
      { date: "2026-10-05", kwh: 5 },
    ];

    // Threshold = 2 -> Should downsample
    const vmDownsampled = buildDashboard(readings, mockAssumptions, 2);
    expect(vmDownsampled.isDownsampled).toBe(true);

    // Threshold = 10 -> Should NOT downsample
    const vmNormal = buildDashboard(readings, mockAssumptions, 10);
    expect(vmNormal.isDownsampled).toBe(false);
    expect(vmNormal.chartSeries).toHaveLength(5);
  });
});
