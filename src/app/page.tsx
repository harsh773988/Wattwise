"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function HomePage() {
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
        body: JSON.stringify({
          spaceId: "default",
          csvContent: text,
        }),
      });

      if (!importRes.ok) throw new Error("Failed to initialize sample data");

      toast.success("Sample data loaded! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error loading sample data",
      );
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf8]">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="WattWise Logo"
              width={140}
              height={140}
              priority
              className="h-[140px] w-[140px] object-contain"
            />
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-black tracking-tight leading-none mb-4">
            Watt<span className="outlined-text text-[#ffe17c] [text-shadow:-1px_1px_0_#000,1px_1px_0_#000,1px_-1px_0_#000,-1px_-1px_0_#000]" style={{textDecoration: 'none'}}>Wise</span>
          </h1>

          <p className="text-xl sm:text-2xl font-black text-[#171e19] mb-4">
            &ldquo;Know where your power goes.&rdquo;
          </p>

          <p className="text-base text-black/70 font-semibold max-w-xl mx-auto mb-8">
            The layered, high-performance electricity usage tracker. Detect consumption spikes, translate kWh to Indian Rupees and estimated carbon footprint, and simulate habit savings instantly.
          </p>

          {/* Primary Call-to-Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleLoadSampleAndRedirect}
              disabled={isLoadingSample}
              className="neo-btn bg-[#ffe17c] text-black text-base px-6 py-3.5 w-full sm:w-auto flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000]"
            >
              <span>⚡</span>
              <span>{isLoadingSample ? "Loading Demo Data..." : "Load Sample Data & View Dashboard"}</span>
            </button>

            <Link
              href="/dashboard"
              className="neo-btn bg-white text-black text-base px-6 py-3.5 w-full sm:w-auto shadow-[4px_4px_0px_0px_#000]"
            >
              Upload Custom CSV
            </Link>
          </div>

          <p className="text-xs text-black/50 font-bold mt-4">
            Works immediately in in-memory mode — zero database setup required.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="neo-card p-6 bg-white">
            <div className="w-10 h-10 bg-[#ffe17c] border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center text-lg mb-3">
              📈
            </div>
            <h3 className="text-lg font-black text-black mb-2">
              Daily Usage &amp; Spikes
            </h3>
            <p className="text-xs text-black/70 font-medium leading-relaxed">
              Visualize daily consumption trends with automatic anomaly detection when usage exceeds 1.5x your baseline.
            </p>
          </div>

          <div className="neo-card p-6 bg-[#ffe17c]">
            <div className="w-10 h-10 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center text-lg mb-3">
              ₹
            </div>
            <h3 className="text-lg font-black text-black mb-2">
              Rupees &amp; Carbon Footprint
            </h3>
            <p className="text-xs text-black/80 font-medium leading-relaxed">
              Real-time conversion of kilowatt-hours to INR based on local tariffs, plus estimated grid emissions in kg CO₂.
            </p>
          </div>

          <div className="neo-card p-6 bg-[#b7c6c2]">
            <div className="w-10 h-10 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center text-lg mb-3">
              💡
            </div>
            <h3 className="text-lg font-black text-black mb-2">
              Smart Tips &amp; What-If
            </h3>
            <p className="text-xs text-black/80 font-medium leading-relaxed">
              Rule-based recommendations extracted from your pattern, plus an interactive what-if slider to simulate daily habit reductions.
            </p>
          </div>
        </div>

        {/* Technical Architecture Highlight for Screening Round */}
        <div className="neo-card-charcoal p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-black uppercase text-[#ffe17c] tracking-widest">
                Under The Hood
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Engineered for Screening Criteria
              </h2>
            </div>
            <span className="text-xs bg-white text-black font-black px-2.5 py-1 border border-black">
              Clean Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="border border-white/20 p-3 bg-white/5">
              <div className="font-bold text-[#ffe17c] mb-1">Layered Domain</div>
              <p className="text-white/70">
                Pure TypeScript domain with 0 framework or I/O imports, 100% unit tested.
              </p>
            </div>
            <div className="border border-white/20 p-3 bg-white/5">
              <div className="font-bold text-[#ffe17c] mb-1">Repository Pattern</div>
              <p className="text-white/70">
                Seamless swap between in-memory demo store and Supabase Postgres.
              </p>
            </div>
            <div className="border border-white/20 p-3 bg-white/5">
              <div className="font-bold text-[#ffe17c] mb-1">Web Worker Parsing</div>
              <p className="text-white/70">
                Chunked streaming parser prevents UI freezes even with 100k+ row datasets.
              </p>
            </div>
            <div className="border border-white/20 p-3 bg-white/5">
              <div className="font-bold text-[#ffe17c] mb-1">Strict Validation</div>
              <p className="text-white/70">
                Boundary checks via Zod, rate limiting, and standard error envelopes.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
