import type { Metadata } from "next";
import { HomePageContent } from "@/components/HomePageContent";

export const metadata: Metadata = {
  title: "Personal Mission LiFE companion",
  description:
    "Track household electricity use, get practical nudges, take on daily challenges, and explore community and solar resources with WattWise.",
};

export default function HomePage() {
  return <HomePageContent />;
}
