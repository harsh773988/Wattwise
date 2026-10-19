"use client";

import { useState } from "react";
import type { Assumptions } from "@/domain/types";
import {
  DEFAULT_ASSUMPTIONS,
  EMISSION_FACTOR_KG_PER_KWH,
  EMISSION_FACTOR_SOURCE,
} from "@/lib/config";

interface AssumptionsPanelProps {
  assumptions: Assumptions;
  onChange: (updated: Assumptions) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function AssumptionsPanel({
  assumptions,
  onChange,
  isOpen,
  onClose,
}: AssumptionsPanelProps) {
  const [tariff, setTariff] = useState(assumptions.tariffPerKwh);
  const [emission, setEmission] = useState(assumptions.emissionFactor);
  const [multiplier, setMultiplier] = useState(assumptions.spikeMultiplier);

  if (!isOpen) return null;

  const handleApply = () => {
    onChange({
      tariffPerKwh: Math.max(0.1, Number(tariff)),
      emissionFactor: Math.max(0.01, Number(emission)),
      spikeMultiplier: Math.max(1.05, Number(multiplier)),
    });
    onClose();
  };

  const handleReset = () => {
    setTariff(DEFAULT_ASSUMPTIONS.tariffPerKwh);
    setEmission(DEFAULT_ASSUMPTIONS.emissionFactor);
    setMultiplier(DEFAULT_ASSUMPTIONS.spikeMultiplier);
    onChange(DEFAULT_ASSUMPTIONS);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assumptions-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="neo-card p-6 bg-white max-w-md w-full shadow-[6px_6px_0px_0px_#000]">
        <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
          <h3 id="assumptions-title" className="font-black text-xl text-black">
            Calculation Assumptions
          </h3>
          <button
            onClick={onClose}
            aria-label="Close calculation assumptions dialog"
            className="w-8 h-8 border-2 border-black font-black flex items-center justify-center bg-gray-100 hover:bg-black hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-black/70 font-medium mb-5">
          All financial and carbon models recalculate instantly when you adjust these parameters.
        </p>

        <div className="space-y-5">
          {/* Tariff */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label htmlFor="tariff-input" className="text-xs font-black uppercase text-black">
                Electricity Tariff (₹ per kWh)
              </label>
              <span className="text-sm font-black text-black bg-[#ffe17c] px-2 py-0.5 border border-black">
                ₹{tariff}
              </span>
            </div>
            <input
              id="tariff-input"
              type="number"
              min="1"
              max="25"
              step="0.5"
              value={tariff}
              onChange={(e) => setTariff(parseFloat(e.target.value) || 0)}
              className="neo-input text-sm"
            />
            <p className="text-[11px] text-black/60 mt-1 font-medium">
              Varies by Indian state & slab (e.g. ₹4.5 in Delhi, ₹8.5 in Maharashtra). Default: ₹7.
            </p>
          </div>

          {/* Grid Emission Factor */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label htmlFor="emission-input" className="text-xs font-black uppercase text-black">
                Grid Emission Factor (kg CO₂/kWh)
              </label>
              <span className="text-sm font-black text-black bg-[#b7c6c2] px-2 py-0.5 border border-black">
                {emission} kg
              </span>
            </div>
            <input
              id="emission-input"
              type="number"
              min="0.1"
              max="2.0"
              step="0.01"
              value={emission}
              onChange={(e) => setEmission(parseFloat(e.target.value) || 0)}
              className="neo-input text-sm"
            />
            <p className="text-[11px] text-black/60 mt-1 font-medium">
              Source: {EMISSION_FACTOR_SOURCE}. Default: {EMISSION_FACTOR_KG_PER_KWH} kg CO₂/kWh.
              Change the factor above or in src/lib/config.ts.
            </p>
          </div>

          {/* Spike Threshold Multiplier */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label htmlFor="multiplier-input" className="text-xs font-black uppercase text-black">
                Spike Detection Multiplier
              </label>
              <span className="text-sm font-black text-black bg-[#ff5a5a] text-white px-2 py-0.5 border border-black">
                {multiplier}x avg
              </span>
            </div>
            <input
              id="multiplier-input"
              type="number"
              min="1.1"
              max="3.0"
              step="0.1"
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value) || 0)}
              className="neo-input text-sm"
            />
            <p className="text-[11px] text-black/60 mt-1 font-medium">
              Days consuming &gt; {multiplier}x the average are flagged as anomaly spikes. Default: 1.5x.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-bold text-black/70 hover:text-black underline"
          >
            Reset Defaults
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="neo-btn bg-white text-black text-xs px-3 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="neo-btn bg-[#ffe17c] text-black text-xs px-4 py-2"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
