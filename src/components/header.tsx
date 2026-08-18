import { Moon, Sun } from "lucide-react";
import type { Screen } from "@/types/platform";
import { PrimaryButton } from "./ui";

export function Header({
  theme,
  onNavigate,
  onToggleTheme,
}: {
  theme: "light" | "dark";
  onNavigate: (screen: Screen) => void;
  onToggleTheme: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <header
      className={`sticky top-0 z-20 border-b backdrop-blur transition-colors duration-200 ${
        isDark ? "border-slate-700 bg-slate-950/90" : "border-slate-200 bg-white/90"
      }`}
    >
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
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 hover:shadow-md ${
              isDark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-700"
            }`}
            type="button"
            onClick={onToggleTheme}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun aria-hidden="true" size={17} /> : <Moon aria-hidden="true" size={17} />}
          </button>
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
