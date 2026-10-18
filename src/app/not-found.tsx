import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found | WattWise",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbfbf8] px-4">
      <div className="text-center max-w-md">
        <div className="neo-card bg-[#ffe17c] p-8 mb-6">
          <span className="text-7xl font-black text-black block">404</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-black mb-3 tracking-tight">
          Page Not Found
        </h1>

        <p className="text-sm text-black/60 font-semibold mb-6">
          This page doesn&apos;t exist — but your energy dashboard does.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="neo-btn bg-[#ffe17c] text-black text-sm px-5 py-2.5 w-full sm:w-auto"
          >
            ⚡ Back to Home
          </Link>
          <Link
            href="/dashboard"
            className="neo-btn bg-white text-black text-sm px-5 py-2.5 w-full sm:w-auto"
          >
            📊 Open Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
