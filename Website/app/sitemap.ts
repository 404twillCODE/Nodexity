import type { MetadataRoute } from "next";

const BASE_URL = "https://nodexity.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/changelog",
    "/compare",
    "/docs",
    "/donate",
    "/faq",
    "/hosting",
    "/launcher",
    "/newsletter",
    "/privacy",
    "/pure",
    "/settings",
    "/software",
    "/status",
    "/support",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));
}
