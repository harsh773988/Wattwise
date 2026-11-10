"use client";

import { useState } from "react";
import {
  calculateEvEconomics,
  POPULAR_INDIAN_EV_PRESETS,
  EvModelPreset,
} from "@/domain/evEconomics";

interface EvSavingsCalculatorProps {
  tariffPerKwh?: number;
}

export function EvSavingsCalculator({ tariffPerKwh = 6.8 }: EvSavingsCalculatorProps) {
  const [selectedPresetId, setSelectedPresetId] = useState("scooter_standard");
  const [dailyKm, setDailyKm] = useState(30);
  const [petrolPrice, setPetrolPrice] = useState(103.5);

  const preset: EvModelPreset =
    POPULAR_INDIAN_EV_PRESETS.find((p) => p.id === selectedPresetId) ||
    POPULAR_INDIAN_EV_PRESETS[0];

  const result = calculateEvEconomics(dailyKm, preset, petrolPrice, tariffPerKwh);

  return (
    <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 uppercase">
              Mission LiFE · Sustainable Mobility
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
            ⚡ EV Home Charging vs Petrol Calculator
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Compare running costs per km, annual savings, and daytime solar charging benefits.
          </p>
        </div>

        {/* Vehicle Preset Selector */}
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_INDIAN_EV_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPresetId(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedPresetId === p.id
                  ? "bg-emerald-500 text-zinc-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
              }`}
            >
              {p.type === "two_wheeler" ? "🛵 2-Wheeler" : p.type === "three_wheeler" ? "🛺 3-Wheeler" : "🚗 4-Wheeler"}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/60">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-zinc-300">Daily Commute Distance</span>
            <span className="font-bold text-emerald-400">{dailyKm} km / day</span>
          </div>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={dailyKm}
            onChange={(e) => setDailyKm(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
            <span>5 km</span>
            <span>60 km</span>
            <span>120 km</span>
          </div>
        </div>

        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/60">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-zinc-300">Petrol Price</span>
            <span className="font-bold text-amber-400">₹{petrolPrice.toFixed(1)} / Litre</span>
          </div>
          <input
            type="range"
            min={90}
            max={120}
            step={0.5}
            value={petrolPrice}
            onChange={(e) => setPetrolPrice(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
            <span>₹90/L</span>
            <span>₹105/L</span>
            <span>₹120/L</span>
          </div>
        </div>
      </div>

      {/* Results Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/60">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">EV Cost / Km</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">
            ₹{result.costPerKmEvInr}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">home grid charging</div>
        </div>

        <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/60">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Petrol Cost / Km</div>
          <div className="text-xl font-bold text-rose-400 mt-0.5">
            ₹{result.costPerKmPetrolInr}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">ice engine fuel</div>
        </div>

        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
          <div className="text-[10px] text-emerald-300 uppercase font-semibold">Annual Savings</div>
          <div className="text-xl font-black text-emerald-300 mt-0.5">
            ₹{result.annualSavingsInr.toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">
            ~₹{result.monthlySavingsInr.toLocaleString("en-IN")} / month
          </div>
        </div>

        <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/60">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Annual CO₂ Cut</div>
          <div className="text-xl font-bold text-teal-400 mt-0.5">
            {result.annualCo2AvoidedKg} kg
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">clean tailpipe emissions</div>
        </div>
      </div>

      {/* Solar Charging Synergy Callout */}
      <div className="mt-4 p-3 bg-zinc-950/70 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-zinc-300">
        <span className="flex items-center gap-2">
          <span className="text-base">☀️</span>
          <span>
            <strong>Pro Tip:</strong> Charge your EV during <strong>Solar Green Hours (10:00–16:00)</strong> with rooftop solar to cut your commute fuel cost to <strong>₹0.00</strong>!
          </span>
        </span>
      </div>
    </div>
  );
}

