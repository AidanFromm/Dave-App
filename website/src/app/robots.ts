import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/staff/", "/pos/", "/kiosk/", "/auth/", "/checkout/"],
      },
    ],
    sitemap: "https://securedtampa.com/sitemap.xml",
  };
}
