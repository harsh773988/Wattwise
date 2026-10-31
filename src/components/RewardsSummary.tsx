"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Badge {
  id: string;
  title: string;
}

interface RewardsSummaryProps {
  readonly profileId: string;
  readonly spaceId: string;
}

export function RewardsSummary({ profileId, spaceId }: RewardsSummaryProps) {
  const [rewards, setRewards] = useState<{
    points: number;
    streak: number;
    latestBadge: Badge | null;
    baselineEstimated: boolean;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadRewards() {
      try {
        const query = new URLSearchParams({ profileId, spaceId });
        const response = await fetch(`/api/me/rewards?${query.toString()}`);
        if (!response.ok) throw new Error("Unable to load rewards");
        const json = await response.json();
        if (!ignore) setRewards(json.data);
      } catch (error: unknown) {
        if (!ignore) {
          setRewards(null);
          toast.error(error instanceof Error ? error.message : "Unable to load rewards");
        }
      }
    }

    void loadRewards();
    return () => {
      ignore = true;
    };
  }, [profileId, spaceId]);

  return (
    <aside aria-label="Your rewards" className="mt-4 flex flex-wrap gap-2">
      <span className="border-2 border-black bg-[#ffe17c] px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]">
        {rewards ? `${rewards.points} points` : "Rewards loading"}
      </span>
      <span className="border-2 border-black bg-[#b7c6c2] px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]">
        {rewards ? `${rewards.streak} day streak` : "— day streak"}
      </span>
      <span className="border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]">
        {rewards?.latestBadge?.title ?? "No badge earned yet"}
      </span>
      {rewards?.baselineEstimated && (
        <span className="w-full text-[10px] font-black uppercase text-black/70">
          Points use an assumed baseline estimate
        </span>
      )}
    </aside>
  );
}
