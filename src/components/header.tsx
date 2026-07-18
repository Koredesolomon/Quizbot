import type { Screen } from "@/types/platform";
import { PrimaryButton } from "./ui";

export function Header({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          className="text-left"
          type="button"
          onClick={() => onNavigate("landing")}
          aria-label="Go to home"
        >
          <span className="block text-sm font-black tracking-wide text-indigo-700">STEM-JUPEB</span>
          <span className="block text-xs font-semibold text-slate-500">Test Platform</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-sm font-black text-indigo-700 transition hover:-translate-y-0.5 hover:shadow-md"
            type="button"
            onClick={() => onNavigate("subjects")}
            title="Browse tests"
          >
            B
          </button>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-sm font-black text-emerald-700 transition hover:-translate-y-0.5 hover:shadow-md"
            type="button"
            onClick={() => onNavigate("admin")}
            title="Admin access"
          >
            A
          </button>
          <PrimaryButton className="h-10 min-h-10 px-4 py-0 text-sm" type="button" onClick={() => onNavigate("programme")}>
            Start Test
          </PrimaryButton>
        </div>
      </div>
    </header>
  );
}
