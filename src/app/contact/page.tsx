import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about WattWise, energy dashboard questions, or collaboration requests.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#fbfbf8] text-[#171e19]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="neo-card bg-[#ffe17c] p-6 sm:p-8">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-black/70">
            Contact us
          </p>
          <h1 className="text-3xl font-black tracking-tight text-black sm:text-5xl">
            Ask a question or share feedback.
          </h1>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="neo-card bg-white p-6 sm:p-8">
            <h2 className="text-xl font-black text-black">Reach the WattWise team</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-black/75">
              We&apos;re building a cleaner, more transparent way to understand home electricity patterns,
              costs, and savings opportunities.
            </p>
            <div className="mt-6 space-y-3 text-sm font-medium text-black/80">
              <p>
                Email: <a href="mailto:teamkalki08@gmail.com" className="font-black underline">teamkalki08@gmail.com</a>
              </p>
              <p>Typical response time: within 2 business days.</p>
            </div>
            <div className="mt-6">
              <Link href="/about" className="neo-btn bg-[#b7c6c2] px-4 py-3 text-sm font-black text-black">
                Learn more about the product
              </Link>
            </div>
          </div>

          <ContactForm />
        </div>
      </div>
    </main>
  );
}
