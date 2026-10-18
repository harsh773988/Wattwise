"use client";

import { useState, useMemo } from "react";
import type { Assumptions } from "@/domain/types";
import { projectSavings, PRESET_SCENARIOS, type WhatIfScenario } from "@/domain/whatif";
import { formatRupees, formatCo2 } from "@/domain/cost";

interface WhatIfSliderProps {
  assumptions: Assumptions;
}

export function WhatIfSlider({ assumptions }: WhatIfSliderProps) {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [inputValue, setInputValue] = useState(
    PRESET_SCENARIOS[0].defaultDailyKwh,
  );

  const currentScenario: WhatIfScenario = PRESET_SCENARIOS[selectedScenarioIndex];

  // Calculate actual daily savings based on scenario type
  const dailyKwh = useMemo(() => {
    switch (currentScenario.unit) {
      case "hours": // AC: 1.5 kWh per hour
        return inputValue * 1.5;
      case "minutes": // Geyser: ~0.05 kWh per min (3 kW element)
        return (inputValue / 60) * 3.0;
      case "bulbs": // LED vs incandescent: ~0.05 kWh per bulb/day
        return inputValue * 0.05;
      case "devices": // Unplugged standby: ~0.015 kWh per device/day
        return inputValue * 0.015;
      default:
        return inputValue;
    }
  }, [currentScenario, inputValue]);

  const projection = useMemo(() => {
    return projectSavings(
      `${currentScenario.label}: ${inputValue} ${currentScenario.unit}`,
      dailyKwh,
      assumptions,
    );
  }, [currentScenario, inputValue, dailyKwh, assumptions]);

  const handleScenarioChange = (idx: number) => {
    setSelectedScenarioIndex(idx);
    setInputValue(PRESET_SCENARIOS[idx].defaultDailyKwh);
  };

  return (
    <div className="neo-card p-5 bg-[#ffe17c]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-black text-lg text-black flex items-center gap-2">
            <span>What-If Savings Calculator</span>
            <span className="text-xs bg-white px-2 py-0.5 border border-black font-bold">
              Live Projection
            </span>
          </h3>
          <p className="text-xs text-black/80 font-medium">
            Simulate habit changes and see immediate monthly financial & carbon savings
          </p>
        </div>
      </div>

      {/* Preset Scenario Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {PRESET_SCENARIOS.map((scenario, idx) => (
          <button
            key={scenario.label}
            onClick={() => handleScenarioChange(idx)}
            className={`p-2.5 text-xs font-black border-2 border-black transition-all text-left ${
              selectedScenarioIndex === idx
                ? "bg-[#171e19] text-white shadow-[2px_2px_0px_0px_#000]"
                : "bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000]"
            }`}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      {/* Interactive Slider */}
      <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_#000] mb-5">
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="whatif-slider"
            className="text-xs font-black uppercase text-black"
          >
            {currentScenario.label}
          </label>
          <span className="text-sm font-black text-black bg-[#ffe17c] px-2.5 py-0.5 border border-black">
            {inputValue} {currentScenario.unit}
          </span>
        </div>

        <input
          id="whatif-slider"
          type="range"
          min={currentScenario.min}
          max={currentScenario.max}
          step={currentScenario.step}
          value={inputValue}
          onChange={(e) => setInputValue(parseFloat(e.target.value))}
          className="w-full accent-[#171e19] cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-bold text-black/60 mt-1">
          <span>{currentScenario.min} {currentScenario.unit}</span>
          <span>Reduces ~{dailyKwh.toFixed(2)} kWh/day</span>
          <span>{currentScenario.max} {currentScenario.unit}</span>
        </div>
      </div>

      {/* Live Projected Savings Output */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border-2 border-black p-3.5 shadow-[2px_2px_0px_0px_#000]">
          <div className="text-[10px] font-black uppercase tracking-wider text-black/60 mb-0.5">
            Monthly Energy Saved
          </div>
          <div className="text-2xl font-black text-black">
            {projection.monthlySavingsKwh} <span className="text-xs font-bold">kWh</span>
          </div>
          <div className="text-[11px] font-semibold text-black/70 mt-1">
            ~{dailyKwh.toFixed(1)} kWh each day
          </div>
        </div>

        <div className="bg-[#171e19] text-white border-2 border-black p-3.5 shadow-[2px_2px_0px_0px_#000]">
          <div className="text-[10px] font-black uppercase tracking-wider text-[#ffe17c] mb-0.5">
            Monthly Cost Saved
          </div>
          <div className="text-2xl font-black text-[#ffe17c]">
            {formatRupees(projection.monthlySavingsRupees)}
          </div>
          <div className="text-[11px] font-semibold text-white/70 mt-1">
            @ ₹{assumptions.tariffPerKwh}/kWh tariff
          </div>
        </div>

        <div className="bg-[#b7c6c2] border-2 border-black p-3.5 shadow-[2px_2px_0px_0px_#000]">
          <div className="text-[10px] font-black uppercase tracking-wider text-black/70 mb-0.5">
            Monthly CO₂ Avoided
          </div>
          <div className="text-2xl font-black text-black">
            {formatCo2(projection.monthlySavingsCo2Kg)}
          </div>
          <div className="text-[11px] font-semibold text-black/80 mt-1">
            @ {assumptions.emissionFactor} kg CO₂/kWh
          </div>
        </div>
      </div>
    </div>
  );
}
