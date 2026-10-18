"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StatCards } from "@/components/StatCards";
import { UsageChart } from "@/components/UsageChart";
import { SpikeList } from "@/components/SpikeList";
import { TipCard } from "@/components/TipCard";
import { WhatIfSlider } from "@/components/WhatIfSlider";
import { AssumptionsPanel } from "@/components/AssumptionsPanel";
import { UploadDropzone } from "@/components/UploadDropzone";
import { ManualEntryModal } from "@/components/ManualEntryModal";
import { EmptyState } from "@/components/EmptyState";
import { DashboardSkeleton } from "@/components/Skeletons";
import { buildDashboardViewModel } from "@/services/dashboardService";
import type { Reading, Assumptions } from "@/domain/types";
import { DEFAULT_ASSUMPTIONS } from "@/lib/config";
import { toast, Toaster } from "sonner";

export default function DashboardPage() {
  const [spaceId, setSpaceId] = useState("default");
  const [readings, setReadings] = useState<readonly Reading[]>([]);
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);

  const fetchReadings = useCallback(async (targetSpace: string) => {
    try {
      const res = await fetch(`/api/readings?spaceId=${encodeURIComponent(targetSpace)}`);
      if (!res.ok) throw new Error("Failed to fetch readings");
      const json = await res.json();
      setReadings(json.data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error loading readings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const res = await fetch(`/api/readings?spaceId=${encodeURIComponent(spaceId)}`);
        if (!res.ok) throw new Error("Failed to fetch readings");
        const json = await res.json();
        if (!ignore) {
          setReadings(json.data || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          toast.error(err instanceof Error ? err.message : "Error loading readings");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [spaceId]);

  const handleSpaceChange = (newSpace: string) => {
    setSpaceId(newSpace);
  };

  const handleExportCsv = () => {
    if (readings.length === 0) {
      toast.error("No readings available to export");
      return;
    }

    const header = "date,kwh\n";
    const rows = readings.map((r) => `${r.date},${r.kwh}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `WattWise_readings_${spaceId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Exported readings as WattWise_readings.csv");
  };

  const handleClearReadings = async () => {
    if (!confirm(`Are you sure you want to delete all readings for space "${spaceId}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/readings?spaceId=${encodeURIComponent(spaceId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete readings");
      setReadings([]);
      toast.success(`Cleared all data for space "${spaceId}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error clearing readings");
    }
  };

  // Build the view model using pure domain logic orchestrated by dashboardService
  const viewModel = buildDashboardViewModel(readings, assumptions);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf8]">
      <Toaster position="top-right" richColors />
      <Navbar currentSpaceId={spaceId} onSpaceChange={handleSpaceChange} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight flex items-center gap-3">
              Power Consumption Dashboard
            </h1>
            <p className="text-sm font-semibold text-black/70 mt-1">
              Active Space: <span className="text-black font-black bg-[#ffe17c] px-2 py-0.5 border border-black shadow-[2px_2px_0px_0px_#000]">{spaceId}</span>
              {" • "}
              {readings.length} {readings.length === 1 ? "day recorded" : "days recorded"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsManualEntryOpen(true)}
              className="neo-btn bg-white text-black text-xs px-3.5 py-2 flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Manual Entry</span>
            </button>

            <button
              onClick={() => setShowUploadSection(!showUploadSection)}
              className="neo-btn bg-white text-black text-xs px-3.5 py-2 flex items-center gap-1.5"
            >
              <span>📁</span>
              <span>{showUploadSection ? "Hide Import" : "Import CSV"}</span>
            </button>

            <button
              onClick={() => setIsAssumptionsOpen(true)}
              className="neo-btn bg-[#ffe17c] text-black text-xs px-3.5 py-2 flex items-center gap-1.5"
            >
              <span>⚙️</span>
              <span>Assumptions</span>
            </button>

            {readings.length > 0 && (
              <>
                <button
                  onClick={handleExportCsv}
                  className="neo-btn bg-white text-black text-xs px-3.5 py-2 flex items-center gap-1.5"
                  title="Export readings to CSV"
                >
                  <span>⬇️</span>
                  <span>Export</span>
                </button>
                <button
                  onClick={handleClearReadings}
                  className="neo-btn bg-[#ff5a5a] text-white text-xs px-3 py-2"
                  title="Clear all readings for this space"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Collapsible CSV Upload & Sample Loader Section */}
        {showUploadSection && (
          <div className="mb-8">
            <UploadDropzone
              spaceId={spaceId}
              onImportComplete={() => fetchReadings(spaceId)}
              onSampleDataLoaded={() => fetchReadings(spaceId)}
            />
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && <DashboardSkeleton />}

        {/* Empty State */}
        {!isLoading && readings.length === 0 && (
          <EmptyState
            spaceId={spaceId}
            onLoadSampleData={async () => {
              try {
                toast.info("Loading 30-day sample data...");
                const res = await fetch("/sample_data.csv");
                const text = await res.text();
                const importRes = await fetch("/api/import", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ spaceId, csvContent: text }),
                });
                if (!importRes.ok) throw new Error("Failed to load sample dataset");
                toast.success("Sample data loaded successfully!");
                fetchReadings(spaceId);
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Error loading sample data");
              }
            }}
            onOpenUpload={() => setShowUploadSection(true)}
          />
        )}

        {/* Active Dashboard Views */}
        {!isLoading && readings.length > 0 && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <StatCards
              stats={viewModel.stats}
              assumptions={viewModel.assumptions}
              onOpenAssumptions={() => setIsAssumptionsOpen(true)}
            />

            {/* Daily Usage Chart with Spike Highlights */}
            <UsageChart
              readings={viewModel.readings}
              spikes={viewModel.spikes}
              assumptions={viewModel.assumptions}
              averageKwh={viewModel.stats.averageKwh}
            />

            {/* Spikes & Tips Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <SpikeList
                  spikes={viewModel.spikes}
                  assumptions={viewModel.assumptions}
                  onOpenAssumptions={() => setIsAssumptionsOpen(true)}
                />
              </div>

              <div className="lg:col-span-2">
                <WhatIfSlider assumptions={viewModel.assumptions} />
              </div>
            </div>

            {/* Smart Pattern Tips */}
            <TipCard
              tips={viewModel.tips}
              assumptions={viewModel.assumptions}
            />
          </div>
        )}
      </main>

      <Footer />

      {/* Assumptions Modal */}
      <AssumptionsPanel
        assumptions={assumptions}
        isOpen={isAssumptionsOpen}
        onClose={() => setIsAssumptionsOpen(false)}
        onChange={(updated) => {
          setAssumptions(updated);
          toast.success("Assumptions updated successfully");
        }}
      />

      {/* Manual Reading Modal */}
      <ManualEntryModal
        spaceId={spaceId}
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        onReadingAdded={() => fetchReadings(spaceId)}
      />
    </div>
  );
}
