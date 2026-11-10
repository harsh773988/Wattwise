import { describe, expect, it } from "vitest";
import {
  createCitizenPledge,
  OFFICIAL_PLEDGE_COMMITMENTS,
} from "../../src/domain/lifePledge";

describe("lifePledge domain module", () => {
  it("provides 5 core official Mission LiFE commitments", () => {
    expect(OFFICIAL_PLEDGE_COMMITMENTS.length).toBe(5);
    for (const c of OFFICIAL_PLEDGE_COMMITMENTS) {
      expect(c.title).toBeTruthy();
      expect(c.hindiTitle).toBeTruthy();
      expect(c.description).toBeTruthy();
    }
  });

  it("generates an authentic pledge record with certificate ID and points", () => {
    const record = createCitizenPledge("Vikramaditya Sharma", "MH");
    expect(record.citizenName).toBe("Vikramaditya Sharma");
    expect(record.stateCode).toBe("MH");
    expect(record.certificateId).toMatch(/^LIFE-IN-MH-\d+$/);
    expect(record.pointsAwarded).toBe(50);
    expect(record.commitmentsAccepted.length).toBe(5);
  });

  it("throws RangeError on invalid or empty name", () => {
    expect(() => createCitizenPledge("")).toThrow(RangeError);
    expect(() => createCitizenPledge(" ")).toThrow(RangeError);
  });

  it("throws RangeError if no commitments are selected", () => {
    expect(() => createCitizenPledge("Amit Patel", "GJ", [])).toThrow(RangeError);
  });
});

