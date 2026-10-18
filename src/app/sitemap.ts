import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return [
    { url: `${siteUrl}/`, lastModified: new Date(), priority: 1 },
    { url: `${siteUrl}/about`, lastModified: new Date(), priority: 0.8 },
    { url: `${siteUrl}/dashboard`, lastModified: new Date(), priority: 0.9 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), priority: 0.7 },
  ];
}
