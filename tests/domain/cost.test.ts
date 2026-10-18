import { describe, it, expect } from "vitest";
import {
  kwhToRupees,
  kwhToCo2,
  rupeesToKwh,
  formatRupees,
  formatCo2,
  round2,
} from "@/domain/cost";

describe("domain/cost", () => {
  describe("round2", () => {
    it("mitigates floating point inaccuracies", () => {
      expect(round2(0.1 + 0.2)).toBe(0.3);
      expect(round2(1.005)).toBe(1.01);
    });
  });

  describe("kwhToRupees", () => {
    it("converts kWh to INR with accurate rounding", () => {
      expect(kwhToRupees(100, 7)).toBe(700);
      expect(kwhToRupees(15.5, 8.5)).toBe(131.75);
      expect(kwhToRupees(0.1, 7)).toBe(0.7);
    });

    it("handles zero inputs gracefully", () => {
      expect(kwhToRupees(0, 7)).toBe(0);
      expect(kwhToRupees(100, 0)).toBe(0);
      expect(kwhToRupees(0, 0)).toBe(0);
    });

    it("throws RangeError on negative kWh or tariff", () => {
      expect(() => kwhToRupees(-1, 7)).toThrow(RangeError);
      expect(() => kwhToRupees(10, -7)).toThrow(RangeError);
      expect(() => kwhToRupees(-5, -5)).toThrow(RangeError);
    });
  });

  describe("kwhToCo2", () => {
    it("converts kWh to kg CO2 using grid emission factor", () => {
      expect(kwhToCo2(100, 0.82)).toBe(82);
      expect(kwhToCo2(10, 0.82)).toBe(8.2);
    });

    it("handles zero inputs gracefully", () => {
      expect(kwhToCo2(0, 0.82)).toBe(0);
      expect(kwhToCo2(100, 0)).toBe(0);
    });

    it("throws RangeError on negative inputs", () => {
      expect(() => kwhToCo2(-10, 0.82)).toThrow(RangeError);
      expect(() => kwhToCo2(10, -0.82)).toThrow(RangeError);
    });
  });

  describe("rupeesToKwh", () => {
    it("converts rupees back to kWh", () => {
      expect(rupeesToKwh(700, 7)).toBe(100);
      expect(rupeesToKwh(0, 7)).toBe(0);
    });

    it("throws RangeError on negative rupees or non-positive tariff", () => {
      expect(() => rupeesToKwh(-100, 7)).toThrow(RangeError);
      expect(() => rupeesToKwh(700, 0)).toThrow(RangeError);
      expect(() => rupeesToKwh(700, -7)).toThrow(RangeError);
    });
  });

  describe("formatRupees and formatCo2", () => {
    it("formats Indian rupees with standard currency symbols and digits", () => {
      const res = formatRupees(1500.5);
      expect(res).toContain("₹");
      expect(res).toContain("1,500.50");
    });

    it("formats CO2 in kg or tonnes appropriately", () => {
      expect(formatCo2(45.5)).toBe("45.5 kg CO₂");
      expect(formatCo2(1200)).toBe("1.2 tonnes CO₂");
    });
  });
});
