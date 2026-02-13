import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE = "https://securedtampa.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/returns`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/shipping`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/drops`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/pokemon`, changeFrequency: "daily", priority: 0.7 },
  ];

  // Products
  const { data: products } = await supabase
    .from("products")
    .select("id, updated_at")
    .eq("is_active", true);

  const productPages: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE}/product/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id");

  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${BASE}/?category=${c.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}
