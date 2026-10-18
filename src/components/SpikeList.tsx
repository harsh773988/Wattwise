import type { Spike, Assumptions } from "@/domain/types";
import { formatRupees } from "@/domain/cost";

interface SpikeListProps {
  spikes: readonly Spike[];
  assumptions: Assumptions;
  onOpenAssumptions?: () => void;
}

export function SpikeList({ spikes, assumptions, onOpenAssumptions }: SpikeListProps) {
  if (spikes.length === 0) {
    return (
      <div className="neo-card p-5 bg-white h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-lg text-black flex items-center gap-2">
              Spike Days
              <span className="text-xs font-bold bg-[#b7c6c2] px-2 py-0.5 border border-black">
                0 detected
              </span>
            </h3>
          </div>
          <p className="text-sm text-black/70 font-medium">
            No consumption spikes detected above {assumptions.spikeMultiplier}x your average.
          </p>
        </div>
        <div className="mt-4 p-3 bg-gray-50 border border-black/20 text-xs text-black/60 font-semibold">
          Tip: You can tune the threshold multiplier in{" "}
          <button
            onClick={onOpenAssumptions}
            className="underline font-bold text-black"
          >
            Assumptions
          </button>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="neo-card p-5 bg-white h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-lg text-black flex items-center gap-2">
          Spike Days
          <span className="text-xs font-black bg-[#ff5a5a] text-white px-2 py-0.5 border border-black">
            {spikes.length} {spikes.length === 1 ? "day" : "days"}
          </span>
        </h3>
        <span className="text-xs font-bold text-black/60">
          &gt; {assumptions.spikeMultiplier}x avg
        </span>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-72 pr-1">
        {spikes.map((spike) => {
          const excessKwh = spike.kwh - spike.averageKwh;
          const excessCost = excessKwh * assumptions.tariffPerKwh;

          return (
            <div
              key={spike.date}
              className="p-3 border-2 border-black bg-[#fff5f5] shadow-[2px_2px_0px_0px_#000] flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-black text-sm text-black flex items-center gap-2">
                  <span>{spike.date}</span>
                  <span className="text-[10px] bg-[#ff5a5a] text-white font-black px-1.5 py-0.2 border border-black">
                    {spike.multiplier}x avg
                  </span>
                </div>
                <div className="text-xs font-semibold text-black/70 mt-0.5">
                  +{excessKwh.toFixed(1)} kWh above avg ({spike.averageKwh} kWh)
                </div>
              </div>

              <div className="text-right">
                <div className="font-black text-sm text-black">{spike.kwh} kWh</div>
                <div className="text-[11px] font-bold text-[#b51d1d]">
                  +{formatRupees(excessCost)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
