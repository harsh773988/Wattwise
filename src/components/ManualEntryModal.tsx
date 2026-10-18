"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Reading } from "@/domain/types";

interface ManualEntryModalProps {
  spaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onReadingAdded: (reading: Reading) => void;
}

export function ManualEntryModal({
  spaceId,
  isOpen,
  onClose,
  onReadingAdded,
}: ManualEntryModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [kwh, setKwh] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericKwh = parseFloat(kwh);

    if (isNaN(numericKwh) || numericKwh < 0) {
      toast.error("Please enter a valid, non-negative kWh value");
      return;
    }

    if (!date) {
      toast.error("Please select a date");
      return;
    }

    if (new Date(date + "T00:00:00Z") > new Date()) {
      toast.error("Future dates are not allowed");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId,
          readings: [{ date, kwh: numericKwh }],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || "Failed to save reading");
      }

      toast.success(`Added reading for ${date}: ${numericKwh} kWh`);
      onReadingAdded({ spaceId, date, kwh: numericKwh });
      setKwh("");
      onClose();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add reading",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-reading-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="neo-card p-6 bg-white max-w-sm w-full shadow-[6px_6px_0px_0px_#000]">
        <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
          <h3 id="manual-reading-title" className="font-black text-xl text-black">
            Add Reading
          </h3>
          <button
            onClick={onClose}
            aria-label="Close add reading dialog"
            className="w-8 h-8 border-2 border-black font-black flex items-center justify-center bg-gray-100 hover:bg-black hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="manual-space-id" className="text-xs font-black uppercase text-black block mb-1">
              Space ID
            </label>
            <input
              id="manual-space-id"
              type="text"
              disabled
              value={spaceId}
              className="neo-input text-sm bg-gray-100 text-black/70 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="manual-reading-date" className="text-xs font-black uppercase text-black block mb-1">
              Date
            </label>
            <input
              id="manual-reading-date"
              type="date"
              max={today}
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="neo-input text-sm"
            />
          </div>

          <div>
            <label htmlFor="manual-reading-kwh" className="text-xs font-black uppercase text-black block mb-1">
              Electricity Usage (kWh)
            </label>
            <input
              id="manual-reading-kwh"
              type="number"
              step="0.1"
              min="0"
              max="1000"
              required
              placeholder="e.g. 7.5"
              value={kwh}
              onChange={(e) => setKwh(e.target.value)}
              className="neo-input text-sm"
            />
          </div>

          <div className="pt-3 border-t-2 border-black flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="neo-btn bg-white text-black text-xs px-3 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="neo-btn bg-[#ffe17c] text-black text-xs px-4 py-2"
            >
              {isSubmitting ? "Saving..." : "Save Reading"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
