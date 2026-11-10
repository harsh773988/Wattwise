"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MISSION_LIFE_THEMES,
  NATIONAL_QUESTS_CATALOG,
  LifePillar,
  NationalLifeQuest,
} from "@/domain/nationalLifeQuests";
import { NationalGreenPassport } from "./NationalGreenPassport";

export function MissionLifeQuestHub() {
  const [selectedPillar, setSelectedPillar] = useState<LifePillar>("energy");
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [photoProofName, setPhotoProofName] = useState<{ [id: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [submittingQuestId, setSubmittingQuestId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [challengesResponse, rewardsResponse] = await Promise.all([
        fetch(`/api/challenges/today?profileId=default&date=${today}`, { cache: "no-store" }),
        fetch("/api/me/rewards?profileId=default&spaceId=default", { cache: "no-store" }),
      ]);
      const [challengesJson, rewardsJson] = await Promise.all([
        challengesResponse.json(),
        rewardsResponse.json(),
      ]);
      if (!challengesResponse.ok || !rewardsResponse.ok) {
        const message =
          challengesJson?.error?.message ??
          rewardsJson?.error?.message ??
          "Could not load your Mission LiFE progress.";
        throw new Error(message);
      }

      setCompletedQuestIds(challengesJson.data?.completedChallengeIds ?? []);
      setPointsEarned(rewardsJson.data?.points ?? 0);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not load your Mission LiFE progress.";
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => void loadProgress(), 0);
    return () => window.clearTimeout(timerId);
  }, [loadProgress]);

  const filteredQuests = NATIONAL_QUESTS_CATALOG.filter(
    (q) => q.pillar === selectedPillar
  );

  const handleCompleteQuest = async (quest: NationalLifeQuest) => {
    if (completedQuestIds.includes(quest.id)) {
      toast.info("Quest already completed today!");
      return;
    }
    if (quest.verificationType === "photo_evidence" && !photoProofName[quest.id]) {
      toast.error("Attach a photo before submitting this quest.");
      return;
    }

    setSubmittingQuestId(quest.id);
    try {
      const response = await fetch("/api/challenges/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: "default",
          challengeId: quest.id,
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error?.message ?? "Could not record this quest.");
      }
      const pointsAwarded = json.data?.completion?.points_awarded ?? 0;
      setCompletedQuestIds((prev) => [...prev, quest.id]);
      setPointsEarned((prev) => prev + pointsAwarded);
      toast.success(`"${quest.title}" recorded. +${pointsAwarded} self-reported points.`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not record this quest.");
    } finally {
      setSubmittingQuestId(null);
    }
  };

  const handlePhotoUpload = (questId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Choose an image file for photo evidence.");
        e.target.value = "";
        return;
      }
      setPhotoProofName((prev) => ({ ...prev, [questId]: file.name }));
      toast.info(`Photo selected: ${file.name}`);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-1 border border-emerald-500/30">
            🇮🇳 OFFICIAL 7 PILLARS
          </div>
          <h2 className="text-xl font-black text-white">Mission LiFE National Action Hub</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Participate across seven ecological themes and keep a record of your daily actions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPassportOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <span>🌱 View Citizen Green Passport</span>
        </button>
      </div>

      {/* 7 Themes Horizontal Pills */}
      {loadError && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={() => void loadProgress()} className="rounded border border-rose-300 px-3 py-1 font-bold">
            Retry
          </button>
        </div>
      )}
      {!loadError && isLoading && (
        <p className="py-4 text-sm text-zinc-300" role="status">Loading your saved quest progress…</p>
      )}
      <div className="flex gap-2 overflow-x-auto py-4 scrollbar-none">
        {MISSION_LIFE_THEMES.map((theme) => {
          const isSelected = selectedPillar === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => setSelectedPillar(theme.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer ${
                isSelected
                  ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                  : "bg-zinc-800/80 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span>{theme.title}</span>
              <span className="text-[10px] opacity-75 font-normal">({theme.hindiTitle})</span>
            </button>
          );
        })}
      </div>

      {/* Quests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {filteredQuests.map((quest) => {
          const isCompleted = completedQuestIds.includes(quest.id);
          const hasPhotoProof = !!photoProofName[quest.id];

          return (
            <div
              key={quest.id}
              className={`p-4 rounded-xl border transition-all ${
                isCompleted
                  ? "bg-emerald-500/10 border-emerald-500/50"
                  : "bg-zinc-800/50 border-zinc-700/60 hover:border-zinc-600"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        quest.difficulty === "easy"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : quest.difficulty === "medium"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {quest.difficulty}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono font-bold">
                      Up to {quest.points} pts
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{quest.title}</h4>
                </div>

                {isCompleted && (
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center text-xs font-black">
                    ✓
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                {quest.description}
              </p>

              {/* Photo Evidence Bar if applicable */}
              {quest.verificationType === "photo_evidence" && (
                <div className="mt-3 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                    {hasPhotoProof ? `📷 ${photoProofName[quest.id]}` : "Requires Photo Evidence"}
                  </span>
                  <label className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer">
                    {hasPhotoProof ? "Change Photo" : "Select Photo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(quest.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">
                  Est. CO₂ cut: <strong>{quest.estimatedCo2SavingKg} kg</strong>
                </span>

                <button
                  type="button"
                disabled={
                  isCompleted ||
                  isLoading ||
                  !!loadError ||
                  submittingQuestId !== null ||
                  (quest.verificationType === "photo_evidence" && !hasPhotoProof)
                }
                onClick={() => void handleCompleteQuest(quest)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isCompleted ||
                  isLoading ||
                  !!loadError ||
                  submittingQuestId !== null ||
                  (quest.verificationType === "photo_evidence" && !hasPhotoProof)
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 cursor-pointer shadow-md shadow-emerald-500/20"
                }`}
                >
                {isCompleted
                  ? "Completed Today"
                  : submittingQuestId === quest.id
                  ? "Recording…"
                  : "Submit self-report"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 border-t border-zinc-800 pt-3 text-[11px] leading-relaxed text-zinc-400">
        Claims are self-reported and awarded at the app&apos;s capped self-report rate. Photo selections are only checked in this browser; they are not uploaded or independently verified.
      </p>

      {/* Citizen Green Passport Modal */}
      <NationalGreenPassport
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
        profile={{
          name: "WattWise participant",
          stateCode: "IN",
          totalPoints: pointsEarned,
          totalKwhSaved: 0,
          totalCo2AvoidedKg: 0,
          completedQuestsCount: completedQuestIds.length,
        }}
      />
    </div>
  );
}
