import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Solar and resources",
  description:
    "Explore official rooftop solar information and a practical checklist for planning a site-specific assessment.",
};

const resources = [
  {
    name: "National Portal for Rooftop Solar",
    description:
      "Use the Government of India portal to review current rooftop solar programme information and available application guidance.",
    href: "https://pmsuryaghar.gov.in/",
  },
  {
    name: "Ministry of New and Renewable Energy",
    description:
      "Consult the ministry's official website for renewable energy policies, notices, and programme information.",
    href: "https://mnre.gov.in/",
  },
] as const;

export default function SolarPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fbfbf8]">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <section className="neo-panel bg-[#ffe17c] p-5 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-black/65">Mission LiFE · Take action</p>
          <h1 className="mt-2 text-3xl font-black text-black sm:text-4xl">Solar and official resources</h1>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-black/75">
            Rooftop solar suitability depends on your roof, shade, local rules, electricity use, and current programme terms. Use official sources and a qualified local assessment before making a decision.
          </p>
        </section>

        <section aria-labelledby="checklist-heading" className="mt-7 neo-panel bg-white p-5 sm:p-7">
          <h2 id="checklist-heading" className="text-xl font-black uppercase">Before requesting a site assessment</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Review recent electricity bills and note typical monthly use.",
              "Check roof ownership or permission, available area, and shade throughout the day.",
              "Ask about structural suitability, grid connection, metering, and maintenance.",
              "Confirm current costs, eligibility, and incentives directly through official sources and written quotations.",
            ].map((item) => (
              <li key={item} className="border-2 border-black bg-[#f5f4e8] p-4 text-sm font-medium leading-relaxed">
                <span aria-hidden="true" className="mr-2 font-black">□</span>{item}
              </li>
            ))}
          </ul>
          <p className="mt-4 border-l-4 border-[#b7c6c2] pl-3 text-xs font-medium text-black/70">
            WattWise does not yet calculate rooftop solar feasibility or predict installation costs. No savings, payback, or eligibility estimate is presented here.
          </p>
        </section>

        <section aria-labelledby="resources-heading" className="mt-7">
          <h2 id="resources-heading" className="text-xl font-black uppercase">Official information sources</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {resources.map((resource) => (
              <article key={resource.href} className="neo-card bg-[#b7c6c2] p-5">
                <h3 className="text-lg font-black">{resource.name}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-black/75">{resource.description}</p>
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center border-2 border-black bg-white px-3 text-xs font-black uppercase underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  Visit official website <span className="sr-only">(opens in a new tab)</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/dashboard" className="neo-btn min-h-11 bg-[#ffe17c] px-4 py-2 text-xs text-black">Review electricity use</Link>
          <Link href="/community" className="neo-btn min-h-11 bg-white px-4 py-2 text-xs text-black">Explore community actions</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
