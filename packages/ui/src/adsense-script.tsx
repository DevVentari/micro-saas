"use client";

import Script from "next/script";

export function AdSenseScript() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId || clientId === "ca-pub-placeholder") return null;
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
