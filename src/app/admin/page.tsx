import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "Regional administration",
  description: "Aggregate community conservation trends for WattWise administrators.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
