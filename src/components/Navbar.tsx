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
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 px-3 py-2 sm:flex sm:justify-between sm:gap-4 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="group col-start-1 row-start-1 flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"
        >
          <Image
            src="/logo.png"
            alt="WattWise Logo"
            width={58}
            height={58}
            priority
            className="h-10 w-10 shrink-0 object-contain sm:h-[58px] sm:w-[58px]"
          />
          <div className="min-w-0 max-[359px]:hidden">
            <span className="flex shrink-0 items-center whitespace-nowrap text-xl font-black tracking-tight text-black sm:text-2xl">
              Watt<span className="text-[#ffe17c] [text-shadow:-1px_1px_0_#000,1px_1px_0_#000,1px_-1px_0_#000,-1px_-1px_0_#000]" style={{WebkitTextStroke: '0.8px #000'}}>Wise</span>
            </span>
            <span className="hidden text-[11px] font-bold text-black/70 -mt-1 tracking-wider uppercase lg:block">
              Know where your power goes
            </span>
          </div>
        </Link>

        {onSpaceChange && (
          <div className="col-span-2 row-start-2 flex min-h-11 w-full min-w-0 max-w-full items-center gap-2 border-2 border-black bg-white px-2 py-1 shadow-[2px_2px_0px_0px_#000] sm:order-2 sm:w-auto sm:flex-none sm:px-2.5">
            <span className="shrink-0 whitespace-nowrap text-[11px] font-black uppercase tracking-wider text-black/70 sm:text-xs">
              Space:
            </span>
            <input
              type="text"
              value={currentSpaceId}
              onChange={(e) => onSpaceChange(e.target.value.trim() || "default")}
              aria-label="Current space ID"
              placeholder="e.g. room-101"
              className="min-h-11 w-full min-w-0 max-w-full flex-1 bg-transparent text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-black sm:w-28 sm:flex-none"
            />
          </div>
        )}

        <nav className="hidden items-center gap-3 md:order-3 md:flex">
          <Link href="/about" className="text-sm font-black uppercase tracking-widest text-black/80 hover:text-black">
            About
          </Link>
          <Link href="/contact" className="text-sm font-black uppercase tracking-widest text-black/80 hover:text-black">
            Contact
          </Link>
        </nav>
        <Link
          href="/dashboard"
          className="neo-btn col-start-2 row-start-1 min-h-11 whitespace-nowrap bg-white px-3 py-2 text-xs text-black sm:order-4 sm:px-4 sm:text-sm"
        >
          Dashboard
        </Link>
      </div>
    </header>
  );
}
