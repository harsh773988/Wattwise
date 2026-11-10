"use client";

import { useState } from "react";
import {
  performHomeEnergyAudit,
  STANDARD_HOUSEHOLD_APPLIANCES,
  ApplianceProfileItem,
} from "@/domain/applianceAudit";

interface HomeEnergyAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tariffPerKwh?: number;
}

export function HomeEnergyAuditModal({
  isOpen,
  onClose,
  tariffPerKwh = 6.8,
}: HomeEnergyAuditModalProps) {
  const [appliances, setAppliances] = useState<ApplianceProfileItem[]>([
    ...STANDARD_HOUSEHOLD_APPLIANCES,
  ]);

  if (!isOpen) return null;

  const handleCountChange = (id: string, delta: number) => {
    setAppliances((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newCount = Math.max(0, item.count + delta);
          return { ...item, count: newCount };
        }
        return item;
      })
    );
  };

  const handleHoursChange = (id: string, hours: number) => {
    setAppliances((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, dailyUsageHours: Math.max(0, Math.min(24, hours)) };
        }
        return item;
      })
    );
  };

  const audit = performHomeEnergyAudit(appliances, tariffPerKwh);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-emerald-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
              🔍
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Virtual Home Energy Audit
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  Appliance Disaggregation
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Audit household appliances, identify power hogs, and calculate retrofit payback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Top Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Total Monthly Load</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">
                {audit.totalMonthlyKwh} kWh
              </div>
              <div className="text-[10px] text-zinc-500">~{audit.totalDailyKwh} kWh / day</div>
            </div>

            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Monthly Cost</div>
              <div className="text-lg font-bold text-white mt-0.5">
                ₹{audit.totalMonthlyCostInr.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-zinc-500">at ₹{tariffPerKwh}/unit</div>
            </div>

            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Highest Consumer</div>
              <div className="text-xs font-extrabold text-rose-400 mt-1 truncate">
                {audit.highestConsumerName}
              </div>
              <div className="text-[10px] text-zinc-500">primary power drain</div>
            </div>

            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
              <div className="text-[10px] text-emerald-300 uppercase font-semibold">Potential Savings</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">
                ₹{audit.totalPotentialMonthlySavingsInr.toLocaleString("en-IN")} / mo
              </div>
              <div className="text-[10px] text-emerald-400/80">via BLDC & Inverter retrofits</div>
            </div>
          </div>

          {/* Appliances Interactive List */}
          <div>
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
              Configure Your Home Appliances
            </h4>
            <div className="space-y-3">
              {audit.items.map((result) => {
                const app = appliances.find((a) => a.id === result.id)!;
                return (
                  <div
                    key={result.id}
                    className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{result.name}</span>
                        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                          {app.ratedWatts} W
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">
                        Consumes <strong>{result.monthlyKwh} kWh</strong> · ₹{result.monthlyCostInr}/mo (
                        <span className="text-emerald-400 font-semibold">{result.sharePercent}%</span> of bill)
                      </div>
                    </div>

                    {/* Quantity & Usage Hours Controls */}
                    <div className="flex items-center gap-4">
                      {/* Quantity */}
                      <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
                        <span className="text-[11px] text-zinc-400 mr-1">Qty:</span>
                        <button
                          type="button"
                          onClick={() => handleCountChange(result.id, -1)}
                          className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-white">{app.count}</span>
                        <button
                          type="button"
                          onClick={() => handleCountChange(result.id, 1)}
                          className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Daily Hours Slider */}
                      <div className="w-28">
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                          <span>Hours:</span>
                          <span className="font-bold text-white">{app.dailyUsageHours}h</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={24}
                          value={app.dailyUsageHours}
                          onChange={(e) => handleHoursChange(result.id, Number(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer h-1.5"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* High-ROI Recommended Upgrades */}
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
              💡 Recommended High-ROI Energy Efficiency Retrofits
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {audit.items
                .filter((i) => i.recommendedUpgrade)
                .map((i) => {
                  const up = i.recommendedUpgrade!;
                  return (
                    <div
                      key={i.id}
                      className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5"
                    >
                      <div className="font-bold text-xs text-white flex items-center justify-between">
                        <span>{up.upgradeTitle}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {up.paybackMonths} Months Payback
                        </span>
                      </div>
                      <div className="text-xs text-zinc-300">
                        Saves <strong>₹{up.monthlySavedInr}/month</strong> ({up.monthlySavedKwh} kWh)
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Equipment Investment: ₹{up.equipmentCostInr.toLocaleString("en-IN")}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}

