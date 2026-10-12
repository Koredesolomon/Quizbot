import type { ReactNode } from "react";
import { CalendarDays, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function PageHeading({ title, subtitle, action }: { title: string; subtitle: string; action: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-normal">{title}</h1>
        <p className="mt-1 text-sm font-semibold text-[#5e7086]">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, toolbar, children }: { title: string; toolbar?: ReactNode; children: ReactNode }) {
  return (
    <section className="content-rise rounded-lg border border-[#d5e2f0] bg-white p-4 shadow-[0_18px_55px_rgba(8,43,99,0.07)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-black">{title}</h2>
        {toolbar}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({ icon: Icon, label, value, trend, tone }: { icon: LucideIcon; label: string; value: string; trend: string; tone: "blue" | "green" | "purple" | "rose" }) {
  const tones = {
    blue: "bg-[#edf5ff] text-[#06479b]",
    green: "bg-[#edf8ef] text-[#087c22]",
    purple: "bg-violet-50 text-violet-700",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-lg border border-[#d5e2f0] bg-white p-5 shadow-[0_18px_55px_rgba(8,43,99,0.06)]">
      <span className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon size={19} />
      </span>
      <span className="mt-4 block text-sm font-bold text-[#5e7086]">{label}</span>
      <strong className="mt-1 block text-3xl font-black">{value}</strong>
      <small className="mt-2 block text-xs font-black text-[#087c22]">↑ {trend}</small>
    </div>
  );
}

export function SideItem({ icon: Icon, label, active, badge = 0, onClick }: { icon: LucideIcon; label: string; active: boolean; badge?: number; onClick: () => void }) {
  return (
    <button
      className={`flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left transition ${
        active ? "bg-[#06479b] text-white shadow-lg shadow-blue-950/20" : "text-blue-100/85 hover:bg-white/10 hover:text-white"
      }`}
      type="button"
      onClick={onClick}
    >
      <Icon size={17} />
      <span className="min-w-0 flex-1">{label}</span>
      {badge > 0 && <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-black text-[#06479b]">{badge}</span>}
    </button>
  );
}

export function ProfileMenuItem({
  icon: Icon,
  label,
  destructive = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-black transition ${
        destructive ? "text-rose-600 hover:bg-rose-50" : "text-[#10243f] hover:bg-[#edf5ff] hover:text-[#06479b]"
      }`}
      type="button"
      onClick={onClick}
    >
      <Icon size={16} />
      <span className="min-w-0 flex-1">{label}</span>
    </button>
  );
}

export function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th className="border-b border-[#d5e2f0] bg-[#f8fbff] px-3 py-3 text-xs font-black text-[#5e7086]" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, rowIndex) => (
            <tr className="border-b border-[#d5e2f0]" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="border-b border-[#e8f0fa] px-3 py-3 align-top font-semibold text-[#10243f]" key={`${rowIndex}-${cellIndex}`}>
                  {cell}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td className="px-3 py-8 text-center text-sm font-bold text-[#5e7086]" colSpan={headers.length}>No records yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ShellActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="inline-flex min-h-12 items-center gap-3 rounded-md border border-[#c4cad4] bg-white px-5 text-sm font-black text-[#596273] transition hover:border-[#8dbcf5] hover:bg-[#f8fbff] hover:text-[#06479b]"
      type="button"
      onClick={onClick}
    >
      <Plus className="text-[#aab2bf]" size={20} />
      {label}
    </button>
  );
}

export function Field({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-black text-[#5e7086]">
      {label}
      <input className="h-10 rounded-md border border-[#d5e2f0] bg-[#f8fbff] px-3 text-sm font-semibold text-[#10243f] outline-none focus:border-[#06479b]" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-black text-[#5e7086]">
      {label}
      <textarea className="min-h-20 resize-y rounded-md border border-[#d5e2f0] bg-[#f8fbff] p-3 text-sm font-semibold text-[#10243f] outline-none focus:border-[#06479b]" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function DatePill() {
  return (
    <span className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d5e2f0] bg-white px-3 text-xs font-black text-[#5e7086]">
      Sep 22, 2026 <CalendarDays size={15} />
    </span>
  );
}

export function ActionButton({ icon: Icon, label, tone, onClick }: { icon: LucideIcon; label: string; tone: "blue" | "green" | "purple" | "orange"; onClick: () => void }) {
  const tones = {
    blue: "bg-[#edf5ff] text-[#06479b]",
    green: "bg-[#edf8ef] text-[#087c22]",
    purple: "bg-violet-50 text-violet-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <button className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-black ${tones[tone]}`} type="button" onClick={onClick}>
      <Icon size={16} />
      {label}
    </button>
  );
}
