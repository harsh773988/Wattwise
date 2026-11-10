"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChallengeBoard } from "@/components/ChallengeBoard";
import { MissionLifeQuestHub } from "@/components/MissionLifeQuestHub";
import { LifePledgeModal } from "@/components/LifePledgeModal";

export default function ChallengesPage() {
  const [isPledgeOpen, setIsPledgeOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf8]">
      <Navbar currentSpaceId="default" onSpaceChange={() => undefined} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-black/70">Pan-India Mission LiFE</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-black text-black">Citizen Action & Quests</h1>
            <p className="mt-2 text-sm font-medium text-black/75">
              Progress one small action at a time across the 7 national Mission LiFE themes. Each task is a verified step toward your certified Green Passport.
            </p>
          </div>

          {/* National Pledge CTA */}
          <button
            onClick={() => setIsPledgeOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-black text-white text-sm font-black uppercase tracking-wider rounded-none border-2 border-black shadow-[3px_3px_0_0_#16a34a] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
          >
            🤝 Take the National Pledge
          </button>
        </div>

        <div className="mb-10">
          <MissionLifeQuestHub />
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-black uppercase text-black">Micro-Habits & Daily Nudges</h2>
        </div>
        <ChallengeBoard profileId="default" appliances={["geyser", "washing machine", "ac"]} />
      </main>

      <Footer />

      <LifePledgeModal
        isOpen={isPledgeOpen}
        onClose={() => setIsPledgeOpen(false)}
        onPledgeTaken={(pts) =>
          toast.success(`🌿 Pledge taken! +${pts} Green Points awarded. Certificate generated.`)
        }
      />
    </div>
  );
}
