"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  applianceTag?: string;
  estimatedKwhEffect: number;
}

interface ChallengeBoardProps {
  profileId?: string;
  appliances?: string[];
  compact?: boolean;
}

export function ChallengeBoard({
  profileId = "demo-profile",
  appliances = ["geyser", "washing machine", "ac"],
  compact = false,
}: ChallengeBoardProps) {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges/today?profileId=${encodeURIComponent(profileId)}&appliances=${encodeURIComponent(appliances.join(","))}`);
      if (!res.ok) throw new Error("Unable to load today's challenges");
      const json = await res.json();
      setChallenges(json.data?.challenges ?? []);
      setCompletedIds(json.data?.completedChallengeIds ?? []);
      setStreak(json.data?.streak ?? 0);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not load challenges");
    } finally {
      setLoading(false);
    }
  }, [appliances, profileId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadChallenges();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadChallenges]);

  const handleComplete = async (challengeId: string) => {
    try {
      const res = await fetch("/api/challenges/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          challengeId,
          date: new Date().toISOString().slice(0, 10),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message ?? "Challenge completion failed");
      }

      setCompletedIds((prev) => [...prev, challengeId]);
      toast.success("Challenge complete. Nice work.");
      await loadChallenges();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Challenge could not be recorded");
    }
  };

  if (loading) {
    return (
      <div className="neo-panel p-5 animate-pulse">
        <div className="h-4 w-36 bg-[#d7d7d7] border border-black mb-4" />
        <div className="space-y-3">
          <div className="h-20 border border-black bg-[#f5f5f5]" />
          <div className="h-20 border border-black bg-[#f5f5f5]" />
        </div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="neo-panel p-5 bg-[#f7f4d8]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-black uppercase">Daily challenges</p>
          <span className="bg-[#b7c6c2] border border-black px-2 py-1 text-[10px] font-black uppercase">{streak} day streak</span>
        </div>
        <p className="mt-3 text-sm font-medium text-black/75">No challenges are due today. Please check back tomorrow.</p>
      </div>
    );
  }

  return (
    <div className="neo-panel p-5 bg-[#fbfbf8]">
      <div className="flex items-center justify-between gap-2 mb-4">
        <p className="text-lg font-black uppercase">Daily challenges</p>
        <span className="bg-[#ffe17c] border border-black px-2 py-1 text-[10px] font-black uppercase">{streak} day streak</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {challenges.map((challenge) => {
          const done = completedIds.includes(challenge.id);
          return (
            <div
              key={challenge.id}
              className={`border border-black bg-white p-4 shadow-[3px_3px_0px_0px_#171e19] ${prefersReducedMotion ? "" : "transition-transform duration-150 hover:-translate-y-1"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-black uppercase bg-[#b7c6c2] border border-black px-2 py-1">
                  {challenge.difficulty}
                </span>
                <span className="text-[10px] font-black uppercase bg-[#ffe17c] border border-black px-2 py-1">
                  {challenge.points} pts
                </span>
              </div>
              <p className="mt-3 text-lg font-black uppercase">{challenge.title}</p>
              <p className="mt-2 text-sm font-medium text-black/75">{challenge.description}</p>
              <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-black uppercase">
                <span>{challenge.estimatedKwhEffect.toFixed(1)} kWh</span>
                <span>{challenge.applianceTag ?? "general"}</span>
              </div>
              <button
                type="button"
                disabled={done}
                onClick={() => void handleComplete(challenge.id)}
                className={`mt-4 w-full border border-black px-3 py-2 text-xs font-black uppercase ${done ? "bg-[#dfe7df] text-black/60 cursor-not-allowed" : "bg-[#171e19] text-white hover:bg-black"}`}
              >
                {done ? "Completed" : "Mark done"}
              </button>
            </div>
          );
        })}
      </div>
      {!compact && (
        <p className="mt-4 text-[11px] font-black uppercase text-black/70">Demo data • challenge completions are stored once per day</p>
      )}
    </div>
  );
}
