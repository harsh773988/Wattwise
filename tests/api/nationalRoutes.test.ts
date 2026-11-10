import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as getTariffs } from "../../src/app/api/tariffs/route";
import { GET as getSuryaGhar } from "../../src/app/api/surya-ghar/route";
import { GET as getGridClock } from "../../src/app/api/grid-clock/route";

function makeReq(url: string) {
  return new NextRequest(new Request(url));
}

describe("National Pan-India API Routes", () => {
  describe("/api/tariffs", () => {
    it("returns telescopic bill calculation and supported states list", async () => {
      const req = makeReq("http://localhost:3000/api/tariffs?state=MH&kwh=200");
      const res = await getTariffs(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.bill.stateCode).toBe("MH");
      expect(json.data.bill.totalKwh).toBe(200);
      expect(json.data.bill.totalBillInr).toBeGreaterThan(0);
      expect(json.data.supportedStates.length).toBeGreaterThanOrEqual(10);
    });

    it("rejects invalid kwh values with 400", async () => {
      const req = makeReq("http://localhost:3000/api/tariffs?state=MH&kwh=-50");
      const res = await getTariffs(req);
      expect(res.status).toBe(400);
    });
  });

  describe("/api/surya-ghar", () => {
    it("returns PM Surya Ghar calculation with Central and State subsidies", async () => {
      const req = makeReq(
        "http://localhost:3000/api/surya-ghar?bill=3500&roof=500&state=DL"
      );
      const res = await getSuryaGhar(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.plan.stateCode).toBe("DL");
      expect(json.data.plan.centralSubsidyInr).toBeGreaterThan(0);
      expect(json.data.plan.paybackYears).toBeGreaterThan(0);
      expect(json.data.plan.monthlyExportRevenueInr).toBeDefined();
      expect(json.data.availableStatePolicies.length).toBeGreaterThan(0);
      expect(
        json.data.availableStatePolicies.find(
          (policy: { code: string }) => policy.code === "UP"
        ).stateSubsidyFlatInr
      ).toBe(15000);
      expect(
        json.data.availableStatePolicies.find(
          (policy: { code: string }) => policy.code === "GJ"
        ).stateSubsidyStatus
      ).toBe("unverified");
    });
  });

  describe("/api/grid-clock", () => {
    it("returns live IST time, grid status, and shiftable appliances", async () => {
      const req = makeReq("http://localhost:3000/api/grid-clock");
      const res = await getGridClock(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.istTime).toMatch(/\d{2}:\d{2} IST/);
      expect(json.data.status.stressLevel).toBeDefined();
      expect(json.data.shiftableAppliances.length).toBeGreaterThanOrEqual(5);
    });
  });
});
