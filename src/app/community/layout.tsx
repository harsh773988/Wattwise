import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community impact",
  description:
    "Follow community energy reduction rankings, shared goals, points, streaks, and badges in WattWise.",
};

export default function CommunityLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
