"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import type { AdminSummary } from "@/domain/admin";

const AdminTrendChart = dynamic(() => import("@/components/AdminTrendChart"), {
  loading: () => <div className="h-64 animate-pulse motion-reduce:animate-none border-2 border-black bg-[#f0f0ec] sm:h-80" />,
});

interface AdminApiSummary extends AdminSummary {
  readonly demoDataCommunityIds: readonly string[];
  readonly emissionsEstimate: boolean;
}

interface AdminApiPayload {
  readonly data?: AdminApiSummary;
  readonly error?: { readonly code: string; readonly message: string };
}

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function exportCommunities(
  summary: AdminApiSummary,
  communities: AdminApiSummary["communities"],
): void {
  const rows = [
    ["Community", "Type", "Total kWh", "Baseline kWh", "Net kWh saved", "CO2 saved kg", "Reduction percent", "Reading days", "Baseline estimated", "Data label"],
    ...communities.map((community) => [
      community.name,
      community.type,
      community.totalKwh,
      community.baselineKwh,
      community.kwhSaved,
      community.co2SavedKg,
      community.percentReduction,
      community.readingDays,
      community.baselineEstimated ? "Yes" : "No",
      summary.demoDataCommunityIds.includes(community.id) ? "Demo data" : "Recorded data",
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `wattwise-admin-communities-${summary.periodEnd}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminDashboard() {
  const [adminKey, setAdminKey] = useState("");
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [summary, setSummary] = useState<AdminApiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/summary", {
        headers: { "x-admin-key": key },
        cache: "no-store",
      });
      const payload: AdminApiPayload = await response.json();
      if (response.status === 401) {
        sessionStorage.removeItem("wattwise-admin-key");
        setSessionKey(null);
        setSummary(null);
        setError("That key was not accepted. Check it and try again.");
        return;
      }
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Could not load the regional summary.");
      }
      setSummary(payload.data);
      setSessionKey(key);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not load the regional summary.");
      sessionStorage.removeItem("wattwise-admin-key");
      setAdminKey(key);
      setSessionKey(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const storedKey = window.sessionStorage.getItem("wattwise-admin-key");
      setSessionKey(storedKey);
      setSessionChecked(true);
      if (storedKey) void loadSummary(storedKey);
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [loadSummary]);

  const unlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submittedKey = adminKey.trim();
    if (!submittedKey) return;
    window.sessionStorage.setItem("wattwise-admin-key", submittedKey);
    void loadSummary(submittedKey);
  };

  const lock = () => {
    window.sessionStorage.removeItem("wattwise-admin-key");
    setSessionKey(null);
    setSummary(null);
    setAdminKey("");
    setError(null);
  };
  const measuredCommunities = summary?.communities.filter((community) => community.readingDays > 0) ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-[#fbfbf8]">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-7">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-black/70">Mission LiFE · Administration</p>
          <h1 className="mt-2 text-3xl font-black text-black sm:text-4xl">Regional conservation</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-black/75">
            Aggregate community trends for the last 30 days. This view does not expose individual readings.
          </p>
        </div>

        {!sessionChecked ? (
          <div className="neo-panel animate-pulse motion-reduce:animate-none bg-white p-6" aria-label="Checking administrator access">
            <div className="h-6 w-48 bg-[#f0f0ec]" />
            <div className="mt-4 h-11 w-full bg-[#f0f0ec]" />
          </div>
        ) : !sessionKey && !loading ? (
          <section className="neo-panel mx-auto max-w-xl bg-[#ffe17c] p-5 sm:p-7" aria-labelledby="admin-lock-title">
            <h2 id="admin-lock-title" className="text-2xl font-black">Administrator access required</h2>
            <p className="mt-2 text-sm font-medium">
              Enter the shared administrator key configured by the site operator. The key is kept only for this browser session.
            </p>
            <form onSubmit={unlock} className="mt-5 grid gap-3">
              <label htmlFor="admin-key" className="text-xs font-black uppercase">Admin key</label>
              <input
                id="admin-key"
                type="password"
                autoComplete="current-password"
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                className="min-h-12 border-2 border-black bg-white px-3 text-sm font-bold"
              />
              <button type="submit" disabled={loading || adminKey.trim().length === 0} className="neo-btn min-h-12 bg-[#171e19] px-4 text-sm text-white disabled:opacity-60">
                {loading ? "Checking key…" : "Unlock regional view"}
              </button>
              {error && <p role="alert" className="border-2 border-black bg-white p-3 text-sm font-bold">{error}</p>}
            </form>
          </section>
        ) : loading && !summary ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading regional summary">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-28 animate-pulse motion-reduce:animate-none border-2 border-black bg-white shadow-[3px_3px_0px_0px_#171e19]" />
            ))}
          </div>
        ) : error && !summary ? (
          <section className="neo-panel mx-auto max-w-xl bg-[#ffe17c] p-5 sm:p-7">
            <h2 className="text-xl font-black">Unable to load regional summary</h2>
            <p role="alert" className="mt-2 text-sm font-bold">{error}</p>
            <form onSubmit={unlock} className="mt-4 grid gap-3">
              <label htmlFor="admin-key-retry" className="text-xs font-black uppercase">Admin key</label>
              <input id="admin-key-retry" type="password" autoComplete="current-password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} className="min-h-12 border-2 border-black bg-white px-3 text-sm font-bold" />
              <button type="submit" disabled={loading || adminKey.trim().length === 0} className="neo-btn min-h-12 bg-[#171e19] px-4 text-sm text-white disabled:opacity-60">Try again</button>
            </form>
          </section>
        ) : summary ? (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-black uppercase">Period: {summary.periodStart} – {summary.periodEnd}</p>
              <button type="button" onClick={lock} className="neo-btn min-h-11 bg-white px-4 text-xs text-black">Lock view</button>
            </div>
            {error && <p role="alert" className="mb-4 border-2 border-black bg-[#ffb7a8] p-3 text-sm font-bold">{error}</p>}
            <section aria-label="Regional summary statistics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <article className="neo-panel bg-[#ffe17c] p-4"><p className="text-xs font-black uppercase">Communities</p><p className="mt-2 text-3xl font-black">{summary.communityCount}</p></article>
              <article className="neo-panel bg-[#b7c6c2] p-4"><p className="text-xs font-black uppercase">Active users*</p><p className="mt-2 text-3xl font-black">{summary.activeUsers}</p></article>
              <article className="neo-panel bg-white p-4"><p className="text-xs font-black uppercase">Net kWh saved</p><p className="mt-2 text-3xl font-black">{summary.kwhSaved.toFixed(1)}</p></article>
              <article className="neo-panel bg-white p-4"><p className="text-xs font-black uppercase">CO₂ saved · Estimate</p><p className="mt-2 text-3xl font-black">{summary.co2SavedKg.toFixed(1)} kg</p></article>
              <article className="neo-panel bg-[#f5f4e8] p-4"><p className="text-xs font-black uppercase">Average reduction</p><p className="mt-2 text-3xl font-black">{summary.averagePercentReduction.toFixed(1)}%</p></article>
            </section>
            <p className="mt-3 text-xs font-medium text-black/70">*Active users are unique profiles with at least one completed challenge during this period. CO₂ values are estimates using a configured emissions factor.</p>

            <section className="neo-panel mt-7 bg-white p-4 sm:p-6" aria-labelledby="trend-title">
              <h2 id="trend-title" className="text-xl font-black uppercase">Regional reduction trend</h2>
              <p className="mb-3 text-xs font-medium text-black/70">Each date compares available community readings against the configured daily baselines. Missing readings are not counted.</p>
              <AdminTrendChart data={summary.trend} />
            </section>

            <section className="neo-panel mt-7 bg-white p-4 sm:p-6" aria-labelledby="communities-title">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="communities-title" className="text-xl font-black uppercase">Community performance</h2>
                  <p className="mt-1 text-xs font-medium text-black/70">Ranked by percent reduction from baseline, not total electricity use.</p>
                </div>
                <button type="button" onClick={() => exportCommunities(summary, measuredCommunities)} className="neo-btn min-h-11 bg-[#ffe17c] px-4 text-xs text-black" disabled={measuredCommunities.length === 0}>Export CSV</button>
              </div>
              {summary.demoDataCommunityIds.length > 0 && <p className="mb-3 inline-block border border-black bg-[#ffe17c] px-2 py-1 text-[10px] font-black uppercase">Demo data is included and labelled below</p>}
              {measuredCommunities.length === 0 ? (
                <div className="border-2 border-dashed border-black p-6 text-center">
                  <p className="font-black uppercase">No community data yet</p>
                  <p className="mt-1 text-sm font-medium">Community aggregates will appear when spaces and readings are available.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {measuredCommunities.map((community, index) => (
                      <article key={community.id} className="border-2 border-black bg-[#fbfbf8] p-4 shadow-[3px_3px_0px_0px_#171e19]">
                        <div className="flex items-start justify-between gap-2">
                          <div><p className="text-xs font-black uppercase">#{index + 1} · {community.type}</p><h3 className="mt-1 text-lg font-black">{community.name}</h3></div>
                          <p className="text-lg font-black">{community.percentReduction.toFixed(1)}%</p>
                        </div>
                        <p className="mt-2 text-xs font-bold">{community.kwhSaved.toFixed(1)} net kWh saved · {community.co2SavedKg.toFixed(1)} kg CO₂ estimate</p>
                        <p className="mt-1 text-xs font-medium">{community.totalKwh.toFixed(1)} kWh actual · {community.baselineKwh.toFixed(1)} kWh baseline · {community.readingDays} reading days</p>
                        <p className="mt-1 text-[10px] font-black uppercase">{summary.demoDataCommunityIds.includes(community.id) ? "Demo data" : "Recorded data"}{community.baselineEstimated ? " · Baseline: Estimate" : ""}</p>
                      </article>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead><tr className="border-b-2 border-black text-xs font-black uppercase"><th className="p-3">Rank</th><th className="p-3">Community</th><th className="p-3">Reduction</th><th className="p-3">Net saved</th><th className="p-3">CO₂ estimate</th><th className="p-3">Readings</th></tr></thead>
                      <tbody>{measuredCommunities.map((community, index) => (
                        <tr key={community.id} className="border-b border-black/25">
                          <td className="p-3 font-black">#{index + 1}</td>
                          <td className="p-3 font-bold">{community.name}<span className="ml-2 text-xs uppercase text-black/60">{community.type}</span>{summary.demoDataCommunityIds.includes(community.id) && <span className="ml-2 border border-black bg-[#ffe17c] px-1 text-[10px] font-black uppercase">Demo data</span>}{community.baselineEstimated && <span className="ml-2 text-[10px] font-black uppercase">Estimate</span>}</td>
                          <td className="p-3 font-black">{community.percentReduction.toFixed(1)}%</td>
                          <td className="p-3 font-bold">{community.kwhSaved.toFixed(1)} kWh</td>
                          <td className="p-3 font-bold">{community.co2SavedKg.toFixed(1)} kg</td>
                          <td className="p-3 font-bold">{community.readingDays} days</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
            <p className="mt-4 text-xs font-medium text-black/70">Challenge completions in period: <strong>{summary.challengeCompletionCount}</strong>. Top-performing communities: {summary.topPerformers.length ? summary.topPerformers.map(({ name }) => name).join(", ") : "none"}. Lowest-performing communities: {summary.lowestPerformers.length ? summary.lowestPerformers.map(({ name }) => name).join(", ") : "none"}.</p>
          </>
        ) : (
          <p role="status" className="border-2 border-black bg-white p-4 text-sm font-bold">Loading administrator summary…</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
