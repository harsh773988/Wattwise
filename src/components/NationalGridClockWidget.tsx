"use client";

import { useState, useEffect } from "react";
import {
  getGridClockStatus,
  GridClockStatus,
} from "@/domain/nationalGridClock";

export function NationalGridClockWidget() {
  const [istTime, setIstTime] = useState<{ hour: number; minute: number }>({
    hour: 12,
    minute: 0,
  });
  const [status, setStatus] = useState<GridClockStatus>(getGridClockStatus(12, 0));

  // Keep live IST clock synced
  useEffect(() => {
    const updateTime = () => {
      // Calculate current Indian Standard Time (UTC + 5:30)
      const now = new Date();
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const istDate = new Date(utcTime + 5.5 * 3600000);
      const hour = istDate.getHours();
      const minute = istDate.getMinutes();

      setIstTime({ hour, minute });
      setStatus(getGridClockStatus(hour, minute));
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Time formatter for display
  const formattedIstTime = `${istTime.hour.toString().padStart(2, "0")}:${istTime.minute
    .toString()
    .padStart(2, "0")} IST`;
  const clockCircumference = 2 * Math.PI * 44;
  const currentDayProgress = (istTime.hour * 60 + istTime.minute) / (24 * 60);
  const clockStrokeColors = {
    green_solar: "stroke-emerald-400",
    evening_peak: "stroke-rose-400",
    morning_surge: "stroke-amber-400",
    night_offpeak: "stroke-blue-400",
  }[status.stressLevel];
  const solarCountdownHours = Math.floor(status.minutesUntilNextSolarWindow / 60);
  const solarCountdownMinutes = status.minutesUntilNextSolarWindow % 60;

  // Status visual styles
  const badgeColors = {
    green_solar: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    evening_peak: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    morning_surge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    night_offpeak: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  }[status.stressLevel];

  const pulseDotColors = {
    green_solar: "bg-emerald-400",
    evening_peak: "bg-rose-400",
    morning_surge: "bg-amber-400",
    night_offpeak: "bg-blue-400",
  }[status.stressLevel];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div
        className={`absolute -right-20 -top-20 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none ${
          status.isSolarWindow
            ? "bg-emerald-500"
            : status.isPeakStress
            ? "bg-rose-500"
            : "bg-blue-500"
        }`}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              National Grid Stress & Solar Clock
            </h3>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${badgeColors}`}
            >
              <span className={`w-2 h-2 rounded-full ${pulseDotColors} animate-ping`} />
              {status.label}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time Indian Standard Time (IST) alignment with Grid-India & CEA clean energy generation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <svg
            viewBox="0 0 100 100"
            className="w-[76px] h-[76px]"
            role="img"
            aria-label={`Current Indian Standard Time ${formattedIstTime}`}
          >
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-zinc-700"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              strokeWidth="5"
              strokeDasharray={clockCircumference}
              strokeDashoffset={clockCircumference * (1 - currentDayProgress)}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              className={`${clockStrokeColors} transition-[stroke-dashoffset] duration-500`}
            />
            <text
              x="50"
              y="48"
              textAnchor="middle"
              className="fill-white font-mono text-[16px] font-bold"
            >
              {formattedIstTime.slice(0, 5)}
            </text>
            <text
              x="50"
              y="64"
              textAnchor="middle"
              className="fill-zinc-400 text-[8px] font-semibold"
            >
              INDIA TIME
            </text>
          </svg>
          <div className="px-3 py-1.5 bg-zinc-800/80 rounded-xl border border-zinc-700/60 text-right">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Grid Carbon</div>
            <div className="text-xs font-bold text-emerald-400">
              {status.currentCarbonIntensityKgPerKwh} kg CO₂/kWh
            </div>
          </div>
        </div>
      </div>

      {/* Grid Timeline Bar */}
      <div className="my-5">
        <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5 font-medium">
          <span>06:00 (Morning Ramp)</span>
          <span className="text-emerald-400 font-bold">10:00–16:00 (Solar Hours ☀️)</span>
          <span className="text-rose-400 font-bold">18:00–22:00 (Peak Alert ⚡)</span>
          <span>22:00 (Night Off-Peak)</span>
        </div>

        {/* 24-Hour Progress Track */}
        <div className="relative h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
          <div className="w-[25%] bg-blue-500/40" title="Night Off-Peak (00:00-06:00)" />
          <div className="w-[16.6%] bg-amber-500/40" title="Morning Ramp (06:00-10:00)" />
          <div className="w-[25%] bg-emerald-500" title="Solar Window (10:00-16:00)" />
          <div className="w-[8.4%] bg-zinc-700" title="Intermediary (16:00-18:00)" />
          <div className="w-[16.6%] bg-rose-500" title="Evening Peak (18:00-22:00)" />
          <div className="w-[8.4%] bg-blue-500/40" title="Night Off-Peak (22:00-24:00)" />
        </div>

        <div className="mt-2 text-xs text-zinc-300 flex items-center justify-between">
          <span>{status.description}</span>
          {!status.isSolarWindow && status.minutesUntilNextSolarWindow > 0 && (
            <span className="text-emerald-400 font-semibold">
              ⏳ Next Solar Window in {solarCountdownHours > 0 ? `${solarCountdownHours}h ` : ""}
              {solarCountdownMinutes}m
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
