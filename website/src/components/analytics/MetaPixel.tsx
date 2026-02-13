"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { hasMarketingConsent } from "@/lib/analytics";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function MetaPixel() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () => setAllowed(hasMarketingConsent());
    check();
    window.addEventListener("consent-updated", check);
    return () => window.removeEventListener("consent-updated", check);
  }, []);

  useEffect(() => {
    if (!allowed || !PIXEL_ID || !window.fbq) return;
    window.fbq("track", "PageView");
  }, [pathname, allowed]);

  if (!PIXEL_ID || !allowed) return null;

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','${PIXEL_ID}');
        `,
      }}
    />
  );
}
