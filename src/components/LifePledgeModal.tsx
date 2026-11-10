"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  OFFICIAL_PLEDGE_COMMITMENTS,
  createCitizenPledge,
  CitizenPledgeRecord,
} from "@/domain/lifePledge";
import { STATE_DISCOM_REGISTRY } from "@/domain/nationalTariff";

interface LifePledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPledgeTaken?: (points: number) => void;
}

export function LifePledgeModal({
  isOpen,
  onClose,
  onPledgeTaken,
}: LifePledgeModalProps) {
  const [name, setName] = useState("");
  const [stateCode, setStateCode] = useState("MH");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    OFFICIAL_PLEDGE_COMMITMENTS.map((c) => c.id)
  );
  const [pledgeRecord, setPledgeRecord] = useState<CitizenPledgeRecord | null>(null);

  if (!isOpen) return null;

  const toggleCommitment = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleTakePledge = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const record = createCitizenPledge(name, stateCode, selectedIds);
      setPledgeRecord(record);
      toast.success("Congratulations! Mission LiFE Citizen Pledge Certificate generated!");
      if (onPledgeTaken) onPledgeTaken(record.pointsAwarded);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error taking pledge");
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-950 border-2 border-emerald-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-white flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          ✕
        </button>

        {!pledgeRecord ? (
          /* Pledge Commitment Form */
          <form onSubmit={handleTakePledge} className="flex-1 overflow-y-auto space-y-5 pr-1">
            <div className="text-center pb-3 border-b border-zinc-800">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
                🇮🇳 GOVT. OF INDIA INITIATIVE
              </div>
              <h2 className="text-2xl font-black">Official Mission LiFE Pledge</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Commit to pro-planet habits and earn your verified Citizen Pledge Certificate.
              </p>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2.5 text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Your State / UT
                </label>
                <select
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2.5 text-xs font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {STATE_DISCOM_REGISTRY.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5 Commitments */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Select Your Pledges
              </label>

              {OFFICIAL_PLEDGE_COMMITMENTS.map((c) => {
                const isChecked = selectedIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    onClick={() => toggleCommitment(c.id)}
                    className={`block p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? "bg-emerald-500/10 border-emerald-500/50 text-zinc-100"
                        : "bg-zinc-900/40 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-white">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="accent-emerald-500 rounded"
                      />
                      <span>{c.title}</span>
                      <span className="text-[10px] text-zinc-400 font-normal">({c.hindiTitle})</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 pl-5 leading-relaxed">
                      {c.description}
                    </p>
                  </label>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={!name.trim() || selectedIds.length === 0}
              className={`w-full py-3 text-xs font-extrabold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                name.trim() && selectedIds.length > 0
                  ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <span>🌿 Take Pledge & Generate Certificate (+50 Points)</span>
            </button>
          </form>
        ) : (
          /* Certificate Preview Card */
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border-2 border-emerald-500/50 rounded-2xl text-center space-y-4 relative shadow-2xl">
              <div className="text-xs uppercase tracking-[0.25em] text-emerald-400 font-bold">
                CERTIFICATE OF COMMITMENT
              </div>

              <div className="text-xl font-black text-white">
                Lifestyle for Environment (Mission LiFE)
              </div>

              <p className="text-xs text-zinc-400 italic">This is proudly presented to</p>

              <div className="text-2xl font-black text-emerald-300 tracking-wide underline underline-offset-8 decoration-emerald-500/50">
                {pledgeRecord.citizenName}
              </div>

              <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed pt-2">
                For pledging to lead an environmentally conscious lifestyle, conserving electricity,
                shifting energy demand to solar hours, and championing climate action in <strong>{pledgeRecord.stateCode}</strong>.
              </p>

              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>CERTIFICATE ID: {pledgeRecord.certificateId}</span>
                <span>DATE: {pledgeRecord.pledgeDate}</span>
                <span className="text-emerald-400 font-bold">+50 PTS AWARDED</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrintCertificate}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-xl text-zinc-200 transition-colors cursor-pointer"
              >
                🖨️ Print Certificate
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-xs font-extrabold rounded-xl text-zinc-950 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

