import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personal energy dashboard",
  description:
    "Review daily electricity readings, usage patterns, estimated costs and emissions, nudges, and what-if scenarios.",
};

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
