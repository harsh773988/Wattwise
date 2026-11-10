import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create a WattWise account.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfbf8] px-4 py-10">
      <Suspense fallback={<div className="neo-panel w-full max-w-lg animate-pulse bg-white p-8" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
