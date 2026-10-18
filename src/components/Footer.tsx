import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-[#171e19] text-white border-t-2 border-black mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_#fff]">
              <Image
                src="/logo.png"
                alt="WattWise Logo"
                width={30}
                height={30}
                className="object-contain"
              />
            </div>
            <div>
              <div className="font-black text-xl tracking-tight text-[#ffe17c]">
                WattWise
              </div>
              <div className="text-xs text-[#b7c6c2]">
                Know where your power goes.
              </div>
            </div>
          </div>

          <div className="text-xs text-[#b7c6c2] text-center sm:text-right">
            <p>Built with Next.js, TypeScript, and Neo-Brutalist Architecture.</p>
            <p className="mt-1">
              Data emissions based on CEA 2023 grid factor (0.82 kg CO₂/kWh).
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between text-xs text-[#b7c6c2]">
          <p>© {new Date().getFullYear()} WattWise. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0 font-bold">
            <Link href="/" className="hover:text-[#ffe17c] transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="hover:text-[#ffe17c] transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
