"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { analyze24HourTelemetry } from "@/domain/smartMeterTelemetry";

interface SmartMeterTelemetryViewProps {
  dailyKwh?: number;
  tariffPerKwh?: number;
}

export function SmartMeterTelemetryView({
  dailyKwh = 11.5,
  tariffPerKwh = 6.8,
}: SmartMeterTelemetryViewProps) {
  const [hasSolar, setHasSolar] = useState(false);

  const analysis = analyze24HourTelemetry(dailyKwh, tariffPerKwh, hasSolar);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      {/* Title & Solar Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 uppercase">
              AMI / RDSS Smart Meter Telemetry
            </span>
            <span className="text-xs text-zinc-400">24-Hour Interval Load Curve</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
            Live 24-Hour Smart Meter Telemetry
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Hourly power demand curve highlighting grid peak collision and continuous vampire base load.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60">
            <input
              type="checkbox"
              checked={hasSolar}
              onChange={(e) => setHasSolar(e.target.checked)}
              className="accent-emerald-500 rounded cursor-pointer"
            />
            <span>Simulate Rooftop Solar</span>
          </label>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/50">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Peak Demand</div>
          <div className="text-lg font-black text-rose-400 mt-0.5">
            {analysis.peakDemandKw} kW
          </div>
          <div className="text-[11px] text-zinc-500">at {analysis.peakDemandHour}:00 hrs</div>
        </div>

        <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/50">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Peak Hours Draw</div>
          <div className="text-lg font-black text-amber-400 mt-0.5">
            {analysis.peakHoursKwh} kWh
          </div>
          <div className="text-[11px] text-zinc-500">18:00 – 22:00 window</div>
        </div>

        <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/50">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">24/7 Vampire Load</div>
          <div className="text-lg font-black text-blue-400 mt-0.5">
            {Math.round(analysis.baseLoadKw * 1000)} W
          </div>
          <div className="text-[11px] text-zinc-500">
            {analysis.dailyVampireKwh} kWh / day standby
          </div>
        </div>

        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
          <div className="text-[10px] text-emerald-300 uppercase font-semibold">Vampire Savings</div>
          <div className="text-lg font-black text-emerald-400 mt-0.5">
            ₹{Math.round(analysis.potentialSavingsInrByKillingVampire)} / mo
          </div>
          <div className="text-[11px] text-emerald-400/80">by unplugging standby</div>
        </div>
      </div>

      {/* 24-Hour Load Curve Recharts AreaChart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={analysis.points as unknown as Record<string, unknown>[]}>
            <defs>
              <linearGradient id="telemetryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="timeLabel" stroke="#71717a" fontSize={11} />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              unit=" kW"
              domain={[0, "auto"]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs shadow-xl space-y-1">
                      <div className="font-bold text-white flex items-center justify-between gap-4">
                        <span>Time: {data.timeLabel}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            data.gridStatus === "green_solar"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : data.gridStatus === "evening_peak"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          {data.gridStatus}
                        </span>
                      </div>
                      <div className="text-emerald-400 font-mono font-bold">
                        Demand: {data.demandKw} kW ({data.energyKwh} kWh)
                      </div>
                      <div className="text-zinc-400">
                        Hourly Cost: ₹{data.estimatedCostInr} · Carbon: {data.carbonIntensityKg} kg/kWh
                      </div>
                      {data.isVampireBaseLoad && (
                        <div className="text-blue-400 text-[10px]">
                          ⚠️ Baseload phantom drain
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="demandKw"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#telemetryGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-400 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            10:00–16:00 (Solar Hours)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            18:00–22:00 (Evening Peak)
          </span>
        </div>
        <span>Total daily simulated energy: <strong>{analysis.totalKwh} kWh</strong></span>
      </div>
    </div>
  );
}

