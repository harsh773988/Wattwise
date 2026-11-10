"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient, isSupabaseAuthConfigured } from "@/lib/supabase/browser";

type AuthMode = "sign_in" | "sign_up";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const configured = isSupabaseAuthConfigured();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Sign-in is unavailable until Supabase is configured.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "sign_up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage("Account created. Check your email to confirm your address, then sign in.");
          setMode("sign_in");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }

      const requestedNext = searchParams.get("next");
      const nextPath =
        requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
          ? requestedNext
          : "/dashboard";
      router.replace(nextPath);
      router.refresh();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Authentication failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!configured) {
    return (
      <section className="neo-panel w-full max-w-lg bg-white p-6 sm:p-8">
        <Link href="/" className="text-sm font-black uppercase underline underline-offset-4">← WattWise</Link>
        <h1 className="mt-5 text-3xl font-black">Account sign-in</h1>
        <p className="mt-3 text-sm font-medium leading-relaxed">
          Email/password accounts need a Supabase project. Add its project URL and public anon key to your local environment to enable sign-in. Demo mode remains available without those settings.
        </p>
        <p className="mt-4 border-2 border-black bg-[#ffe17c] p-3 font-mono text-xs">
          NEXT_PUBLIC_SUPABASE_URL<br />
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </p>
        <Link href="/dashboard" className="neo-btn mt-5 inline-flex min-h-11 items-center bg-[#ffe17c] px-4 text-xs text-black">
          Continue to demo dashboard
        </Link>
      </section>
    );
  }

  return (
    <section className="neo-panel w-full max-w-lg bg-white p-6 sm:p-8">
      <Link href="/" className="text-sm font-black uppercase underline underline-offset-4">← WattWise</Link>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-black/60">Your energy, your account</p>
      <h1 className="mt-2 text-3xl font-black">{mode === "sign_in" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-2 text-sm font-medium text-black/70">
        Sign in to access your personal WattWise dashboard.
      </p>

      <div className="mt-5 grid grid-cols-2 border-2 border-black">
        <button type="button" aria-pressed={mode === "sign_in"} onClick={() => { setMode("sign_in"); setError(null); setMessage(null); }} className={`min-h-11 text-xs font-black uppercase ${mode === "sign_in" ? "bg-[#171e19] text-white" : "bg-white text-black"}`}>
          Sign in
        </button>
        <button type="button" aria-pressed={mode === "sign_up"} onClick={() => { setMode("sign_up"); setError(null); setMessage(null); }} className={`min-h-11 border-l-2 border-black text-xs font-black uppercase ${mode === "sign_up" ? "bg-[#171e19] text-white" : "bg-white text-black"}`}>
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        {mode === "sign_up" && (
          <div className="grid gap-1">
            <label htmlFor="account-name" className="text-xs font-black uppercase">Name</label>
            <input id="account-name" type="text" autoComplete="name" required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="min-h-12 border-2 border-black bg-white px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" />
          </div>
        )}
        <div className="grid gap-1">
          <label htmlFor="account-email" className="text-xs font-black uppercase">Email</label>
          <input id="account-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 border-2 border-black bg-white px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" />
        </div>
        <div className="grid gap-1">
          <label htmlFor="account-password" className="text-xs font-black uppercase">Password</label>
          <input id="account-password" type="password" autoComplete={mode === "sign_in" ? "current-password" : "new-password"} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 border-2 border-black bg-white px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" />
          {mode === "sign_up" && <span className="text-xs text-black/60">Use at least 8 characters.</span>}
        </div>
        {searchParams.get("error") === "auth-callback" && <p role="alert" className="border-2 border-black bg-[#ffb7a8] p-3 text-sm font-bold">Email confirmation failed. Try signing in again or request a new confirmation email.</p>}
        {error && <p role="alert" className="border-2 border-black bg-[#ffb7a8] p-3 text-sm font-bold">{error}</p>}
        {message && <p role="status" className="border-2 border-black bg-[#c4f1d0] p-3 text-sm font-bold">{message}</p>}
        <button type="submit" disabled={isSubmitting} className="neo-btn min-h-12 bg-[#ffe17c] px-4 text-sm text-black disabled:cursor-wait disabled:opacity-60">
          {isSubmitting ? "Please wait…" : mode === "sign_in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-xs leading-relaxed text-black/60">
        By continuing, you agree to use WattWise responsibly. Account security is handled by Supabase Authentication.
      </p>
    </section>
  );
}
