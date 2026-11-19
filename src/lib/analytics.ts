/**
 * Google Analytics 4 helpers. Nothing is sent unless analytics was started by <GoogleAnalytics />,
 * which only happens in production and never on admin pages. Never put names, emails or answers in an event.
 */
export const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-GBE0S6N1KZ";

type Params = Record<string, string | number | boolean | undefined>;
type AnalyticsWindow = { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; __gaStarted?: boolean };

const browser = () => (typeof window === "undefined" ? undefined : (window as unknown as AnalyticsWindow));

/** Whether analytics should run: a measurement ID, a production build, and not an admin page. */
export function analyticsEnabled({ measurementId, pathname, production }: { measurementId?: string; pathname: string; production: boolean }) {
  return Boolean(measurementId) && production && !pathname.startsWith("/admin");
}

/** Queues the standard Google tag setup. Page views are sent by us, so the tag's own is off. Safe to call twice. */
export function startAnalytics(measurementId: string) {
  const win = browser();
  if (!win || win.__gaStarted) return;
  win.__gaStarted = true;
  win.dataLayer = win.dataLayer ?? [];
  // Same function Google's snippet defines: gtag.js reads the queued `arguments` objects once it loads.
  // gtag.js only understands `arguments` objects in the queue, so a rest parameter (an array) would be ignored.
  // eslint-disable-next-line prefer-rest-params
  win.gtag = win.gtag ?? function gtag() { win.dataLayer!.push(arguments); };
  win.gtag("js", new Date());
  win.gtag("config", measurementId, { send_page_view: false });
}

export function trackEvent(name: string, params: Params = {}) {
  const win = browser();
  if (!win?.__gaStarted || !win.gtag) return;
  try {
    win.gtag("event", name, params);
  } catch {
    // Analytics must never break the app.
  }
}

export function trackPageView(path: string) {
  const win = browser();
  if (!win) return;
  trackEvent("page_view", { page_path: path, page_location: `${window.location.origin}${path}`, page_title: document.title });
}
