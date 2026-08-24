import type { Metadata } from "next";
import { GoogleAnalytics } from "@/components/google-analytics";
import { WebinarLanding } from "@/components/webinar-landing";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-MSZ1V7MXYH";

export const metadata: Metadata = {
  title: "Beyond Theory Webinar | TLCHub",
  description:
    "Register for Beyond Theory, a TLCHub webinar on technology innovation for practical STEM education in Nigeria.",
};

export default function WebinarPage() {
  return (
    <>
      <GoogleAnalytics measurementId={gaMeasurementId} />
      <WebinarLanding />
    </>
  );
}
