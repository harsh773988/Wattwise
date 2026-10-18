import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://wattwise.vercel.app"),
  title: "WattWise - Know where your power goes",
  description:
    "Electricity usage tracker with spike detection, rupee costing, CO₂ carbon footprint, and live habit change simulation.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "WattWise - Know where your power goes",
    description:
      "Electricity usage tracker with spike detection, rupee costing, and habit change simulations.",
    images: [{ url: "/logo.png", width: 800, height: 800, alt: "WattWise Logo" }],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fbfbf8] text-[#171e19]">
        {children}
      </body>
    </html>
  );
}
