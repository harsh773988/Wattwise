"use client";

import { useEffect, useState } from "react";

interface CommunityGoal {
  id: string;
  title: string;
  targetKwh: number;
  savedKwh: number;
  participants: number;
  daysLeft: number;
  state: string;
}

// Realistic demo goal — in a real deployment this would come from /api/goals
function generateDemoGoal(): CommunityGoal {
  const saved = 2_847_312;
  const target = 5_000_000;
  return {
    id: "india-nov-2026",
    title: "November Green Grid Challenge",
    targetKwh: target,
    savedKwh: saved,
    participants: 184_291,
    daysLeft: 21,
    state: "India",
  };
}

export function CommunityGoalBanner() {
  const [goal] = useState<CommunityGoal>(() => generateDemoGoal());
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const target = Math.min(100, Math.round((goal.savedKwh / goal.targetKwh) * 100));
    let frame = 0;
    const interval = setInterval(() => {
      frame += 2;
      setAnimatedPct(Math.min(frame, target));
      if (frame >= target) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [goal.savedKwh, goal.targetKwh]);

  const pct = Math.min(100, Math.round((goal.savedKwh / goal.targetKwh) * 100));
  const remaining = goal.targetKwh - goal.savedKwh;

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(2)} M`
      : n >= 1_000
      ? `${(n / 1_000).toFixed(1)} k`
      : n.toString();

  return (
    <div className="bg-zinc-950 border-2 border-emerald-500/30 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              🇮🇳 National Goal · {goal.state}
            </div>
            <h3 className="text-lg font-black">{goal.title}</h3>
          </div>

          <div className="flex items-center gap-4 text-center">
            <div>
              <div className="text-xl font-black text-emerald-400">{fmt(goal.savedKwh)} kWh</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Saved Together</div>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div>
              <div className="text-xl font-black text-white">{goal.participants.toLocaleString("en-IN")}</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Citizens Active</div>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div>
              <div className="text-xl font-black text-amber-400">{goal.daysLeft}</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Days Left</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-zinc-400">Progress to target</span>
            <span className="text-emerald-400 font-black">{pct}%</span>
          </div>
          <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-green-300 rounded-full transition-all duration-100 relative"
              style={{ width: `${animatedPct}%` }}
            >
              <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Footer stats */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
          <span>
            Target:{" "}
            <span className="text-zinc-300 font-semibold">{fmt(goal.targetKwh)} kWh</span>
          </span>
          <span>
            Still needed:{" "}
            <span className="text-amber-400 font-semibold">{fmt(remaining)} kWh</span>
          </span>
          <span>
            CO₂ avoided:{" "}
            <span className="text-emerald-400 font-semibold">
              {fmt(Math.round(goal.savedKwh * 0.72))} kg
            </span>
          </span>
          <span className="text-zinc-600">Goal ID: {goal.id}</span>
        </div>
      </div>
    </div>
  );
}

