"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface Nudge {
  id: string;
  title: string;
  message: string;
  estimatedMonthlyKwhSaving: number;
  relatedAppliance?: string;
  reason: string;
}

interface NudgesCardProps {
  profileId?: string;
  appliances?: string[];
}

export function NudgesCard({ profileId = "demo-profile", appliances = ["geyser", "washing machine", "ac"] }: NudgesCardProps) {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/nudges?profileId=${encodeURIComponent(profileId)}&appliances=${encodeURIComponent(appliances.join(","))}`);
        if (!res.ok) throw new Error("Failed to load nudges");
        const json = await res.json();
        if (!ignore) {
          setNudges(json.data?.nudges ?? []);
        }
      } catch (error: unknown) {
        if (!ignore) {
          toast.error(error instanceof Error ? error.message : "Error loading nudges");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [appliances, profileId]);

  if (isLoading) {
    return (
      <div className="neo-panel p-5 animate-pulse">
        <div className="h-4 w-32 bg-[#d7d7d7] rounded border border-black mb-4" />
        <div className="space-y-3">
          <div className="h-16 border border-black bg-[#f5f5f5]" />
          <div className="h-16 border border-black bg-[#f5f5f5]" />
        </div>
      </div>
    );
  }

  if (nudges.length === 0) {
    return (
      <div className="neo-panel p-5 bg-[#f7f4d8]">
        <p className="text-lg font-black uppercase">Today’s nudges</p>
        <p className="mt-2 text-sm font-medium text-black/75">No nudge triggered today. Keep on track with your routine.</p>
      </div>
    );
  }

  return (
    <div className="neo-panel p-5 bg-[#f9f9f7]">
      <div className="flex items-center justify-between gap-2 mb-4">
        <p className="text-lg font-black uppercase">Today’s nudges</p>
        <span className="bg-[#ffe17c] border border-black px-2 py-1 text-[10px] font-black uppercase">Demo data</span>
      </div>
      <div className="space-y-3">
        {nudges.map((nudge) => (
          <div
            key={nudge.id}
            className={`border border-black bg-white p-3 shadow-[3px_3px_0px_0px_#171e19] ${prefersReducedMotion ? "" : "transition-transform duration-150 hover:-translate-y-0.5"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black uppercase">{nudge.title}</p>
              {nudge.relatedAppliance && (
                <span className="text-[10px] font-black uppercase bg-[#b7c6c2] border border-black px-2 py-0.5">
                  {nudge.relatedAppliance}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-black/80">{nudge.message}</p>
            <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-black uppercase">
              <span>Est. saving: {nudge.estimatedMonthlyKwhSaving.toFixed(1)} kWh/month</span>
              <span className="bg-[#ffe17c] px-2 py-0.5 border border-black">{nudge.reason}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
