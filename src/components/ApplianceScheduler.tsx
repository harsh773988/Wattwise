"use client";

import { useState } from "react";
import {
  calculateApplianceShiftSavings,
  SHIFTABLE_APPLIANCES,
} from "@/domain/nationalGridClock";

const SOLAR_WINDOW = "10:00–16:00 IST";

export function ApplianceScheduler() {
  const [selectedApplianceId, setSelectedApplianceId] = useState("washing_machine");
  const [planConfirmed, setPlanConfirmed] = useState(false);

  const appliance =
    SHIFTABLE_APPLIANCES.find(({ id }) => id === selectedApplianceId) ??
    SHIFTABLE_APPLIANCES[0];
  const savings = calculateApplianceShiftSavings(appliance, 9.5, 6);

  return (
    <section
      aria-labelledby="appliance-scheduler-title"
      className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
    >
      <div className="flex flex-col gap-3 border-b border-zinc-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="appliance-scheduler-title" className="text-lg font-bold text-white">
            Appliance Solar-Shift Simulator
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Choose a load to compare estimated evening-peak and solar-window costs.
          </p>
        </div>
        <span className="self-start rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 sm:self-auto">
          Green hours: {SOLAR_WINDOW}
        </span>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {SHIFTABLE_APPLIANCES.filter(({ id }) => id !== "dishwasher").map((item) => {
          const selected = item.id === selectedApplianceId;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setSelectedApplianceId(item.id);
                setPlanConfirmed(false);
              }}
              className={`min-h-16 rounded-xl border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                selected
                  ? "border-emerald-400 bg-emerald-500/15 text-white"
                  : "border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              <span className="block text-sm font-bold">{item.name}</span>
              <span className="mt-1 block text-xs text-zinc-400">
                {item.consumptionKwh} kWh · {item.typicalDurationMinutes} min
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="text-[10px] font-semibold uppercase text-zinc-400">Evening peak estimate</p>
          <p className="mt-1 text-sm font-bold text-rose-300">₹{savings.currentRunCostInr} / run</p>
          <p className="mt-1 text-[11px] text-zinc-500">Assumed rate: ₹9.50/kWh</p>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-zinc-950/70 p-3">
          <p className="text-[10px] font-semibold uppercase text-zinc-400">Solar-hours estimate</p>
          <p className="mt-1 text-sm font-bold text-emerald-300">₹{savings.solarWindowCostInr} / run</p>
          <p className="mt-1 text-[11px] text-zinc-500">Assumed rate: ₹6.00/kWh</p>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="text-[10px] font-semibold uppercase text-emerald-300">Estimated per-run benefit</p>
          <p className="mt-1 text-sm font-extrabold text-white">
            ₹{savings.savingsInr} · {savings.carbonAvoidedKg} kg CO₂
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">Model estimate, not a utility quote</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-400">
          This creates a suggested time only; it does not control your appliance.
        </p>
        <button
          type="button"
          onClick={() => setPlanConfirmed(true)}
          className="min-h-11 rounded-lg border border-emerald-400 bg-emerald-500 px-4 text-xs font-black text-zinc-950 hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        >
          Suggest Green-Hours Run
        </button>
      </div>

      {planConfirmed && (
        <p className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-200" role="status">
          Plan suggestion: run your {appliance.name} between {SOLAR_WINDOW}. Estimated savings: ₹{savings.savingsInr} and {savings.carbonAvoidedKg} kg CO₂ for this run.
        </p>
      )}
    </section>
  );
}
