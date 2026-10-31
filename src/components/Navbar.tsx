"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  currentSpaceId?: string;
  onSpaceChange?: (newSpaceId: string) => void;
}

export function Navbar({ currentSpaceId = "default", onSpaceChange }: NavbarProps) {
  const pathname = usePathname();
  const navigation = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/challenges", label: "Challenges" },
    { href: "/community", label: "Community" },
    { href: "/solar", label: "Solar" },
    { href: "/admin", label: "Admin", secondary: true },
  ] as const;

  return (
    <header className="w-full bg-[#ffe17c] border-b-2 border-black sticky top-0 z-50">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-2 py-2 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"
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
              Watt<span className="outlined-text text-[#ffe17c] [text-shadow:-1px_1px_0_#000,1px_1px_0_#000,1px_-1px_0_#000,-1px_-1px_0_#000]">Wise</span>
            </span>
            <span className="hidden text-[11px] font-bold text-black/70 -mt-1 tracking-wider uppercase lg:block">
              Know where your power goes
            </span>
          </div>
        </Link>

        <nav aria-label="Primary navigation" className="order-3 flex w-full flex-wrap items-center justify-center gap-1 md:order-2 md:ml-auto md:w-auto md:flex-nowrap md:gap-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap border-2 px-1.5 font-black uppercase tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:px-2 sm:text-[11px] ${
                  isActive
                    ? `border-black bg-[#171e19] text-white shadow-[2px_2px_0px_0px_#000] ${item.href === "/admin" ? "text-[9px]" : "text-[10px]"}`
                    : item.href === "/admin"
                      ? "border-transparent bg-transparent text-[9px] text-black/70 hover:border-black hover:bg-white"
                      : "border-transparent text-[10px] text-black/80 hover:border-black hover:bg-white hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {onSpaceChange && (
          <div className="order-4 flex min-h-11 w-full min-w-0 max-w-full items-center gap-2 border-2 border-black bg-white px-2 py-1 shadow-[2px_2px_0px_0px_#000] md:order-3 md:ml-auto md:w-auto md:flex-none sm:px-2.5">
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
      </div>
    </header>
  );
}
