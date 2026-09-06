import { FileText } from "lucide-react";
import type { ReactNode } from "react";
import { formatBytes, parseAnswerValue } from "@/lib/answer-attachments";
import { MathContent } from "./math-content";

const buttonBase =
  "inline-flex min-h-11 items-center justify-center rounded-md font-black transition duration-150 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-55";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${buttonBase} bg-[var(--brand-green)] px-5 py-3 text-white shadow-[0_12px_24px_rgba(8,124,34,0.2)] hover:bg-[var(--brand-green-bright)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${buttonBase} border border-[var(--line)] bg-white px-5 py-3 text-[var(--ink)] hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2582h2.9087C16.6582 14.2527 17.64 11.9455 17.64 9.2045Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.4673-.8059 5.9564-2.18l-2.9087-2.2582c-.8059.54-1.8368.8591-3.0477.8591-2.3441 0-4.3282-1.5832-5.036-3.71H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.9641 10.7109A5.41 5.41 0 0 1 3.6818 9c0-.5932.1023-1.17.2823-1.7109V4.9573H.9573A8.997 8.997 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0427l3.0068-2.3318Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.3459l2.5814-2.5813C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9573l3.0068 2.3318C4.6718 5.1623 6.6559 3.5795 9 3.5795Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function BackButton({
  label = "Back",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }) {
  return (
    <button
      className={`inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md ${className}`}
      type="button"
      {...props}
    >
      <span aria-hidden="true" className="text-lg leading-none">
        &larr;
      </span>
      <span>{label}</span>
    </button>
  );
}

export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-enter grid min-h-[calc(100vh-4.25rem)] w-full items-center px-4 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-3xl rounded-lg border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-200/70 transition-shadow duration-200 hover:shadow-2xl hover:shadow-slate-200/80 sm:p-8">
        <div className="mb-7 text-center">
          <h2 className="text-2xl font-black text-slate-950">{title}</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="interactive-lift min-h-20 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <strong className="block text-2xl font-black text-slate-950">{value}</strong>
      <span className="mt-1 block text-xs font-bold text-slate-500">{label}</span>
    </div>
  );
}

export function TileIcon({
  children,
  tone = "indigo",
}: {
  children: ReactNode;
  tone?: "indigo" | "emerald" | "orange";
}) {
  const tones = {
    emerald: "bg-emerald-500",
    indigo: "bg-blue-700",
    orange: "bg-amber-500",
  };

  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "available" | "neutral" | "wrong";
}) {
  const tones = {
    available: "bg-emerald-100 text-emerald-700",
    neutral: "bg-slate-200 text-slate-600",
    wrong: "bg-rose-100 text-rose-700",
  };

  return (
    <span className={`selected-pop inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-black ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ResultBlock({ label, text }: { label: string; text: string }) {
  const answer = parseAnswerValue(text);
  const visibleText = answer.text || (answer.attachments.length ? "Document answer attached." : text);

  return (
    <div className="content-rise mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <strong className="block text-xs font-black uppercase text-slate-600">{label}</strong>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
        <MathContent>{visibleText}</MathContent>
      </p>
      {answer.attachments.length > 0 && (
        <div className="mt-3 grid gap-2">
          {answer.attachments.map((attachment) => (
            <div
              className="flex min-h-10 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
              key={attachment.id}
            >
              <FileText aria-hidden="true" className="shrink-0 text-sky-700" size={16} />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-black text-slate-900">{attachment.name}</strong>
                <small className="block text-xs font-bold text-slate-500">{formatBytes(attachment.size)}</small>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
