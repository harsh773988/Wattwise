"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_SOLAR_ASSUMPTIONS,
  estimateSolar,
  validateSolarInput,
} from "@/domain/solar";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const num = (n: number) => n.toLocaleString("en-IN");

export default function SolarPlanner() {
  const [bill, setBill] = useState("");
  const [roof, setRoof] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    if (!submitted) return null;
    const v = validateSolarInput({ monthlyBillInr: bill, roofAreaSqFt: roof });
    if (!v.ok) return { errors: v.errors } as const;
    return { estimate: estimateSolar(v.input) } as const;
  }, [bill, roof, submitted]);

  const a = DEFAULT_SOLAR_ASSUMPTIONS;
  const field =
    "w-full border-2 border-black bg-white px-3 py-2 text-base focus:outline-none focus-visible:ring-4 focus-visible:ring-[#171e19]";
  const card =
    "border-2 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]";

  return (
    <section aria-labelledby="solar-planner-title" className="my-8">
      <h2 id="solar-planner-title" className="text-2xl font-extrabold">
        Rooftop solar planner
      </h2>
      <p className="mt-1 max-w-prose">
        Enter your average monthly bill and roof area to get a planning
        estimate of system size, cost, savings and CO₂ reduction.
      </p>

      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <label className="grid gap-1 font-bold">
          Average monthly bill (₹)
          <input
            className={field}
            inputMode="decimal"
            value={bill}
            onChange={(e) => setBill(e.target.value)}
            placeholder="e.g. 3000"
          />
        </label>
        <label className="grid gap-1 font-bold">
          Roof area (sq ft)
          <input
            className={field}
            inputMode="decimal"
            value={roof}
            onChange={(e) => setRoof(e.target.value)}
            placeholder="e.g. 600"
          />
        </label>
        <button
          type="submit"
          className="border-2 border-black bg-[#171e19] px-4 py-2 font-bold text-[#ffe17c] shadow-[4px_4px_0_0_#000] focus-visible:ring-4 focus-visible:ring-black sm:col-span-2 sm:w-fit"
        >
          Calculate estimate
        </button>
      </form>

      <div aria-live="polite" className="mt-6">
        {result && "errors" in result && (
          <ul className="border-2 border-black bg-[#ffd0c8] p-4 font-bold">
            {result.errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}

        {result && "estimate" in result && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={card}>
                <p className="text-sm">Recommended capacity</p>
                <p className="text-3xl font-extrabold">
                  {result.estimate.recommendedKw} kW
                </p>
                <p className="mt-1 text-sm">
                  Needed: {result.estimate.requiredKw} kW · Roof can host up to{" "}
                  {result.estimate.roofLimitKw} kW
                </p>
                {result.estimate.roofLimited && (
                  <p className="mt-2 text-sm font-bold">
                    Your roof area limits the system. Solar would cover about{" "}
                    {Math.round(result.estimate.offsetFraction * 100)}% of your
                    use.
                  </p>
                )}
              </div>
              <div className={card}>
                <p className="text-sm">Estimated setup cost (before incentives)</p>
                <p className="text-3xl font-extrabold">
                  {inr(result.estimate.estimatedCostInr)}
                </p>
                <p className="mt-1 text-sm">
                  Placeholder rate of {inr(a.costPerKw)}/kW. Get written quotes.
                </p>
              </div>
              <div className={card}>
                <p className="text-sm">Estimated bill savings</p>
                <p className="text-3xl font-extrabold">
                  {inr(result.estimate.monthlySavingsInr)}/month
                </p>
                <p className="mt-1 text-sm">
                  {inr(result.estimate.annualSavingsInr)}/year
                  {result.estimate.paybackYears !== null &&
                    ` · simple payback about ${result.estimate.paybackYears} years`}
                </p>
              </div>
              <div className={card}>
                <p className="text-sm">Estimated CO₂ reduction</p>
                <p className="text-3xl font-extrabold">
                  {num(result.estimate.annualCo2ReductionKg)} kg/year
                </p>
                <p className="mt-1 text-sm">
                  About {num(result.estimate.monthlyCo2ReductionKg)} kg/month at{" "}
                  {a.gridEmissionKgPerKwh} kg CO₂/kWh.
                </p>
              </div>
            </div>

            <details className="mt-4 border-2 border-black bg-white p-4">
              <summary className="cursor-pointer font-bold">
                Assumptions used
              </summary>
              <ul className="mt-2 list-disc pl-5 text-sm">
                <li>Tariff: {inr(a.tariffPerKwh)}/kWh (varies by state and slab)</li>
                <li>
                  Generation: {a.generationKwhPerKwPerDay} kWh per kW per day
                </li>
                <li>
                  Roof space: {a.areaSqFtPerKw} sq ft per kW,{" "}
                  {Math.round(a.usableRoofFraction * 100)}% of entered area
                  usable
                </li>
                <li>Payback is simple and ignores degradation and financing.</li>
                <li>No subsidy or incentive is included.</li>
              </ul>
            </details>
          </>
        )}
      </div>

      <p className="mt-4 max-w-prose text-sm">
        These are estimates, not a quotation or eligibility check. Confirm
        current costs and incentives on the official portals and get a
        site-specific assessment before deciding.
      </p>
    </section>
  );
}
