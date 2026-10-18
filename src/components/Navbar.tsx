"use client";

import Image from "next/image";
import Link from "next/link";

interface NavbarProps {
  currentSpaceId?: string;
  onSpaceChange?: (newSpaceId: string) => void;
}

export function Navbar({ currentSpaceId = "default", onSpaceChange }: NavbarProps) {
  return (
    <header className="w-full bg-[#ffe17c] border-b-2 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="WattWise Logo"
            width={58}
            height={58}
            priority
            className="h-[58px] w-[58px] object-contain"
          />
          <div>
            <span className="text-2xl font-black tracking-tight text-black flex items-center">
              Watt<span className="text-[#ffe17c] [text-shadow:-1px_1px_0_#000,1px_1px_0_#000,1px_-1px_0_#000,-1px_-1px_0_#000]" style={{WebkitTextStroke: '0.8px #000'}}>Wise</span>
            </span>
            <span className="hidden sm:block text-[11px] font-bold text-black/70 -mt-1 tracking-wider uppercase">
              Know where your power goes
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {onSpaceChange && (
            <div className="flex items-center gap-2 bg-white border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_0px_#000]">
              <span className="text-xs font-black uppercase tracking-wider text-black/70">
                Space:
              </span>
              <input
                type="text"
                value={currentSpaceId}
                onChange={(e) => onSpaceChange(e.target.value.trim() || "default")}
                aria-label="Current space ID"
                placeholder="e.g. room-101"
                className="text-xs font-bold w-24 sm:w-28 focus:outline-none bg-transparent"
              />
            </div>
          )}

          <nav className="hidden items-center gap-3 md:flex">
            <Link href="/about" className="text-sm font-black uppercase tracking-widest text-black/80 hover:text-black">
              About
            </Link>
            <Link href="/contact" className="text-sm font-black uppercase tracking-widest text-black/80 hover:text-black">
              Contact
            </Link>
          </nav>
          <Link
            href="/dashboard"
            className="neo-btn bg-white text-black text-sm px-4 py-1.5"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
