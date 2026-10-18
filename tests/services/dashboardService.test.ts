import { describe, it, expect } from "vitest";
import { buildDashboardViewModel } from "@/services/dashboardService";
import type { Reading, Assumptions } from "@/domain/types";

const mockAssumptions: Assumptions = {
  tariffPerKwh: 7,
  emissionFactor: 0.82,
  spikeMultiplier: 1.5,
};

describe("services/dashboardService", () => {
  it("builds a complete view model sorted chronologically", () => {
    const readings: Reading[] = [
      { spaceId: "space-1", date: "2026-10-03", kwh: 6 },
      { spaceId: "space-1", date: "2026-10-01", kwh: 5 },
      { spaceId: "space-1", date: "2026-10-02", kwh: 12 },
    ];

    const vm = buildDashboardViewModel(readings, mockAssumptions);

    // Verify ordering
    expect(vm.readings[0].date).toBe("2026-10-01");
    expect(vm.readings[1].date).toBe("2026-10-02");
    expect(vm.readings[2].date).toBe("2026-10-03");

    // Verify stats
    expect(vm.stats.days).toBe(3);
    expect(vm.stats.totalKwh).toBe(23);

    // Verify spikes
    expect(vm.spikes.length).toBeGreaterThan(0);
    expect(vm.spikes[0].date).toBe("2026-10-02");

    // Verify tips
    expect(vm.tips.length).toBeGreaterThanOrEqual(3);

    // Verify assumptions retained
    expect(vm.assumptions).toEqual(mockAssumptions);
  });
});
