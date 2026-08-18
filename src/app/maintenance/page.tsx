import type { Metadata } from "next";
import { ArrowRight, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Maintenance | TLCHub",
  description: "The main TLCHub website is currently in maintenance mode.",
};

export default function MaintenancePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,rgba(0,123,63,0.12),transparent_32rem),linear-gradient(225deg,rgba(0,73,145,0.12),transparent_30rem),#f8fbff] px-5 py-12 text-slate-950">
      <section className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white/92 p-8 text-center shadow-2xl shadow-slate-200/80 sm:p-11">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-emerald-600 text-white">
          <Wrench aria-hidden="true" size={26} />
        </div>
        <p className="mt-6 text-lg font-black text-emerald-700">TLCHub</p>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-6xl">
          We&rsquo;re improving the experience.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg font-medium leading-8 text-slate-600">
          The main website is currently in maintenance mode. The Beyond Theory webinar page remains available for registration.
        </p>
        <a
          href="/webinar"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-500"
        >
          Go to Webinar
          <ArrowRight aria-hidden="true" size={18} />
        </a>
      </section>
    </main>
  );
}
