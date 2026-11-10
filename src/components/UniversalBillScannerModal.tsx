"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  parseElectricityBillText,
  SAMPLE_INDIAN_BILLS,
  ParsedBillData,
} from "@/services/universalBillParserService";
import {
  extractBillTextLocally,
  OcrProgress,
} from "@/services/localBillOcrService";
import type { Reading } from "@/domain/types";

interface UniversalBillScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  onImportComplete: (readings: Reading[]) => void;
}

export function UniversalBillScannerModal({
  isOpen,
  onClose,
  spaceId,
  onImportComplete,
}: UniversalBillScannerModalProps) {
  const [parsedData, setParsedData] = useState<ParsedBillData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileProgress, setFileProgress] = useState<OcrProgress | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleClose = () => {
    setPreviewUrl(null);
    setPreviewType(null);
    onClose();
  };

  const processBillFile = async (file: File) => {
    setSelectedPresetId(null);
    setParsedData(null);
    setFileError(null);
    setFileProgress({ message: "Preparing file locally", progress: null });
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    setPreviewUrl(isPdf || isImage ? URL.createObjectURL(file) : null);
    setPreviewType(
      isImage ? "image" : isPdf ? "pdf" : null
    );
    setIsProcessingFile(true);

    try {
      const text = await extractBillTextLocally(file, setFileProgress);
      const parsed = parseElectricityBillText(text);
      setParsedData(parsed);
      toast.success("Bill parsed locally in your browser.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not read this bill file.";
      setFileError(message);
      toast.error(message);
    } finally {
      setIsProcessingFile(false);
      setFileProgress(null);
    }
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = SAMPLE_INDIAN_BILLS.find((p) => p.id === presetId);
    if (!preset) return;

    setFileError(null);
    setPreviewUrl(null);
    setPreviewType(null);
    setSelectedPresetId(preset.id);
    const parsed = parseElectricityBillText(preset.sampleText);
    setParsedData(parsed);
    toast.success(`Loaded sample ${preset.label} bill`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processBillFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void processBillFile(file);
  };

  const handleConfirmImport = async () => {
    if (!parsedData || parsedData.generatedDailyReadings.length === 0) {
      toast.error("Please scan or select a valid bill first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId,
          readings: parsedData.generatedDailyReadings.map((r) => ({
            date: r.date,
            kwh: r.kwh,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save readings to space");
      }

      toast.success(
        `Imported 30 daily readings (${parsedData.totalKwh} kWh) for ${parsedData.detectedDiscomName}!`
      );
      onImportComplete([...parsedData.generatedDailyReadings]);
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error saving readings";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-emerald-500/30 rounded-2xl shadow-2xl p-6 text-zinc-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
              ⚡
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Pan-India Bill Scanner
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  BILL PARSER
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Snap or upload electricity bills from any Indian State & DISCOM
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-white transition-colors p-2 text-xl rounded-lg hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* 1-Click State Presets */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              1-Click Demo: Try Sample Indian Bills
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SAMPLE_INDIAN_BILLS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/10"
                        : "bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <div className="font-semibold truncate">{preset.label}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {preset.previewKwh} kWh · ₹{preset.previewAmountInr}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload or Drop */}
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors bg-zinc-800/30 ${
              isDragging
                ? "border-emerald-400 bg-emerald-500/10"
                : "border-zinc-700 hover:border-emerald-500/60"
            }`}
          >
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm font-medium text-zinc-300">
              Drag & drop a bill image, PDF, or text file
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Your bill stays on this device; English OCR assets may download on first use.
              Files up to 12 MB and PDFs up to 3 pages are supported.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-emerald-400 rounded-lg cursor-pointer border border-zinc-700 transition-colors"
              >
                Browse Bill File
              </button>
              <label className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-emerald-400 rounded-lg cursor-pointer border border-zinc-700 transition-colors">
                Use Camera
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                  aria-label="Capture an electricity bill"
                />
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Choose an electricity bill file"
              />
            </div>
          </div>

          {(previewUrl || isProcessingFile || fileError) && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-3 space-y-3">
              {previewUrl && previewType === "image" && (
                <div className="relative mx-auto h-64 w-full">
                  <Image
                    src={previewUrl}
                    alt="Selected electricity bill preview"
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 672px"
                    className="rounded-lg object-contain"
                  />
                </div>
              )}
              {previewUrl && previewType === "pdf" && (
                <iframe
                  src={previewUrl}
                  title="Selected electricity bill PDF preview"
                  className="w-full h-64 rounded-lg bg-white"
                />
              )}
              {isProcessingFile && (
                <div className="text-xs text-emerald-300" role="status" aria-live="polite">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    {fileProgress?.message ?? "Processing bill locally..."}
                  </div>
                  {fileProgress?.progress !== null &&
                    fileProgress?.progress !== undefined && (
                      <progress
                        className="mt-2 w-full accent-emerald-500"
                        max={1}
                        value={fileProgress.progress}
                      />
                    )}
                </div>
              )}
              {fileError && (
                <p className="text-xs text-red-300" role="alert">
                  {fileError}
                </p>
              )}
            </div>
          )}

          {/* Parsed Result Preview */}
          {parsedData && (
            <div className="p-4 bg-zinc-800/80 border border-emerald-500/40 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Parsed Preview
                </span>
                <span className="text-[11px] text-zinc-400">
                  State: {parsedData.detectedStateName} ({parsedData.detectedStateCode})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-700/50">
                  <div className="text-[10px] text-zinc-400">DISCOM</div>
                  <div className="text-xs font-bold text-white truncate">
                    {parsedData.detectedDiscomName}
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-700/50">
                  <div className="text-[10px] text-zinc-400">Total Billed Units</div>
                  <div className="text-sm font-extrabold text-emerald-400">
                    {parsedData.totalKwh} kWh
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-700/50">
                  <div className="text-[10px] text-zinc-400">
                    {parsedData.billAmountIsEstimated
                      ? "Estimated Bill Amount"
                      : "Total Payable"}
                  </div>
                  <div className="text-sm font-bold text-white">
                    ₹{parsedData.billAmountInr.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-700/50">
                  <div className="text-[10px] text-zinc-400">Consumer No.</div>
                  <div className="text-xs font-mono font-medium text-zinc-300 truncate">
                    {parsedData.consumerNumber}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 bg-zinc-900/60 p-2 rounded border border-zinc-800 flex items-center justify-between">
                <span>
                  Billing period:{" "}
                  <strong>
                    {parsedData.billingPeriodStartDate &&
                    parsedData.billingPeriodEndDate
                      ? `${parsedData.billingPeriodStartDate} to ${parsedData.billingPeriodEndDate}`
                      : `through ${parsedData.billDate}`}
                    {" · "}
                    {parsedData.billingPeriodDays} days
                    {parsedData.billingPeriodDaysIsEstimated
                      ? " (estimated)"
                      : ""}
                  </strong>
                  {" · "}
                  Preparing{" "}
                  <strong>
                    {parsedData.generatedDailyReadings.length} daily readings
                  </strong>
                </span>
                <span className="text-emerald-400 font-medium">Ready to sync</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsedData || isSubmitting}
            onClick={handleConfirmImport}
            className={`px-5 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
              parsedData && !isSubmitting
                ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
                Importing...
              </>
            ) : (
              <>⚡ Import & View Dashboard</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
