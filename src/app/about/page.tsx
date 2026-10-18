import Link from "next/link";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WattWise",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/logo.png`,
  description:
    "WattWise helps households understand power use, costs, carbon impact, and savings opportunities with simple electricity analytics.",
};

export const metadata = {
  title: "About | WattWise",
  description:
    "Learn how WattWise helps households understand their power use, costs, carbon impact, and savings opportunities.",
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen bg-[#fbfbf8] text-[#171e19]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="neo-card bg-[#ffe17c] p-6 sm:p-8">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-black/70">
            About WattWise
          </p>
          <h1 className="text-3xl font-black tracking-tight text-black sm:text-5xl">
            Understand your power, before it slips away.
          </h1>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="neo-card bg-white p-6">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-black/60">
              Problem
            </p>
            <h2 className="text-xl font-black text-black">Energy data feels messy.</h2>
            <p className="mt-3 text-sm font-medium text-black/70">
              Most homes receive usage data in raw formats, making it hard to spot spikes,
              compare costs, and understand the impact of everyday habits.
            </p>
          </div>

          <div className="neo-card bg-white p-6">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-black/60">
              How it works
            </p>
            <h2 className="text-xl font-black text-black">Upload, analyze, act.</h2>
            <p className="mt-3 text-sm font-medium text-black/70">
              Import a CSV of meter readings, review usage trends, estimate rupee cost, and see
              which spikes or durations are worth improving.
            </p>
          </div>

          <div className="neo-card bg-white p-6">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-black/60">
              Assumptions
            </p>
            <h2 className="text-xl font-black text-black">Transparent calculations.</h2>
            <p className="mt-3 text-sm font-medium text-black/70">
              WattWise applies a clear tariff, carbon factor, and spike threshold so users can
              understand what is driving each estimate and update assumptions as needed.
            </p>
          </div>
        </div>

        <div className="mt-8 neo-card bg-white p-6 sm:p-8">
          <p className="text-sm font-medium leading-7 text-black/75">
            WattWise turns interval meter readings into something useful: a practical view of
            where energy is being consumed, how much it costs in rupees, and how small habit
            changes can lower both emissions and monthly bills. The experience is designed to be
            readable, fast, and transparent for everyday home energy decisions.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="neo-btn bg-[#ffe17c] px-5 py-3 text-sm text-black">
              Open dashboard
            </Link>
            <Link href="/contact" className="neo-btn bg-white px-5 py-3 text-sm text-black">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
