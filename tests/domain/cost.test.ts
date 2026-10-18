import { describe, it, expect } from "vitest";
import {
  kwhToRupees,
  kwhToCo2,
  rupeesToKwh,
  formatRupees,
  formatCo2,
} from "@/domain/cost";

describe("domain/cost", () => {
  describe("kwhToRupees", () => {
    it("converts kWh to INR correctly", () => {
      expect(kwhToRupees(100, 7)).toBe(700);
      expect(kwhToRupees(15.5, 8.5)).toBe(131.75);
    });

    it("handles zero gracefully", () => {
      expect(kwhToRupees(0, 7)).toBe(0);
      expect(kwhToRupees(100, 0)).toBe(0);
    });

    it("throws RangeError for negative values", () => {
      expect(() => kwhToRupees(-10, 7)).toThrow(RangeError);
      expect(() => kwhToRupees(10, -7)).toThrow(RangeError);
    });
  });

  describe("kwhToCo2", () => {
    it("converts kWh to CO2 kg correctly", () => {
      expect(kwhToCo2(100, 0.82)).toBe(82);
    });

    it("throws RangeError for negative values", () => {
      expect(() => kwhToCo2(-5, 0.82)).toThrow(RangeError);
      expect(() => kwhToCo2(5, -0.82)).toThrow(RangeError);
    });
  });

  describe("rupeesToKwh", () => {
    it("inverts INR to kWh", () => {
      expect(rupeesToKwh(700, 7)).toBe(100);
    });

    it("throws RangeError for non-positive tariff", () => {
      expect(() => rupeesToKwh(700, 0)).toThrow(RangeError);
      expect(() => rupeesToKwh(700, -2)).toThrow(RangeError);
    });
  });

  describe("formatRupees and formatCo2", () => {
    it("formats rupee amounts with Indian locale formatting", () => {
      const formatted = formatRupees(1234.5);
      expect(formatted).toContain("1,234.50");
      expect(formatted).toContain("₹");
    });

    it("formats kg and tonnes of CO2 cleanly", () => {
      expect(formatCo2(50)).toBe("50 kg CO₂");
      expect(formatCo2(1500)).toBe("1.5 tonnes CO₂");
    });
  });
});
