import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppToaster } from "@/components/AppToaster";
import { Analytics } from "@/components/Analytics";
import { CookieConsent } from "@/components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | WattWise",
    default: "WattWise",
  },
  description:
    "Upload electricity meter readings and get usage charts, spike alerts, cost in rupees, CO₂ footprint, savings tips and a what-if slider.",
  applicationName: "WattWise",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "WattWise",
    description:
      "Upload electricity meter readings and get usage charts, spike alerts, cost in rupees, CO₂ footprint, savings tips and a what-if slider.",
    siteName: "WattWise",
    locale: "en_IN",
    type: "website",
    url: siteUrl,
    images: [{ url: "/logo.png", width: 800, height: 800, alt: "WattWise Logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WattWise",
    description:
      "Upload electricity meter readings and get usage charts, spike alerts, cost in rupees, CO₂ footprint, savings tips and a what-if slider.",
    images: ["/logo.png"],
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
        <Analytics />
        <CookieConsent />
        <AppToaster />
        {children}
      </body>
    </html>
  );
}
