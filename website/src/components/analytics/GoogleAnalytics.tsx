"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { hasMarketingConsent } from "@/lib/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA4_ID;

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () => setAllowed(hasMarketingConsent());
    check();
    window.addEventListener("consent-updated", check);
    return () => window.removeEventListener("consent-updated", check);
  }, []);

  useEffect(() => {
    if (!allowed || !GA_ID || !window.gtag) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    window.gtag("config", GA_ID, { page_path: url });
  }, [pathname, searchParams, allowed]);

  if (!GA_ID || !allowed) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer=window.dataLayer||[];
            function gtag(){dataLayer.push(arguments);}
            gtag('js',new Date());
            gtag('config','${GA_ID}',{send_page_view:false});
          `,
        }}
      />
    </>
  );
}
