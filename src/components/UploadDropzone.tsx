"use client";

import { useState, useRef } from "react";
import { parseCsvWithWorker } from "@/infra/csvWorker";
import { parseAndValidateCsv } from "@/services/importService";
import type { Reading, DuplicateMergeRule } from "@/domain/types";
import { toast } from "sonner";

interface UploadDropzoneProps {
  spaceId: string;
  onImportComplete: (readings: Reading[]) => void;
  onSampleDataLoaded?: () => void;
}

export function UploadDropzone({
  spaceId,
  onImportComplete,
  onSampleDataLoaded,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [mergeRule, setMergeRule] = useState<DuplicateMergeRule>("latest");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFileContent = async (content: string, filename: string) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      toast.info(`Parsing ${filename}...`);

      const rawRows = await parseCsvWithWorker(content, (pct) => {
        setProgress(pct);
      });

      const validation = parseAndValidateCsv(rawRows, spaceId, mergeRule);

      if (validation.validRows === 0) {
        const firstError = validation.errors[0]?.message || "No valid rows found";
        toast.error(`Import failed: ${firstError}`);
        setIsProcessing(false);
        setProgress(null);
        return;
      }

      // Persist via API
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId,
          readings: validation.readings.map((r) => ({
            date: r.date,
            kwh: r.kwh,
          })),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || "Failed to persist readings");
      }

      toast.success(
        `Successfully imported ${validation.validRows} days of data!${
          validation.duplicatesHandled > 0
            ? ` (${validation.duplicatesHandled} duplicates resolved using "${mergeRule}")`
            : ""
        }`,
      );

      if (validation.errors.length > 0) {
        toast.warning(
          `${validation.errors.length} rows were skipped due to formatting errors.`,
        );
      }

      onImportComplete(validation.readings);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error processing CSV file",
      );
    } finally {
      setIsProcessing(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Please upload a valid .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        processFileContent(text, file.name);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read the file");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSampleData = async () => {
    setIsProcessing(true);
    try {
      toast.info("Loading WattWise 30-day sample data...");
      const res = await fetch("/sample_data.csv");
      if (!res.ok) throw new Error("Could not fetch sample_data.csv");
      const text = await res.text();
      await processFileContent(text, "sample_data.csv");
      onSampleDataLoaded?.();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load sample data",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="neo-card p-5 bg-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-black text-lg text-black">
            Import Electricity Readings
          </h3>
          <p className="text-xs text-black/70 font-medium">
            Upload CSV with <code className="bg-gray-100 px-1 border border-black text-[11px]">date,kwh</code> headers or load pre-built sample dataset
          </p>
        </div>

        {/* Duplicate Merge Rule Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="merge-rule-select" className="text-xs font-black uppercase text-black/70">
            If duplicate date:
          </label>
          <select
            id="merge-rule-select"
            value={mergeRule}
            onChange={(e) => setMergeRule(e.target.value as DuplicateMergeRule)}
            className="text-xs font-bold border-2 border-black p-1 shadow-[2px_2px_0px_0px_#000] bg-white focus:outline-none"
          >
            <option value="latest">Keep Latest</option>
            <option value="sum">Sum kWh</option>
            <option value="average">Average kWh</option>
          </select>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed border-black p-6 sm:p-8 text-center cursor-pointer transition-colors ${
          isDragging ? "bg-[#ffe17c]/50" : "bg-[#fbfbf8] hover:bg-gray-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 bg-[#ffe17c] border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center text-xl font-black">
            📊
          </div>

          <div className="font-black text-sm text-black">
            Drag & drop your CSV file here, or{" "}
            <span className="underline text-black hover:text-black/80">browse</span>
          </div>

          <p className="text-xs text-black/60 font-semibold max-w-sm">
            ISO dates (YYYY-MM-DD) and positive numeric kWh. Web Worker streaming keeps the UI responsive for 100k+ rows.
          </p>
        </div>
      </div>

      {/* Progress Bar for Large Files */}
      {progress !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs font-bold text-black mb-1">
            <span>Parsing CSV in background Web Worker...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 border-2 border-black h-3 overflow-hidden">
            <div
              className="bg-[#ffd14a] h-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="mt-4 pt-3 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-black/60 font-medium">
          Need test data to see it in action?
        </span>

        <button
          onClick={handleLoadSampleData}
          disabled={isProcessing}
          className="neo-btn bg-[#ffe17c] text-black text-xs px-4 py-2 flex items-center gap-2"
        >
          <span>⚡</span>
          <span>Load 30-Day Sample Data</span>
        </button>
      </div>
    </div>
  );
}
