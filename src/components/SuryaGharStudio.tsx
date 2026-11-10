"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateSuryaGharPlan,
  STATE_SOLAR_POLICIES,
  SuryaGharCalculation,
} from "@/domain/suryaGharNational";

const sortedSolarPolicies = [...STATE_SOLAR_POLICIES].sort((left, right) => {
  if (left.stateCode === "PAN_INDIA") return -1;
  if (right.stateCode === "PAN_INDIA") return 1;
  return left.stateName.localeCompare(right.stateName, "en-IN");
});

export function SuryaGharStudio() {
  const [monthlyBill, setMonthlyBill] = useState<number>(3200);
  const [roofArea, setRoofArea] = useState<number>(450);
  const [stateCode, setStateCode] = useState<string>("PAN_INDIA");

  let calculation: SuryaGharCalculation | null = null;
  let calcError: string | null = null;

  try {
    calculation = calculateSuryaGharPlan({
      monthlyBillInr: monthlyBill,
      roofAreaSqFt: roofArea,
      stateCode,
    });
  } catch (err: unknown) {
    calcError = err instanceof Error ? err.message : "Calculation error";
  }

  return (
    <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              PM SURYA GHAR PLANNING ESTIMATE
            </span>
            <span className="text-xs text-zinc-400">Indicative calculation</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1.5 flex items-center gap-2">
            ☀️ PM Surya Ghar: Muft Bijli Yojana 360°
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            A planning estimate using configured central and state incentive assumptions. Confirm current eligibility, costs, and export rates with official sources.
          </p>
        </div>

        <a
          href="https://pmsuryaghar.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all self-start md:self-auto cursor-pointer"
        >
          Apply on PM Surya Ghar Portal ↗
        </a>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        {/* State Selector */}
        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/60">
          <label htmlFor="solar-state" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Select Your State
          </label>
          <select
            id="solar-state"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2.5 text-xs font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {sortedSolarPolicies.map((p) => (
              <option key={p.stateCode} value={p.stateCode}>
                {p.stateName} ({p.solarHoursPerDay} hrs sun/day)
              </option>
            ))}
          </select>
          <div className="text-[11px] text-zinc-400 mt-2">
            Sets an estimated regional sunlight factor. Export rates are model assumptions, not live DISCOM rates.
          </div>
        </div>

        {/* Monthly Bill Slider */}
        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/60">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="solar-monthly-bill" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Monthly Bill (₹)
            </label>
            <span className="text-sm font-bold text-emerald-400">
              ₹{monthlyBill.toLocaleString("en-IN")}
            </span>
          </div>
          <input
            id="solar-monthly-bill"
            type="range"
            min={500}
            max={15000}
            step={100}
            value={monthlyBill}
            onChange={(e) => setMonthlyBill(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
            <span>₹500</span>
            <span>₹7,500</span>
            <span>₹15,000</span>
          </div>
        </div>

        {/* Roof Area Slider */}
        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/60">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="solar-roof-area" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Shadow-free Roof Area
            </label>
            <span className="text-sm font-bold text-blue-400">
              {roofArea} sq ft
            </span>
          </div>
          <input
            id="solar-roof-area"
            type="range"
            min={100}
            max={2000}
            step={50}
            value={roofArea}
            onChange={(e) => setRoofArea(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
            <span>100 sq ft</span>
            <span>1,000 sq ft</span>
            <span>2,000 sq ft</span>
          </div>
        </div>
      </div>

      {calcError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg my-4">
          {calcError}
        </div>
      )}

      {calculation && (
        <div className="space-y-6">
          {calculation.stateSubsidyStatus === "unverified" && (
            <p
              role="note"
              className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-200"
            >
              No current state incentive is included for {calculation.stateName} because its amount and eligibility have not been verified. Confirm local programmes with the relevant state agency.
            </p>
          )}

          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-800/70 p-4 rounded-xl border border-zinc-700/60">
              <div className="text-[11px] text-zinc-400 font-medium">Recommended System</div>
              <div className="text-2xl font-black text-white mt-1">
                {calculation.recommendedSystemKw} kW
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Generates ~{calculation.monthlyGenerationKwh} kWh / month
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Roof capacity limit: {calculation.roofLimitKw} kW
                {calculation.isRoofConstrained ? " · roof-limited" : ""}
              </div>
            </div>

            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
              <div className="text-[11px] text-emerald-300 font-medium">Modeled Subsidy Total</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                ₹{calculation.totalSubsidyInr.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-1">
                Central estimate: ₹{calculation.centralSubsidyInr.toLocaleString("en-IN")}
                {calculation.stateSubsidyInr > 0 &&
                  ` + State estimate: ₹${calculation.stateSubsidyInr.toLocaleString("en-IN")}`}
              </div>
            </div>

            <div className="bg-zinc-800/70 p-4 rounded-xl border border-zinc-700/60">
              <div className="text-[11px] text-zinc-400 font-medium">Net Consumer Out-of-Pocket</div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                ₹{calculation.netCustomerCostInr.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Gross cost: ₹{calculation.grossCostInr.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="bg-zinc-800/70 p-4 rounded-xl border border-zinc-700/60">
              <div className="text-[11px] text-zinc-400 font-medium">Estimated Payback Period</div>
              <div className="text-2xl font-black text-blue-400 mt-1">
                {calculation.paybackYears === null
                  ? "Not available"
                  : `${calculation.paybackYears} Years`}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Simple payback; bills may remain
              </div>
            </div>
          </div>

          {/* 25-Year Lifecycle ROI & Environmental Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-zinc-800/40 border border-zinc-700/60 rounded-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                📈 25-Year Cumulative Savings Estimate
              </h4>
              <div className="text-2xl font-black text-emerald-400">
                ₹{calculation.net25YearSavingsInr.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cumulative modeled savings after the estimated upfront cost, 0.7% annual panel
                degradation, and one inverter replacement in year 12.
              </p>
              <div className="flex items-center gap-4 text-xs pt-1 border-t border-zinc-800">
                <div>
                  <span className="text-zinc-500">Annual Savings: </span>
                  <span className="font-bold text-white">
                    ₹{calculation.annualSavingsInr.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Modeled export revenue: </span>
                  <span className="font-bold text-emerald-400">
                    ₹{calculation.annualExportRevenueInr.toLocaleString("en-IN")}/yr
                  </span>
                  <span className="block text-[10px] text-zinc-500">
                    At ₹{calculation.netMeteringExportRateInr.toFixed(2)}/kWh
                  </span>
                </div>
              </div>
              <div
                className="h-64 w-full"
                role="img"
                aria-label="Interactive line chart of cumulative net solar savings from year 1 to year 25"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={calculation.yearlyProjections}
                    margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
                  >
                    <CartesianGrid stroke="#3f3f46" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: "#a1a1aa", fontSize: 10 }}
                      tickLine={false}
                      tickFormatter={(year: number) => `Yr ${year}`}
                    />
                    <YAxis
                      width={58}
                      tick={{ fill: "#a1a1aa", fontSize: 10 }}
                      tickLine={false}
                      tickFormatter={(value: number) =>
                        `₹${new Intl.NumberFormat("en-IN", {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        }).format(value)}`
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        `₹${Number(value).toLocaleString("en-IN")}`,
                        "Cumulative net savings",
                      ]}
                      labelFormatter={(year) => `Year ${year}`}
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #52525b",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <ReferenceLine y={0} stroke="#a1a1aa" />
                    <Line
                      type="monotone"
                      dataKey="cumulativeNetSavingsInr"
                      name="Cumulative net savings"
                      stroke="#34d399"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <table className="sr-only">
                <caption>Annual cumulative net solar savings estimate</caption>
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Cumulative net savings (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.yearlyProjections.map((projection) => (
                    <tr key={projection.year}>
                      <td>{projection.year}</td>
                      <td>{projection.cumulativeNetSavingsInr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 bg-zinc-800/40 border border-zinc-700/60 rounded-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                🌱 Estimated Environmental Impact
              </h4>
              <div className="text-2xl font-black text-teal-400">
                {Math.round(calculation.co2AvoidedKgPerYear / 1000 * 10) / 10} Tonnes CO₂ / yr
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Based on estimated annual generation and the CEA grid emissions factor. Actual
                emissions avoided depend on local generation and system performance.
              </p>
            </div>
          </div>
          <p role="note" className="text-[11px] leading-relaxed text-zinc-400">
            Model assumptions: ₹6.80/kWh tariff, ₹60,000/kW system cost, 78% performance ratio,
            ₹2.25/kWh export credit, and 0.7% annual degradation. This is not a quotation,
            eligibility decision, bill-offset guarantee, or live tariff lookup; financing, upkeep,
            tariff changes, shading, and local rules can materially change results.
          </p>
        </div>
      )}
    </div>
  );
}
