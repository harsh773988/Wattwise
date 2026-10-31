"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChallengeBoard } from "@/components/ChallengeBoard";

export default function ChallengesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf8]">
      <Navbar currentSpaceId="default" onSpaceChange={() => undefined} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-black/70">Mission LiFE</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black text-black">Daily energy challenges</h1>
          <p className="mt-2 text-sm font-medium text-black/75">
            Progress one small action at a time. Each task is a low-friction way to cut demand and build momentum.
          </p>
        </div>

        <ChallengeBoard profileId="default" appliances={["geyser", "washing machine", "ac"]} />
      </main>

      <Footer />
    </div>
  );
}
