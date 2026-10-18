import { describe, it, expect } from "vitest";
import {
  average,
  averageKwh,
  total,
  totalKwh,
  minKwh,
  maxKwh,
  detectSpikes,
  compareWeekdayWeekend,
  computeStats,
  computeTrend,
  downsampleToWeekly,
  round2,
} from "@/domain/analytics";
import type { Reading, Assumptions } from "@/domain/types";

const mockAssumptions: Assumptions = {
  tariffPerKwh: 7,
  emissionFactor: 0.82,
  spikeMultiplier: 1.5,
};

describe("domain/analytics", () => {
  describe("round2", () => {
    it("handles floating point additions and rounding without precision drift", () => {
      expect(round2(0.1 + 0.2)).toBe(0.3);
      expect(round2(1.005)).toBe(1.01);
      expect(round2(1.2345)).toBe(1.23);
      expect(round2(0)).toBe(0);
    });
  });

  describe("average and averageKwh", () => {
    it("returns 0 for empty series", () => {
      expect(average([])).toBe(0);
      expect(averageKwh([])).toBe(0);
    });

    it("returns exact kwh for a single reading", () => {
      const readings: Reading[] = [{ date: "2026-10-01", kwh: 7.5 }];
      expect(average(readings)).toBe(7.5);
      expect(averageKwh(readings)).toBe(7.5);
    });

    it("handles all equal values", () => {
      const readings: Reading[] = [
        { date: "2026-10-01", kwh: 6.2 },
        { date: "2026-10-02", kwh: 6.2 },
        { date: "2026-10-03", kwh: 6.2 },
      ];
      expect(average(readings)).toBe(6.2);
    });

    it("calculates mean accurately with floating point precision", () => {
      const readings: Reading[] = [
        { date: "2026-10-01", kwh: 1.1 },
        { date: "2026-10-02", kwh: 2.2 },
        { date: "2026-10-03", kwh: 3.3 },
      ];
      expect(average(readings)).toBe(2.2);
    });
  });

  describe("total and totalKwh", () => {
    it("returns 0 for empty series", () => {
      expect(total([])).toBe(0);
      expect(totalKwh([])).toBe(0);
    });

    it("returns exact value for single reading", () => {
      expect(total([{ date: "2026-10-01", kwh: 5.5 }])).toBe(5.5);
    });

    it("sums series accurately mitigating float errors", () => {
      const readings: Reading[] = [
        { date: "2026-10-01", kwh: 0.1 },
        { date: "2026-10-02", kwh: 0.2 },
      ];
      expect(total(readings)).toBe(0.3);
    });
  });

  describe("minKwh and maxKwh", () => {
    it("handles empty arrays gracefully by returning 0", () => {
      expect(minKwh([])).toBe(0);
      expect(maxKwh([])).toBe(0);
    });

    it("returns correct min and max for single reading", () => {
      const readings: Reading[] = [{ date: "2026-10-01", kwh: 8.5 }];
      expect(minKwh(readings)).toBe(8.5);
      expect(maxKwh(readings)).toBe(8.5);
    });

    it("determines extremes for variable series", () => {
      const readings: Reading[] = [
        { date: "2026-10-01", kwh: 3.2 },
        { date: "2026-10-02", kwh: 12.8 },
        { date: "2026-10-03", kwh: 7.4 },
      ];
      expect(minKwh(readings)).toBe(3.2);
      expect(maxKwh(readings)).toBe(12.8);
    });
  });

  describe("detectSpikes", () => {
    it("returns empty array for empty series or single reading", () => {
      expect(detectSpikes([], 1.5)).toEqual([]);
      expect(detectSpikes([{ date: "2026-10-01", kwh: 10 }], 1.5)).toEqual([]);
    });

    it("returns empty array when spikeMultiplier <= 0", () => {
      const readings: Reading[] = [
        { date: "2026-10-01", kwh: 5 },
        { date: "2026-10-02", kwh: 10 },
      ];
      expect(detectSpikes(readings, 0)).toEqual([]);
      expect(detectSpikes(readings, -1)).toEqual([]);
    });

    it("returns empty array when all readings are equal", () => {
      const readings: Reading[] = [
        { date: "2026-10-01", kwh: 8 },
        { date: "2026-10-02", kwh: 8 },
        { date: "2026-10-03", kwh: 8 },
      ];
      // Avg = 8. Threshold at 1.5x = 12. No reading > 12.
      expect(detectSpikes(readings, 1.5)).toEqual([]);
    });

    it("returns empty array when average is zero", () => {
      const readings: Reading[] = [
        { date: "2026-10-01", kwh: 0 },
        { date: "2026-10-02", kwh: 0 },
      ];
      expect(detectSpikes(readings, 1.5)).toEqual([]);
    });

    it("does NOT flag readings exactly at the spike threshold (strict day > threshold)", () => {
      // Avg: (10 + 10 + 10 + 15) / 4 = 11.25. Threshold at 1.5x of (6 + 6 + 18) / 3 = 10.
      // Let readings be 6, 6, 18. Average = 10. Multiplier = 1.8. Threshold = 18.
      const readings: Reading[] = [
        { date: "2026-10-01", kwh: 6 },
        { date: "2026-10-02", kwh: 6 },
        { date: "2026-10-03", kwh: 18 }, // exactly 1.8x average of 10
      ];
      // If threshold multiplier is 1.8, 18 is NOT > 1.8 * 10
      expect(detectSpikes(readings, 1.8)).toEqual([]);
      // But if threshold multiplier is 1.79, it IS a spike
      expect(detectSpikes(readings, 1.79)).toHaveLength(1);
    });

    it("flags readings strictly above spike threshold", () => {
      const readings: Reading[] = [
        { date: "2026-10-01", kwh: 6 },
        { date: "2026-10-02", kwh: 6 },
        { date: "2026-10-03", kwh: 6 },
        { date: "2026-10-04", kwh: 15 },
      ];
      // Avg = 8.25. 1.5x = 12.375. 15 > 12.375.
      const spikes = detectSpikes(readings, 1.5);
      expect(spikes).toHaveLength(1);
      expect(spikes[0].date).toBe("2026-10-04");
      expect(spikes[0].kwh).toBe(15);
      expect(spikes[0].averageKwh).toBe(8.25);
      expect(spikes[0].multiplier).toBe(1.82);
    });
  });

  describe("compareWeekdayWeekend", () => {
    it("returns insufficient_data for empty series", () => {
      const res = compareWeekdayWeekend([]);
      expect(res.higher).toBe("insufficient_data");
      expect(res.weekdayAverage).toBe(0);
      expect(res.weekendAverage).toBe(0);
      expect(res.differencePercentage).toBe(0);
    });

    it("returns insufficient_data when only weekday or weekend days are present", () => {
      // 2026-10-05 is Monday
      const res = compareWeekdayWeekend([{ date: "2026-10-05", kwh: 5 }]);
      expect(res.higher).toBe("insufficient_data");
    });

    it("returns equal when weekday and weekend averages match", () => {
      // 2026-10-09 (Friday), 2026-10-10 (Saturday)
      const readings: Reading[] = [
        { date: "2026-10-09", kwh: 8 },
        { date: "2026-10-10", kwh: 8 },
      ];
      const res = compareWeekdayWeekend(readings);
      expect(res.higher).toBe("equal");
      expect(res.differencePercentage).toBe(0);
    });

    it("identifies when weekend usage is significantly higher", () => {
      // Weekdays: 2026-10-08 (Thu: 5), 2026-10-09 (Fri: 5) -> avg 5
      // Weekends: 2026-10-10 (Sat: 10), 2026-10-11 (Sun: 10) -> avg 10
      const readings: Reading[] = [
        { date: "2026-10-08", kwh: 5 },
        { date: "2026-10-09", kwh: 5 },
        { date: "2026-10-10", kwh: 10 },
        { date: "2026-10-11", kwh: 10 },
      ];
      const res = compareWeekdayWeekend(readings);
      expect(res.higher).toBe("weekend");
      expect(res.weekdayAverage).toBe(5);
      expect(res.weekendAverage).toBe(10);
      expect(res.differencePercentage).toBe(100); // 100% higher
    });

    it("identifies when weekday usage is higher", () => {
      const readings: Reading[] = [
        { date: "2026-10-08", kwh: 10 }, // Thu
        { date: "2026-10-10", kwh: 5 }, // Sat
      ];
      const res = compareWeekdayWeekend(readings);
      expect(res.higher).toBe("weekday");
      expect(res.weekdayAverage).toBe(10);
      expect(res.weekendAverage).toBe(5);
      expect(res.differencePercentage).toBe(100);
    });

    it("handles zero baseline without divide-by-zero", () => {
      const readings: Reading[] = [
        { date: "2026-10-08", kwh: 0 }, // Thu (0 kWh)
        { date: "2026-10-10", kwh: 10 }, // Sat (10 kWh)
      ];
      const res = compareWeekdayWeekend(readings);
      expect(res.higher).toBe("weekend");
      expect(res.weekdayAverage).toBe(0);
      expect(res.weekendAverage).toBe(10);
      expect(res.differencePercentage).toBe(0);
    });
  });

  describe("computeStats", () => {
    it("computes comprehensive summary stats including INR and CO2", () => {
      const readings: Reading[] = [
        { date: "2026-10-01", kwh: 10 },
        { date: "2026-10-02", kwh: 20 },
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
      expect(computeTrend([{ date: "2026-10-01", kwh: 5 }])).toBe(0);
    });

    it("returns 0 if first half average is 0", () => {
      const readings: Reading[] = [
        { date: "2026-10-01", kwh: 0 },
        { date: "2026-10-02", kwh: 10 },
      ];
      expect(computeTrend(readings)).toBe(0);
    });

    it("calculates positive trend for escalating consumption", () => {
      const readings: Reading[] = [
        { date: "2026-10-01", kwh: 5 },
        { date: "2026-10-02", kwh: 5 },
        { date: "2026-10-03", kwh: 10 },
        { date: "2026-10-04", kwh: 10 },
      ];
      expect(computeTrend(readings)).toBe(100);
    });
  });

  describe("downsampleToWeekly", () => {
    it("returns empty array for empty series", () => {
      expect(downsampleToWeekly([])).toEqual([]);
    });

    it("aggregates readings by ISO Monday weeks including Sunday readings", () => {
      // 2026-10-05 is Mon, 2026-10-06 is Tue, 2026-10-11 is Sun (same ISO week)
      // 2026-10-12 is next Mon
      const readings: Reading[] = [
        { date: "2026-10-05", kwh: 6 }, // Mon
        { date: "2026-10-06", kwh: 8 }, // Tue
        { date: "2026-10-11", kwh: 10 }, // Sun (day === 0)
        { date: "2026-10-12", kwh: 12 }, // Next Mon
      ];
      const weekly = downsampleToWeekly(readings);
      expect(weekly).toHaveLength(2);
      expect(weekly[0].date).toBe("2026-10-05");
      expect(weekly[0].kwh).toBe(8); // (6 + 8 + 10) / 3
      expect(weekly[1].date).toBe("2026-10-12");
      expect(weekly[1].kwh).toBe(12);
    });
  });
});
