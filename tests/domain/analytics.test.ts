import { describe, it, expect } from "vitest";
import {
  averageKwh,
  totalKwh,
  minKwh,
  maxKwh,
  detectSpikes,
  computeStats,
  computeTrend,
  downsampleToWeekly,
} from "@/domain/analytics";
import type { Reading, Assumptions } from "@/domain/types";

const mockAssumptions: Assumptions = {
  tariffPerKwh: 7,
  emissionFactor: 0.82,
  spikeMultiplier: 1.5,
};

describe("domain/analytics", () => {
  describe("averageKwh", () => {
    it("returns 0 for empty series", () => {
      expect(averageKwh([])).toBe(0);
    });

    it("returns the exact value for a single reading", () => {
      const readings: Reading[] = [{ spaceId: "default", date: "2026-10-01", kwh: 7.5 }];
      expect(averageKwh(readings)).toBe(7.5);
    });

    it("computes the correct mean for multiple readings", () => {
      const readings: Reading[] = [
        { spaceId: "default", date: "2026-10-01", kwh: 5 },
        { spaceId: "default", date: "2026-10-02", kwh: 10 },
        { spaceId: "default", date: "2026-10-03", kwh: 15 },
      ];
      expect(averageKwh(readings)).toBe(10);
    });

    it("handles all equal values", () => {
      const readings: Reading[] = [
        { spaceId: "default", date: "2026-10-01", kwh: 6 },
        { spaceId: "default", date: "2026-10-02", kwh: 6 },
        { spaceId: "default", date: "2026-10-03", kwh: 6 },
      ];
      expect(averageKwh(readings)).toBe(6);
    });
  });

  describe("minKwh and maxKwh and totalKwh", () => {
    it("handles empty arrays gracefully", () => {
      expect(minKwh([])).toBe(0);
      expect(maxKwh([])).toBe(0);
      expect(totalKwh([])).toBe(0);
    });

    it("computes min, max, and total correctly", () => {
      const readings: Reading[] = [
        { spaceId: "default", date: "2026-10-01", kwh: 4 },
        { spaceId: "default", date: "2026-10-02", kwh: 12 },
        { spaceId: "default", date: "2026-10-03", kwh: 8 },
      ];
      expect(minKwh(readings)).toBe(4);
      expect(maxKwh(readings)).toBe(12);
      expect(totalKwh(readings)).toBe(24);
    });
  });

  describe("detectSpikes", () => {
    it("returns empty array for empty or single-item series", () => {
      expect(detectSpikes([], 1.5)).toEqual([]);
      expect(
        detectSpikes([{ spaceId: "default", date: "2026-10-01", kwh: 10 }], 1.5),
      ).toEqual([]);
    });

    it("returns empty array when all values are equal (no spike above 1.5x)", () => {
      const readings: Reading[] = [
        { spaceId: "default", date: "2026-10-01", kwh: 10 },
        { spaceId: "default", date: "2026-10-02", kwh: 10 },
        { spaceId: "default", date: "2026-10-03", kwh: 10 },
      ];
      expect(detectSpikes(readings, 1.5)).toEqual([]);
    });

    it("flags readings greater than multiplier * average", () => {
      // Avg: (6 + 6 + 6 + 15) / 4 = 8.25. Threshold at 1.5x = 12.375.
      const readings: Reading[] = [
        { spaceId: "default", date: "2026-10-01", kwh: 6 },
        { spaceId: "default", date: "2026-10-02", kwh: 6 },
        { spaceId: "default", date: "2026-10-03", kwh: 6 },
        { spaceId: "default", date: "2026-10-04", kwh: 15 },
      ];
      const spikes = detectSpikes(readings, 1.5);
      expect(spikes).toHaveLength(1);
      expect(spikes[0].date).toBe("2026-10-04");
      expect(spikes[0].kwh).toBe(15);
      expect(spikes[0].averageKwh).toBe(8.25);
      expect(spikes[0].multiplier).toBe(1.82);
    });

    it("respects custom spikeMultiplier", () => {
      const readings: Reading[] = [
        { spaceId: "default", date: "2026-10-01", kwh: 10 },
        { spaceId: "default", date: "2026-10-02", kwh: 13 },
      ];
      // Avg = 11.5. 13 is 1.13x.
      expect(detectSpikes(readings, 1.5)).toHaveLength(0);
      expect(detectSpikes(readings, 1.1)).toHaveLength(1);
    });
  });

  describe("computeStats", () => {
    it("calculates accurate summary stats including rupees and CO2", () => {
      const readings: Reading[] = [
        { spaceId: "space-1", date: "2026-10-01", kwh: 10 },
        { spaceId: "space-1", date: "2026-10-02", kwh: 20 },
      ];
      const stats = computeStats(readings, mockAssumptions);
      expect(stats.totalKwh).toBe(30);
      expect(stats.averageKwh).toBe(15);
      expect(stats.minKwh).toBe(10);
      expect(stats.maxKwh).toBe(20);
      expect(stats.days).toBe(2);
      expect(stats.totalCostRupees).toBe(210); // 30 * 7
      expect(stats.totalCo2Kg).toBe(24.6); // 30 * 0.82
    });
  });

  describe("computeTrend", () => {
    it("returns 0 for small series", () => {
      expect(computeTrend([])).toBe(0);
      expect(computeTrend([{ spaceId: "s", date: "2026-10-01", kwh: 5 }])).toBe(0);
    });

    it("calculates positive trend when usage increases", () => {
      const readings: Reading[] = [
        { spaceId: "s", date: "2026-10-01", kwh: 5 },
        { spaceId: "s", date: "2026-10-02", kwh: 5 },
        { spaceId: "s", date: "2026-10-03", kwh: 10 },
        { spaceId: "s", date: "2026-10-04", kwh: 10 },
      ];
      expect(computeTrend(readings)).toBe(100); // 100% increase
    });
  });

  describe("downsampleToWeekly", () => {
    it("returns empty array for empty input", () => {
      expect(downsampleToWeekly([])).toEqual([]);
    });

    it("aggregates readings into weekly points", () => {
      const readings: Reading[] = [
        { spaceId: "s", date: "2026-10-05", kwh: 7 }, // Mon
        { spaceId: "s", date: "2026-10-06", kwh: 9 }, // Tue
        { spaceId: "s", date: "2026-10-12", kwh: 10 }, // Next Mon
      ];
      const weekly = downsampleToWeekly(readings);
      expect(weekly.length).toBe(2);
      expect(weekly[0].kwh).toBe(8); // (7 + 9) / 2
      expect(weekly[1].kwh).toBe(10);
    });
  });
});
