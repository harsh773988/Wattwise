import Image from "next/image";
import Link from "next/link";
import {
  EMISSION_FACTOR_KG_PER_KWH,
  EMISSION_FACTOR_SOURCE,
} from "@/lib/config";

export function Footer() {
  return (
    <footer className="w-full bg-[#171e19] text-white border-t-2 border-black mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center h-[72px] w-[72px] rounded-full border-[3px] border-black bg-[#ffe17c] shadow-[4px_4px_0_#000]">
              <Image
                src="/logo.png"
                alt="WattWise Logo"
                width={54}
                height={54}
                className="h-[54px] w-[54px] object-contain rounded-full"
              />
            </div>
            <div className="flex flex-col leading-none">
              <div className="outlined-text font-black text-3xl sm:text-4xl tracking-tight text-[#ffe17c] [text-shadow:-1px_1px_0_#000,1px_1px_0_#000,1px_-1px_0_#000,-1px_-1px_0_#000]">
                WattWise
              </div>
              <div className="mt-2 text-lg sm:text-xl font-light text-[#dfe8e4]">
                Know where your power goes.
              </div>
            </div>
          </div>

          <div className="text-xs text-[#b7c6c2] text-center sm:text-right">
            <p>Built with Next.js, TypeScript, and Neo-Brutalist Architecture.</p>
            <p className="mt-1">
              CO₂ estimates use {EMISSION_FACTOR_SOURCE} ({EMISSION_FACTOR_KG_PER_KWH} kg CO₂/kWh).
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between text-xs text-[#b7c6c2]">
          <p>© {new Date().getFullYear()} WattWise. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0 font-bold">
            <Link href="/" className="hover:text-[#ffe17c] transition-colors">
              Home
            </Link>
            <Link href="/about" className="hover:text-[#ffe17c] transition-colors">
              About
            </Link>
            <Link href="/dashboard" className="hover:text-[#ffe17c] transition-colors">
              Dashboard
            </Link>
            <Link href="/contact" className="hover:text-[#ffe17c] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
