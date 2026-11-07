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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://wattwise1.vercel.app"
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | WattWise",
    default: "WattWise",
  },
  description:
    "Your personal Mission LiFE companion for tracking electricity use, discovering practical actions, and following community conservation progress.",
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
      "Your personal Mission LiFE companion for tracking electricity use, discovering practical actions, and following community conservation progress.",
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
      "Your personal Mission LiFE companion for tracking electricity use, discovering practical actions, and following community conservation progress.",
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
