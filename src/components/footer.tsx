import Link from "next/link";

export function Footer({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark";

  return (
    <footer
      className={`border-t backdrop-blur transition-colors duration-200 ${
        isDark ? "border-[var(--line)] bg-[#f7fbff]/95" : "border-[var(--line)] bg-[var(--background)]/90"
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2 px-5 py-3 text-xs font-medium text-[var(--ink-muted)] sm:flex-row sm:px-10">
        <p>Copyright © 2026 TLCHub. All rights reserved.</p>
        <Link className="transition hover:text-[var(--brand-blue)]" href="/privacy">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
