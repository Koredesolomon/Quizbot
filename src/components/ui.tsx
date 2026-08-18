import { FileText } from "lucide-react";
import type { ReactNode } from "react";
import { formatBytes, parseAnswerValue } from "@/lib/answer-attachments";
import { MathContent } from "./math-content";

const buttonBase =
  "inline-flex min-h-11 items-center justify-center rounded-lg font-black transition duration-150 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-55";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${buttonBase} bg-indigo-600 px-5 py-3 text-white shadow-indigo-200 hover:bg-indigo-700 ${className}`}
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
      className={`${buttonBase} border border-slate-200 bg-white px-5 py-3 text-blue-950 hover:border-indigo-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BackButton({
  label = "Back",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }) {
  return (
    <button
      className={`inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 hover:shadow-md ${className}`}
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
    <section className="surface-enter mx-auto grid min-h-[calc(100vh-4.25rem)] w-full max-w-3xl items-center px-4 py-10 sm:px-6">
      <div className="rounded-lg border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-200/70 transition-shadow duration-200 hover:shadow-2xl hover:shadow-slate-200/80 sm:p-8">
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
    indigo: "bg-indigo-600",
    orange: "bg-orange-500",
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
              <FileText aria-hidden="true" className="shrink-0 text-indigo-700" size={16} />
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
