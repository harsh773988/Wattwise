"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, isSupabaseAuthConfigured } from "@/lib/supabase/browser";

export function AuthControls() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    void supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (active) setEmail(data.user?.email ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((
      _event: AuthChangeEvent,
      session: Session | null,
    ) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);
    if (error) {
      window.alert(`Could not sign out: ${error.message}`);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  if (email) {
    return (
      <div className="order-5 flex items-center gap-2 border-2 border-black bg-white px-2 py-1 shadow-[2px_2px_0px_0px_#000] md:order-4">
        <span className="hidden max-w-36 truncate text-[11px] font-bold sm:inline" title={email}>{email}</span>
        <button type="button" onClick={() => void signOut()} disabled={isSigningOut} className="min-h-8 px-2 text-[10px] font-black uppercase underline underline-offset-2 disabled:opacity-50">
          {isSigningOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <Link href="/login" className="order-5 inline-flex min-h-10 items-center border-2 border-black bg-white px-3 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] hover:bg-[#171e19] hover:text-white md:order-4">
      {isSupabaseAuthConfigured() ? "Sign in" : "Account"}
    </Link>
  );
}
