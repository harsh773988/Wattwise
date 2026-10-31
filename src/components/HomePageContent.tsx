"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const missionFeatures = [
  {
    href: "/dashboard",
    number: "01",
    title: "Track your footprint",
    description:
      "See daily electricity use, compare it with your baseline, and follow estimated cost and CO₂ trends over time.",
    className: "bg-white",
  },
  {
    href: "/challenges",
    number: "02",
    title: "Get nudges and daily challenges",
    description:
      "Use appliance-aware suggestions and small self-reported actions to build more mindful routines.",
    className: "bg-[#ffe17c]",
  },
  {
    href: "/community",
    number: "03",
    title: "Compete and cheer as a community",
    description:
      "Celebrate validated reductions and follow community goals using percent change from baseline.",
    className: "bg-[#b7c6c2]",
  },
  {
    href: "/solar",
    number: "04",
    title: "Take action: solar and resources",
    description:
      "Explore official rooftop-solar information and a practical checklist before seeking a site-specific assessment.",
    className: "bg-white",
  },
] as const;

export function HomePageContent() {
  const router = useRouter();
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  const handleLoadSampleAndRedirect = async () => {
    setIsLoadingSample(true);
    try {
      toast.info("Loading 30-day screening dataset...");
      const res = await fetch("/sample_data.csv");
      if (!res.ok) throw new Error("Could not find sample_data.csv");
      const text = await res.text();

      const importRes = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId: "default", csvContent: text }),
      });

      if (!importRes.ok) throw new Error("Failed to initialize sample data");

      toast.success("Sample data loaded! Redirecting to dashboard...");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error loading sample data");
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf8]">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <section className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-5 flex justify-center">
            <Image
              src="/logo.png"
              alt="WattWise"
              width={112}
              height={112}
              priority
              className="h-24 w-24 object-contain sm:h-28 sm:w-28"
            />
          </div>
          <h1 className="mb-3 text-4xl font-black leading-tight tracking-tight text-black sm:text-6xl">
            Your personal Mission LiFE companion
          </h1>
          <p className="mb-4 text-xl font-black text-[#171e19] sm:text-2xl">
            &ldquo;Know where your power goes.&rdquo;
          </p>
          <p className="mx-auto mb-7 max-w-2xl text-sm font-semibold leading-relaxed text-black/70 sm:text-base">
            Understand household electricity patterns, try practical actions, and see how your community is progressing. Savings and emissions are shown as estimates where applicable.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleLoadSampleAndRedirect}
              disabled={isLoadingSample}
              className="neo-btn flex min-h-12 w-full items-center justify-center gap-2 bg-[#ffe17c] px-5 py-3 text-sm text-black shadow-[4px_4px_0px_0px_#000] disabled:opacity-60 sm:w-auto sm:text-base"
            >
              <span aria-hidden="true">⚡</span>
              <span>{isLoadingSample ? "Loading Demo Data..." : "Load Sample Data & View Dashboard"}</span>
            </button>
            <Link
              href="/dashboard"
              className="neo-btn flex min-h-12 w-full items-center justify-center bg-white px-5 py-3 text-sm text-black shadow-[4px_4px_0px_0px_#000] sm:w-auto sm:text-base"
            >
              Upload Custom CSV
            </Link>
          </div>
          <p className="mt-4 text-xs font-bold text-black/60">
            Use sample data to preview the dashboard. WattWise also works in in-memory mode without a database.
          </p>
          <p className="mt-2 text-[11px] font-bold text-black/55">
            Built for Hack Cult 26, problem statement HC26-GEDA01.
          </p>
        </section>

        <section aria-labelledby="mission-life-heading" className="mb-16">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-black/60">Small steps, visible progress</p>
            <h2 id="mission-life-heading" className="mt-2 text-2xl font-black text-black sm:text-3xl">
              How WattWise supports Mission LiFE
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {missionFeatures.map((feature) => (
              <Link
                href={feature.href}
                key={feature.number}
                className={`neo-card block p-5 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black sm:p-6 ${feature.className}`}
              >
                <p className="text-xs font-black tracking-widest text-black/55">{feature.number}</p>
                <h3 className="mt-2 text-lg font-black text-black sm:text-xl">{feature.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-black/75">{feature.description}</p>
                <span className="mt-4 inline-block text-xs font-black uppercase underline underline-offset-4">Explore</span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="who-heading" className="neo-panel mb-16 bg-[#171e19] p-5 text-white sm:p-7">
          <h2 id="who-heading" className="text-xl font-black sm:text-2xl">Who it is for</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["Residents", "Understand household patterns and choose practical next steps."],
              ["Communities", "Set shared goals and celebrate progress together."],
              ["Administrators", "Review regional aggregates without exposing individual readings."],
            ].map(([audience, description]) => (
              <div key={audience} className="border border-white/30 bg-white/5 p-4">
                <h3 className="font-black text-[#ffe17c]">{audience}</h3>
                <p className="mt-1 text-sm font-medium text-white/75">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Electricity tracking features" className="mb-16 grid gap-4 md:grid-cols-3">
          <article className="neo-card bg-white p-5">
            <div aria-hidden="true" className="mb-3 flex h-10 w-10 items-center justify-center border-2 border-black bg-[#ffe17c] text-lg shadow-[2px_2px_0px_0px_#000]">↗</div>
            <h2 className="font-black text-black">Daily usage and spikes</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-black/70">Visualize daily consumption and identify readings that stand out from your usage pattern.</p>
          </article>
          <article className="neo-card bg-[#ffe17c] p-5">
            <div aria-hidden="true" className="mb-3 flex h-10 w-10 items-center justify-center border-2 border-black bg-white text-lg shadow-[2px_2px_0px_0px_#000]">₹</div>
            <h2 className="font-black text-black">Cost and carbon estimates</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-black/75">Translate kWh into estimated rupees and grid emissions using configurable assumptions.</p>
          </article>
          <article className="neo-card bg-[#b7c6c2] p-5">
            <div aria-hidden="true" className="mb-3 flex h-10 w-10 items-center justify-center border-2 border-black bg-white text-lg shadow-[2px_2px_0px_0px_#000]">↔</div>
            <h2 className="font-black text-black">Tips and what-if scenarios</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-black/75">Explore rule-based suggestions and model possible changes before trying them.</p>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
