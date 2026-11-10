"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { IndiaMapLeaderboard } from "@/components/IndiaMapLeaderboard";
import { CommunityGoalBanner } from "@/components/CommunityGoalBanner";

interface LeaderboardRow {
  id: string;
  name: string;
  type: string;
  rank: number;
  percentReduction: number;
  points: number;
  perPersonUsageKwh: number;
  baselineEstimated?: boolean;
  perPersonEstimated?: boolean;
}

interface Badge {
  id: string;
  title: string;
  description: string;
}

interface CommunityGoal {
  id: string;
  space_id: string;
  target_percent: number;
  period_start: string;
  period_end: string;
}

interface GoalProgress {
  progressPercent: number;
  remainingKwh: number;
  daysLeft: number;
  coveredDays: number;
  missingDays: number;
}

export default function CommunityPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [baselineEstimated, setBaselineEstimated] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState("default");
  const [goal, setGoal] = useState<CommunityGoal | null>(null);
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [targetPercent, setTargetPercent] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leaderboardResponse, rewardsResponse, goalsResponse] = await Promise.all([
        fetch(`/api/leaderboard?spaceId=${encodeURIComponent(selectedSpaceId)}&profileId=${encodeURIComponent(selectedSpaceId)}`),
        fetch(`/api/me/rewards?spaceId=${encodeURIComponent(selectedSpaceId)}&profileId=${encodeURIComponent(selectedSpaceId)}`),
        fetch(`/api/goals?spaceId=${encodeURIComponent(selectedSpaceId)}`),
      ]);
      if (!leaderboardResponse.ok || !rewardsResponse.ok || !goalsResponse.ok) {
        throw new Error("Unable to load community information");
      }
      const [leaderboardJson, rewardsJson, goalsJson] = await Promise.all([
        leaderboardResponse.json(),
        rewardsResponse.json(),
        goalsResponse.json(),
      ]);
      setRows(leaderboardJson.data?.leaderboard ?? []);
      setMyRank(leaderboardJson.data?.myRank ?? null);
      setPoints(rewardsJson.data?.points ?? 0);
      setStreak(rewardsJson.data?.streak ?? 0);
      setBadges(rewardsJson.data?.badges ?? []);
      setBaselineEstimated(goalsJson.data?.baselineEstimated ?? false);
      setGoal(goalsJson.data?.activeGoal ?? null);
      setProgress(goalsJson.data?.progress ?? null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to load community information");
    } finally {
      setLoading(false);
    }
  }, [selectedSpaceId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [loadData]);

  const loadDemoCommunities = async () => {
    try {
      const response = await fetch("/api/communities/demo", { method: "POST" });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error?.message ?? "Could not load demo communities");
      toast.success(`${json.data.communitiesCreated} demo communities ready`);
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not load demo communities");
    }
  };

  const createGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingGoal(true);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: selectedSpaceId,
          targetPercent: Number(targetPercent),
          periodStart,
          periodEnd,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error?.message ?? "Could not create goal");
      toast.success("Community goal created");
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not create goal");
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf8]">
      <Navbar currentSpaceId={selectedSpaceId} onSpaceChange={setSelectedSpaceId} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-black/70">Community progress</p>
            <h1 className="mt-2 text-3xl font-black text-black sm:text-4xl">Community impact</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-black/75">
              Communities are ranked by percent reduction from baseline, not total electricity use. Estimates are labelled.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadDemoCommunities()}
            className="neo-btn min-h-11 bg-[#ffe17c] px-4 py-2 text-xs text-black sm:text-sm"
          >
            Load demo communities
          </button>
        </div>

        <div className="mb-6">
          <CommunityGoalBanner />
        </div>

        <div className="mb-8">
          <IndiaMapLeaderboard />
        </div>

        <section aria-labelledby="leaderboard-title" className="neo-panel mb-7 bg-white p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="leaderboard-title" className="text-xl font-black uppercase">Community leaderboard</h2>
            <span className="border border-black bg-[#ffe17c] px-2 py-1 text-[10px] font-black uppercase">Demo data clearly marked</span>
          </div>
          {myRank !== null && <p className="mb-3 text-sm font-black uppercase">Your community rank: #{myRank}</p>}
          {loading ? (
            <div className="space-y-3" aria-label="Loading leaderboard">
            <div className="h-14 animate-pulse motion-reduce:animate-none border-2 border-black bg-[#f0f0ec]" />
            <div className="h-14 animate-pulse motion-reduce:animate-none border-2 border-black bg-[#f0f0ec]" />
            <div className="h-14 animate-pulse motion-reduce:animate-none border-2 border-black bg-[#f0f0ec]" />
            </div>
          ) : rows.length === 0 ? (
            <div className="border-2 border-dashed border-black p-6 text-center">
              <p className="font-black uppercase">No community data yet</p>
              <p className="mt-1 text-sm font-medium">Load clearly labelled demo communities to preview the leaderboard.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {rows.map((row) => (
                  <article key={row.id} className="border-2 border-black bg-[#fbfbf8] p-4 shadow-[3px_3px_0px_0px_#171e19]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase">#{row.rank} · {row.type}</p>
                        <h3 className="mt-1 text-lg font-black">{row.name}</h3>
                      </div>
                      <p className="text-lg font-black">{row.percentReduction.toFixed(1)}%</p>
                    </div>
                    <div className="mt-3 flex justify-between border-t border-black pt-2 text-xs font-bold">
                      <span>{row.points} points</span>
                      <span>{row.perPersonUsageKwh.toFixed(1)} kWh/person{row.perPersonEstimated ? " · Estimate" : ""}</span>
                    </div>
                    {row.baselineEstimated && <p className="mt-2 text-[10px] font-black uppercase">Baseline: Estimate</p>}
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-black text-xs font-black uppercase">
                      <th className="p-3">Rank</th>
                      <th className="p-3">Community</th>
                      <th className="p-3">Reduction</th>
                      <th className="p-3">Points</th>
                      <th className="p-3">Usage/person</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-black/25">
                        <td className="p-3 font-black">#{row.rank}</td>
                        <td className="p-3 font-bold">{row.name}<span className="ml-2 text-xs uppercase text-black/60">{row.type}</span>{row.baselineEstimated && <span className="ml-2 text-[10px] font-black uppercase">Estimate</span>}</td>
                        <td className="p-3 font-black">{row.percentReduction.toFixed(1)}%</td>
                        <td className="p-3 font-bold">{row.points}</td>
                        <td className="p-3 font-bold">{row.perPersonUsageKwh.toFixed(1)} kWh{row.perPersonEstimated ? " · Estimate" : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="neo-panel bg-[#b7c6c2] p-5 sm:p-6">
            <h2 className="text-xl font-black uppercase">Your community goal</h2>
            {goal && progress ? (
              <div className="mt-4">
                <p className="font-bold">{goal.target_percent}% reduction · {goal.period_start} to {goal.period_end}</p>
                {baselineEstimated && <p className="mt-1 text-xs font-black uppercase">Baseline: Estimate</p>}
                <div
                  className="mt-3 h-7 border-2 border-black bg-white"
                  role="progressbar"
                  aria-label="Community goal progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress.progressPercent}
                >
                  <div className="h-full bg-[#ffe17c] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress.progressPercent}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs font-black uppercase">
                  <span>{progress.progressPercent.toFixed(1)}% complete</span>
                  <span>{progress.remainingKwh.toFixed(1)} kWh remaining</span>
                  <span>{progress.daysLeft} days left</span>
                </div>
                {progress.missingDays > 0 && <p className="mt-2 text-xs font-bold">Readings available for {progress.coveredDays} days; unrecorded days are not counted as savings.</p>}
              </div>
            ) : (
              <p className="mt-3 text-sm font-medium">There is no active goal for this community yet. Create one to track progress.</p>
            )}

            <form onSubmit={createGoal} className="mt-5 grid gap-3 border-t-2 border-black pt-4 sm:grid-cols-2">
              <label className="text-xs font-black uppercase">
                Target reduction (%)
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  required
                  value={targetPercent}
                  onChange={(event) => setTargetPercent(event.target.value)}
                  className="mt-1 min-h-11 w-full border-2 border-black bg-white px-3 text-sm font-bold"
                />
              </label>
              <span className="hidden sm:block" />
              <label className="text-xs font-black uppercase">
                Start date
                <input
                  type="date"
                  required
                  value={periodStart}
                  onChange={(event) => setPeriodStart(event.target.value)}
                  className="mt-1 min-h-11 w-full border-2 border-black bg-white px-3 text-sm font-bold"
                />
              </label>
              <label className="text-xs font-black uppercase">
                End date
                <input
                  type="date"
                  required
                  value={periodEnd}
                  onChange={(event) => setPeriodEnd(event.target.value)}
                  className="mt-1 min-h-11 w-full border-2 border-black bg-white px-3 text-sm font-bold"
                />
              </label>
              <button
                type="submit"
                disabled={savingGoal}
                className="neo-btn min-h-11 bg-[#171e19] px-4 py-2 text-xs text-white disabled:opacity-60 sm:col-span-2"
              >
                {savingGoal ? "Saving…" : "Create a goal"}
              </button>
            </form>
          </div>

          <div className="neo-panel bg-white p-5 sm:p-6">
            <h2 className="text-xl font-black uppercase">Your rewards</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="border-2 border-black bg-[#ffe17c] p-3 shadow-[3px_3px_0px_0px_#171e19]">
                <p className="text-xs font-black uppercase">Points</p>
                <p className="mt-1 text-2xl font-black">{points}</p>
              </div>
              <div className="border-2 border-black bg-[#b7c6c2] p-3 shadow-[3px_3px_0px_0px_#171e19]">
                <p className="text-xs font-black uppercase">Streak</p>
                <p className="mt-1 text-2xl font-black">{streak} days</p>
              </div>
            </div>
            <h3 className="mt-5 text-sm font-black uppercase">Badges</h3>
            {badges.length === 0 ? (
              <p className="mt-2 border border-dashed border-black p-3 text-sm font-medium">Record validated reductions or complete actions to earn badges.</p>
            ) : (
              <ul className="mt-2 grid gap-2">
                {badges.map((badge) => (
                  <li key={badge.id} className="border border-black bg-[#f5f4e8] p-3">
                    <p className="font-black">{badge.title}</p>
                    <p className="text-xs font-medium text-black/70">{badge.description}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-[11px] font-medium text-black/70">
              Measured reductions earn the primary points. Self-reported challenges are secondary and capped each day.
              {baselineEstimated ? " Points and progress use an assumed baseline estimate until a baseline is configured." : ""}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
