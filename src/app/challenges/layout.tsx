import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily energy challenges",
  description:
    "Explore small self-reported energy-saving challenges and track your daily sustainability actions.",
};

export default function ChallengesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
