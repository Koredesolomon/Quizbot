"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { analyticsEnabled, startAnalytics, trackPageView } from "@/lib/analytics";

/** Loads Google Analytics for every page except /admin, in production builds only. Put it above the page content. */
export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  const pathname = usePathname();
  const enabled = analyticsEnabled({ measurementId, pathname, production: process.env.NODE_ENV === "production" });

  useEffect(() => {
    if (enabled && measurementId) startAnalytics(measurementId);
  }, [enabled, measurementId]);

  // A page view for every route change; screens inside the quiz app are sent separately as screen_view events.
  useEffect(() => {
    if (enabled) trackPageView(pathname);
  }, [enabled, pathname]);

  if (!enabled || !measurementId) return null;

  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`} strategy="afterInteractive" />;
}
