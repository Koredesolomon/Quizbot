import { MessageCircle } from "lucide-react";

export const WHATSAPP_COMMUNITY_URL = "https://chat.whatsapp.com/IE43Lp4gbUN4g9UI9R6AZp?s=sh&p=i&mlu=4&ilr=4&iam=2";

// Decorative avatar dots that sit on the flowing lines. Positions are percentages of the card.
const dots = [
  { top: "9%", left: "36%", label: "A", color: "bg-[#0b9230]", hideOnMobile: false },
  { top: "30%", left: "17%", label: "T", color: "bg-[#06479b]", hideOnMobile: true },
  { top: "52%", left: "8%", label: "S", color: "bg-white text-[#082b63]", hideOnMobile: false },
  { top: "74%", left: "28%", label: "O", color: "bg-[#0b9230]", hideOnMobile: true },
  { top: "18%", left: "62%", label: "E", color: "bg-white text-[#082b63]", hideOnMobile: true },
  { top: "29%", left: "80%", label: "K", color: "bg-[#06479b]", hideOnMobile: false },
  { top: "50%", left: "90%", label: "J", color: "bg-[#0b9230]", hideOnMobile: true },
  { top: "62%", left: "70%", label: "M", color: "bg-white text-[#082b63]", hideOnMobile: false },
  { top: "84%", left: "58%", label: "B", color: "bg-[#06479b]", hideOnMobile: true },
];

export function WhatsAppCommunityCard({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`relative mt-6 overflow-hidden rounded-xl bg-[#082b63] text-center ${compact ? "px-5 py-6" : "px-6 py-16 shadow-xl shadow-sky-100 sm:py-20"}`}>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1000 500"
      >
        <path d="M0 250 L180 90 A80 80 0 0 1 300 80 L380 140" stroke="#0b9230" strokeOpacity="0.8" />
        <path d="M0 300 L290 90 A70 70 0 0 1 380 70" stroke="#0b9230" strokeOpacity="0.5" />
        <path d="M0 360 L240 220 A90 90 0 0 1 330 330 L360 420" stroke="#5b8def" strokeOpacity="0.8" />
        <path d="M1000 120 L760 300 A80 80 0 0 0 700 330 L640 400" stroke="#5b8def" strokeOpacity="0.8" />
        <path d="M1000 250 L860 160 A70 70 0 0 0 740 150 L650 100" stroke="#5b8def" strokeOpacity="0.5" />
        <path d="M1000 420 L800 330 A80 80 0 0 0 700 400 L600 470" stroke="#0b9230" strokeOpacity="0.7" />
      </svg>

      {!compact && dots.map((dot) => (
        <span
          aria-hidden="true"
          className={`absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#082b63] text-xs font-black text-white ring-2 ring-white/20 sm:h-11 sm:w-11 sm:text-sm ${dot.color} ${dot.hideOnMobile ? "hidden sm:flex" : "flex"}`}
          key={`${dot.top}-${dot.left}`}
          style={{ top: dot.top, left: dot.left }}
        >
          {dot.label}
        </span>
      ))}

      <div className="relative mx-auto max-w-xl">
        <p className="text-sm font-bold text-emerald-300">Join our student community</p>
        <h3 className={`${compact ? "mt-2 text-2xl" : "mt-4 text-3xl sm:text-4xl"} font-black leading-tight text-white`}>Ready to learn together?</h3>
        <p className={`mx-auto ${compact ? "mt-3" : "mt-5"} max-w-md text-sm font-semibold leading-6 text-sky-100`}>
          A little support goes a long way. Connect with fellow students on WhatsApp for study tips, helpful updates and encouragement.
        </p>
        <a
          className={`${compact ? "mt-5 w-full justify-center" : "mt-8"} inline-flex min-h-12 items-center gap-2 rounded-lg bg-emerald-300 px-7 py-3 text-sm font-black text-[#082b63] transition hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300`}
          href={WHATSAPP_COMMUNITY_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <MessageCircle aria-hidden="true" size={18} />
          Join Community
        </a>
      </div>
    </section>
  );
}
