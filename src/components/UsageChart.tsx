"use client";

import { useState, useMemo } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { Reading, Spike, Assumptions } from "@/domain/types";
import { downsampleToWeekly } from "@/domain/analytics";
import { formatRupees } from "@/domain/cost";
import { CHART_DOWNSAMPLE_THRESHOLD } from "@/lib/config";

interface UsageChartProps {
  readings: readonly Reading[];
  spikes: readonly Spike[];
  assumptions: Assumptions;
  averageKwh: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      date: string;
      kwh: number;
      isSpike: boolean;
      multiplier?: number;
    };
  }>;
  tariff: number;
}

function CustomTooltip({ active, payload, tariff }: ChartTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const cost = data.kwh * tariff;

    return (
      <div className="neo-card p-3 bg-white text-xs z-50">
        <p className="font-black text-sm mb-1">{data.date}</p>
        <p className="font-bold text-black flex items-center justify-between gap-4">
          <span>Usage:</span>
          <span className="text-base font-black">{data.kwh} kWh</span>
        </p>
        <p className="font-semibold text-black/70 flex items-center justify-between gap-4">
          <span>Cost:</span>
          <span>{formatRupees(cost)}</span>
        </p>
        {data.isSpike && (
          <div className="mt-2 bg-[#ff5a5a] text-white font-black px-2 py-0.5 border border-black text-[11px] inline-block">
            ⚡ Spike Day ({data.multiplier}x avg)
          </div>
        )}
      </div>
    );
  }
  return null;
}

export function UsageChart({
  readings,
  spikes,
  assumptions,
  averageKwh,
}: UsageChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const [viewMode, setViewMode] = useState<"daily" | "weekly">(
    readings.length > CHART_DOWNSAMPLE_THRESHOLD ? "weekly" : "daily",
  );

  const spikeDates = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of spikes) {
      map.set(s.date, s.multiplier);
    }
    return map;
  }, [spikes]);

  const chartData = useMemo(() => {
    const sourceReadings =
      viewMode === "weekly" ? downsampleToWeekly(readings) : readings;

    return sourceReadings.map((r) => {
      const isSpike = spikeDates.has(r.date);
      return {
        date: r.date,
        kwh: r.kwh,
        isSpike,
        multiplier: spikeDates.get(r.date),
        spikeKwh: isSpike ? r.kwh : 0,
        normalKwh: isSpike ? 0 : r.kwh,
      };
    });
  }, [readings, viewMode, spikeDates]);

  const spikeThreshold = averageKwh * assumptions.spikeMultiplier;

  return (
    <div className="neo-card p-5 bg-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-black tracking-tight text-black flex items-center gap-2">
            Electricity Usage Chart
            <span className="text-xs bg-[#ffe17c] px-2 py-0.5 border border-black font-bold">
              {viewMode === "daily" ? "Daily View" : "Weekly Aggregated"}
            </span>
          </h2>
          <p className="text-xs text-black/70 font-medium">
            Spike threshold: {spikeThreshold.toFixed(1)} kWh ({assumptions.spikeMultiplier}x avg of {averageKwh} kWh)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {readings.length > 14 && (
            <div className="flex border-2 border-black p-0.5 bg-gray-100 shadow-[2px_2px_0px_0px_#000]">
              <button
                onClick={() => setViewMode("daily")}
                className={`px-3 py-1 text-xs font-black transition-all ${
                  viewMode === "daily"
                    ? "bg-[#ffe17c] text-black border border-black"
                    : "text-black/60 hover:text-black"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setViewMode("weekly")}
                className={`px-3 py-1 text-xs font-black transition-all ${
                  viewMode === "weekly"
                    ? "bg-[#ffe17c] text-black border border-black"
                    : "text-black/60 hover:text-black"
                }`}
              >
                Weekly
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#000000"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              tickFormatter={(date) => {
                const parts = date.split("-");
                return `${parts[1]}/${parts[2]}`;
              }}
            />
            <YAxis
              stroke="#000000"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              unit=" kWh"
            />
            <Tooltip
              content={<CustomTooltip tariff={assumptions.tariffPerKwh} />}
              cursor={{ fill: "rgba(255, 225, 124, 0.3)" }}
            />
            {averageKwh > 0 && (
              <ReferenceLine
                y={averageKwh}
                stroke="#171e19"
                strokeDasharray="4 4"
                label={{
                  value: `Avg: ${averageKwh.toFixed(1)} kWh`,
                  position: "insideTopRight",
                  fill: "#171e19",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />
            )}
            {spikeThreshold > 0 && (
              <ReferenceLine
                y={spikeThreshold}
                stroke="#ff4a4a"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                label={{
                  value: `Spike: ${spikeThreshold.toFixed(1)} kWh`,
                  position: "insideTopLeft",
                  fill: "#ff4a4a",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />
            )}
            {/* Normal readings in Brand Yellow */}
            <Bar
              dataKey="normalKwh"
              fill="#ffd14a"
              stroke="#000000"
              strokeWidth={1.5}
              name="Regular Usage"
              radius={[2, 2, 0, 0]}
              isAnimationActive={!prefersReducedMotion}
            />
            {/* Spike readings in high-contrast red-orange */}
            <Bar
              dataKey="spikeKwh"
              fill="#ff5a5a"
              stroke="#000000"
              strokeWidth={2}
              name="Spike Usage"
              radius={[2, 2, 0, 0]}
              isAnimationActive={!prefersReducedMotion}
            />
            <Line
              type="monotone"
              dataKey="kwh"
              stroke="#171e19"
              strokeWidth={2}
              dot={{ fill: "#000", r: 3, stroke: "#fff", strokeWidth: 1 }}
              activeDot={{ r: 6, fill: "#ff5a5a", stroke: "#000", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-3 border-t border-black/10 text-xs font-bold text-black/80">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-[#ffd14a] border border-black inline-block"></span>
          <span>Normal Usage (kWh)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-[#ff5a5a] border border-black inline-block"></span>
          <span>Spike Day (&gt; {assumptions.spikeMultiplier}x average)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-[#171e19] border-t-2 border-dashed border-black inline-block"></span>
          <span>Average Line</span>
        </div>
      </div>
    </div>
  );
}
