import type { Tip, Assumptions } from "@/domain/types";
import { formatRupees } from "@/domain/cost";

interface TipCardProps {
  tips: readonly Tip[];
  assumptions: Assumptions;
}

export function TipCard({ tips, assumptions }: TipCardProps) {
  const getCategoryBadge = (category: Tip["category"]) => {
    switch (category) {
      case "spike":
        return { label: "Spike Alert", bg: "bg-[#ff5a5a]", text: "text-white" };
      case "high-usage":
        return { label: "High Usage", bg: "bg-[#ffd14a]", text: "text-black" };
      case "consistency":
        return { label: "Pattern", bg: "bg-[#b7c6c2]", text: "text-black" };
      case "reduction":
        return { label: "Reduction", bg: "bg-[#ffe17c]", text: "text-black" };
      default:
        return { label: "Smart Habit", bg: "bg-white", text: "text-black" };
    }
  };

  return (
    <div className="neo-card p-5 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-black text-lg text-black">
            Smart Pattern Tips
          </h3>
          <p className="text-xs text-black/70 font-semibold">
            Actionable recommendations derived from your usage data
          </p>
        </div>
        <span className="text-xs font-black bg-[#ffe17c] px-2 py-1 border border-black shadow-[2px_2px_0px_0px_#000]">
          {tips.length} Tips
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tips.map((tip) => {
          const badge = getCategoryBadge(tip.category);
          const monthlyRupees =
            tip.potentialSavingsKwh * 30 * assumptions.tariffPerKwh;

          return (
            <div
              key={tip.id}
              className="p-4 border-2 border-black bg-[#fbfbf8] shadow-[3px_3px_0px_0px_#000] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 border border-black ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                  {tip.potentialSavingsKwh > 0 && (
                    <span className="text-xs font-black text-emerald-800">
                      Save ~{formatRupees(monthlyRupees)}/mo
                    </span>
                  )}
                </div>

                <h4 className="font-black text-sm text-black mb-1.5 leading-snug">
                  {tip.title}
                </h4>

                <p className="text-xs text-black/70 font-medium leading-relaxed">
                  {tip.description}
                </p>
              </div>

              {tip.potentialSavingsKwh > 0 && (
                <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[11px] font-bold text-black/80">
                  <span>Potential:</span>
                  <span>~{tip.potentialSavingsKwh.toFixed(1)} kWh/day</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
