"use client";

import { useMemo, useState } from "react";
import {
  estimateSolar,
  validateSolarInput,
  type SolarEstimate,
} from "@/domain/solar";
import { DEFAULT_SOLAR_ASSUMPTIONS } from "@/lib/config";

type PlannerResult =
  | { kind: "ok"; estimate: SolarEstimate }
  | { kind: "error"; errors: string[] };

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function SolarPlanner() {
  const [monthlyBillInr, setMonthlyBillInr] = useState("");
  const [roofAreaSqFt, setRoofAreaSqFt] = useState("");
  const [hasCalculated, setHasCalculated] = useState(false);

  const result = useMemo<PlannerResult | null>(() => {
    if (!hasCalculated) {
      return null;
    }

    const validation = validateSolarInput({ monthlyBillInr, roofAreaSqFt });
    if (!validation.ok) {
      return { kind: "error", errors: validation.errors };
    }

    return {
      kind: "ok",
      estimate: estimateSolar(validation.input, DEFAULT_SOLAR_ASSUMPTIONS),
    };
  }, [hasCalculated, monthlyBillInr, roofAreaSqFt]);

  return (
    <section
      aria-labelledby="solar-planner-heading"
      className="mt-7 neo-panel bg-white p-5 sm:p-7"
    >
      <h2 id="solar-planner-heading" className="text-xl font-black uppercase">
        Rooftop solar planner
      </h2>
      <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-black/75">
        Enter your average monthly electricity bill and usable roof area for a
        rough planning estimate.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setHasCalculated(true);
        }}
        className="mt-5 grid gap-4 sm:grid-cols-2"
      >
        <div>
          <label
            htmlFor="solar-monthly-bill"
            className="mb-2 block text-sm font-bold"
          >
            Average monthly bill (INR)
          </label>
          <input
            id="solar-monthly-bill"
            className="neo-input min-h-11"
            type="number"
            inputMode="decimal"
            value={monthlyBillInr}
            onChange={(event) => setMonthlyBillInr(event.target.value)}
            placeholder="e.g. 4200"
          />
        </div>
        <div>
          <label
            htmlFor="solar-roof-area"
            className="mb-2 block text-sm font-bold"
          >
            Roof area (sq ft)
          </label>
          <input
            id="solar-roof-area"
            className="neo-input min-h-11"
            type="number"
            inputMode="decimal"
            value={roofAreaSqFt}
            onChange={(event) => setRoofAreaSqFt(event.target.value)}
            placeholder="e.g. 2000"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            className="neo-btn min-h-11 bg-[#ffe17c] px-4 py-2 text-sm text-black"
            type="submit"
          >
            Calculate estimate
          </button>
        </div>
      </form>

      <div aria-live="polite" className="mt-6">
        {result?.kind === "error" && (
          <ul className="neo-card border-red-700 bg-red-50 p-4 text-sm font-semibold text-red-900">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}

        {result?.kind === "ok" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="neo-card bg-[#b7c6c2] p-4">
              <h3 className="font-black uppercase">Recommended system</h3>
              <p className="mt-2 text-2xl font-black">
                {result.estimate.recommendedKw.toFixed(1)} kW
              </p>
              <p className="mt-2 text-sm">
                Needed: {result.estimate.requiredKw.toFixed(1)} kW · Roof
                limit: {result.estimate.roofLimitKw.toFixed(1)} kW
              </p>
              {result.estimate.roofLimited && (
                <p className="mt-2 text-sm font-bold">
                  Roof area limits this estimate to a{" "}
                  {(result.estimate.offsetFraction * 100).toFixed(0)}% bill
                  offset.
                </p>
              )}
            </article>
            <article className="neo-card bg-[#ffe17c] p-4">
              <h3 className="font-black uppercase">Setup cost before incentives</h3>
              <p className="mt-2 text-2xl font-black">
                {formatRupees(result.estimate.estimatedCostInr)}
              </p>
              <p className="mt-2 text-sm">
                Uses a placeholder planning rate of{" "}
                {formatRupees(DEFAULT_SOLAR_ASSUMPTIONS.costPerKw)} per kW.
              </p>
            </article>
            <article className="neo-card bg-white p-4">
              <h3 className="font-black uppercase">Bill savings</h3>
              <p className="mt-2 text-xl font-black">
                {formatRupees(result.estimate.monthlySavingsInr)} monthly
              </p>
              <p className="mt-1 text-sm">
                {formatRupees(result.estimate.annualSavingsInr)} yearly
              </p>
              <p className="mt-2 text-sm">
                Simple payback:{" "}
                {result.estimate.paybackYears === null
                  ? "Not available"
                  : `${result.estimate.paybackYears.toFixed(1)} years`}
              </p>
            </article>
            <article className="neo-card bg-[#f5f4e8] p-4">
              <h3 className="font-black uppercase">CO₂ reduction estimate</h3>
              <p className="mt-2 text-xl font-black">
                {result.estimate.annualCo2ReductionKg.toLocaleString("en-IN")}{" "}
                kg yearly
              </p>
              <p className="mt-1 text-sm">
                {result.estimate.monthlyCo2ReductionKg.toLocaleString("en-IN")}{" "}
                kg monthly
              </p>
            </article>
          </div>
        )}
      </div>

      <details className="mt-5 border-2 border-black p-4">
        <summary className="cursor-pointer font-bold">Assumptions used</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          <li>Tariff: ₹{DEFAULT_SOLAR_ASSUMPTIONS.tariffPerKwh}/kWh.</li>
          <li>
            Generation: {DEFAULT_SOLAR_ASSUMPTIONS.generationKwhPerKwPerDay} kWh
            per kW per day.
          </li>
          <li>
            Roof area: {DEFAULT_SOLAR_ASSUMPTIONS.areaSqFtPerKw} sq ft per kW,
            with{" "}
            {(DEFAULT_SOLAR_ASSUMPTIONS.usableRoofFraction * 100).toFixed(0)}%
            usable.
          </li>
          <li>Payback is simple and undiscounted; no subsidy is included.</li>
        </ul>
      </details>

      <p className="mt-4 text-xs font-medium leading-relaxed text-black/70">
        Estimates only—not a quotation or eligibility check. Confirm costs and
        incentives through official sources and written quotes.
      </p>
    </section>
  );
}
