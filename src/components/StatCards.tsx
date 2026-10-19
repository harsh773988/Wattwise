import type { SeriesStats, Assumptions } from "@/domain/types";
import { formatRupees, formatCo2 } from "@/domain/cost";
import { EMISSION_FACTOR_SOURCE } from "@/lib/config";

interface StatCardsProps {
  stats: SeriesStats;
  assumptions: Assumptions;
  onOpenAssumptions?: () => void;
}

export function StatCards({ stats, assumptions, onOpenAssumptions }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Consumption */}
      <div className="neo-card p-5 bg-white relative overflow-hidden">
        <div className="text-xs font-black uppercase tracking-wider text-black/60 mb-1">
          Total Consumption
        </div>
        <div className="text-3xl font-black text-black">
          {stats.totalKwh.toLocaleString()} <span className="text-base font-bold text-black/70">kWh</span>
        </div>
        <div className="mt-2 text-xs font-semibold text-black/70 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-black"></span>
          Avg {stats.averageKwh} kWh/day across {stats.days} days
        </div>
      </div>

      {/* Electricity Cost */}
      <div className="neo-card-yellow p-5 relative overflow-hidden">
        <div className="text-xs font-black uppercase tracking-wider text-black/70 mb-1 flex items-center justify-between">
          <span>Estimated Cost</span>
          <button
            onClick={onOpenAssumptions}
            className="text-[10px] font-black underline uppercase hover:text-black"
            title="Edit tariff in assumptions"
          >
            @ ₹{assumptions.tariffPerKwh}/kWh
          </button>
        </div>
        <div className="text-3xl font-black text-black">
          {formatRupees(stats.totalCostRupees)}
        </div>
        <div className="mt-2 text-xs font-semibold text-black/80">
          ₹{(stats.averageKwh * assumptions.tariffPerKwh).toFixed(1)}/day average
        </div>
      </div>

      {/* Carbon Footprint */}
      <div className="neo-card-sage p-5 relative overflow-hidden">
        <div className="text-xs font-black uppercase tracking-wider text-black/70 mb-1 flex items-center justify-between">
          <span>CO₂ Footprint</span>
          <span className="text-[10px] font-bold text-black/60">
            {assumptions.emissionFactor} kg/kWh
          </span>
        </div>
        <div className="text-3xl font-black text-black">
          {formatCo2(stats.totalCo2Kg)}
        </div>
        <div className="mt-2 text-xs font-semibold text-black/80">
          {EMISSION_FACTOR_SOURCE}
        </div>
      </div>

      {/* Peak & Range */}
      <div className="neo-card p-5 bg-[#fffae8] relative overflow-hidden">
        <div className="text-xs font-black uppercase tracking-wider text-black/60 mb-1">
          Daily Range
        </div>
        <div className="text-3xl font-black text-black">
          {stats.maxKwh} <span className="text-base font-bold text-black/70">kWh max</span>
        </div>
        <div className="mt-2 text-xs font-semibold text-black/70">
          Min {stats.minKwh} kWh • Ratio {(stats.maxKwh / (stats.minKwh || 1)).toFixed(1)}x
        </div>
      </div>
    </div>
  );
}
