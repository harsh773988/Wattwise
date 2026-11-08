import type { Metadata } from "next";
import { HomePageContent } from "@/components/HomePageContent";

export const metadata: Metadata = {
  title: "Electricity usage tracker",
  description:
    "Track your electricity use, discover practical actions, and follow community conservation progress. Inspired by India's Mission LiFE.",
};

export default function HomePage() {
  return <HomePageContent />;
}
