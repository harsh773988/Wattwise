"use client";

import {
  calculatePassportTier,
  CitizenPassportProfile,
} from "@/domain/nationalLifeQuests";

interface NationalGreenPassportProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CitizenPassportProfile;
}

export function NationalGreenPassport({
  isOpen,
  onClose,
  profile,
}: NationalGreenPassportProps) {
  if (!isOpen) return null;

  const badge = calculatePassportTier(profile);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-emerald-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-white flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          ✕
        </button>

        {/* Passport Header */}
        <div className="text-center pb-5 border-b border-zinc-800/80">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            🇮🇳 MISSION LiFE NATIONAL PASSPORT
          </div>
          <h2 className="text-2xl font-black tracking-tight">Citizen Green Passport</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Lifestyle for Environment · Citizen participation record
          </p>
        </div>

        {/* Passport Card Body */}
        <div className="my-6 p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-emerald-500/30 relative overflow-hidden space-y-4">
          <div className="absolute top-2 right-3 text-4xl opacity-10 font-black">
            LiFE
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
                Citizen Name
              </div>
              <div className="text-lg font-black text-white">{profile.name}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
                State / Region
              </div>
              <div className="text-sm font-bold text-emerald-400">{profile.stateCode}</div>
            </div>
          </div>

          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase">Recognition Tier</div>
              <div className="text-base font-extrabold text-amber-400 flex items-center gap-1.5">
                🏅 {badge.tier}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-400 uppercase">Total LiFE Points</div>
              <div className="text-base font-mono font-bold text-emerald-400">
                {profile.totalPoints} pts
              </div>
            </div>
          </div>

          {/* Environmental Equivalents */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 bg-zinc-950/60 rounded-lg border border-zinc-800 text-center">
              <div className="text-xl">🌳</div>
              <div className="text-base font-extrabold text-white mt-0.5">
                {badge.equivalentTreesPlanted}
              </div>
              <div className="text-[10px] text-zinc-400">Trees Equivalent Planted</div>
            </div>

            <div className="p-2.5 bg-zinc-950/60 rounded-lg border border-zinc-800 text-center">
              <div className="text-xl">⛏️</div>
              <div className="text-base font-extrabold text-white mt-0.5">
                {badge.coalAvoidedKg} kg
              </div>
              <div className="text-[10px] text-zinc-400">Thermal Coal Burning Avoided</div>
            </div>
          </div>

          {/* Verification Barcode / ID */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>PASSPORT ID: WATT-IN-{Math.abs(profile.name.length * 37 + 10928)}</span>
            <span className="text-emerald-500/80">SELF-REPORTED PARTICIPATION</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-xl text-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            🖨️ Print / Save PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-xs font-bold rounded-xl text-zinc-950 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
