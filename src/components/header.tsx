"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, ClipboardList, LogOut, Moon, Sun, UserCircle } from "lucide-react";
import type { Screen } from "@/types/platform";

export function Header({
  theme,
  studentName,
  studentAvatarUrl,
  onNavigate,
  onStudentSignOut,
  onToggleTheme,
}: {
  theme: "light" | "dark";
  studentName?: string;
  studentAvatarUrl?: string;
  onNavigate: (screen: Screen) => void;
  onStudentSignOut: () => void;
  onToggleTheme: () => void;
}) {
  const isDark = theme === "dark";
  const firstName = studentName?.trim().split(/\s+/)[0];
  const initials =
    studentName
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "ST";
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProfileOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  const handleProfileNavigate = (screen: Screen) => {
    setIsProfileOpen(false);
    onNavigate(screen);
  };

  const handleProfileSignOut = () => {
    setIsProfileOpen(false);
    onStudentSignOut();
  };

  return (
    <header
      className={`sticky top-0 z-20 border-b backdrop-blur transition-colors duration-200 ${
        isDark ? "border-white/10 bg-slate-950/86" : "border-slate-100 bg-white/82"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <button
          className="flex items-center gap-3 text-left"
          type="button"
          onClick={() => onNavigate("landing")}
          aria-label="Go to home"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 text-sm font-black text-white shadow-lg shadow-sky-100">
            SJ
          </span>
          <span>
            <span className="block text-sm font-black tracking-wide text-slate-950">STEM-JUPEB</span>
            <span className="block text-xs font-semibold text-slate-500">AI test platform</span>
          </span>
        </button>
        <nav className="hidden items-center gap-7 text-sm font-black text-slate-500 lg:flex">
          <button className="transition hover:text-slate-950" type="button" onClick={() => onNavigate("landing")}>
            Home
          </button>
          <button className="transition hover:text-slate-950" type="button" onClick={() => onNavigate("subjects")}>
            Subjects
          </button>
          <button className="transition hover:text-slate-950" type="button" onClick={() => onNavigate("landing")}>
            Feature
          </button>
        </nav>
        <div className="flex items-center gap-2">
          <button
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700 hover:shadow-md ${
              isDark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-100 bg-white text-slate-700"
            }`}
            type="button"
            onClick={onToggleTheme}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun aria-hidden="true" size={17} /> : <Moon aria-hidden="true" size={17} />}
          </button>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sm font-black text-sky-700 transition hover:-translate-y-0.5 hover:shadow-md lg:hidden"
            type="button"
            onClick={() => onNavigate("subjects")}
            title="Browse tests"
          >
            <BookOpen aria-hidden="true" size={17} />
          </button>
          {firstName ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border px-2.5 text-sm font-black transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md sm:px-3 ${
                  isDark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-sky-100 bg-white text-sky-700"
                }`}
                type="button"
                onClick={() => setIsProfileOpen((open) => !open)}
                title="Student profile"
              >
                <span className="grid h-7 w-7 overflow-hidden rounded-full bg-sky-50 text-xs font-black text-sky-700">
                  {studentAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="h-full w-full object-cover" src={studentAvatarUrl} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    initials
                  )}
                </span>
                <span className="hidden max-w-24 truncate sm:inline">{firstName}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`transition ${isProfileOpen ? "rotate-180" : ""}`}
                  size={15}
                />
              </button>
              {isProfileOpen && (
                <div
                  className={`absolute right-0 mt-3 w-56 overflow-hidden rounded-lg border p-2 text-sm shadow-xl ${
                    isDark ? "border-slate-800 bg-slate-950 text-slate-100" : "border-slate-100 bg-white text-slate-700"
                  }`}
                  role="menu"
                >
                  <div className={`px-3 py-2 ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="grid h-11 w-11 overflow-hidden rounded-full bg-gradient-to-br from-sky-100 to-emerald-100 text-sm font-black text-sky-700">
                        {studentAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className="h-full w-full object-cover"
                            src={studentAvatarUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center">{initials}</span>
                        )}
                      </span>
                      <span>
                        <span className="block text-xs font-bold uppercase tracking-wide">Student profile</span>
                        <span className={`block text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {studentAvatarUrl ? "Google photo" : "Avatar"}
                        </span>
                      </span>
                    </div>
                    <span className="block text-xs font-bold uppercase tracking-wide">Signed in as</span>
                    <span className={`block truncate font-black ${isDark ? "text-white" : "text-slate-950"}`}>
                      {studentName}
                    </span>
                  </div>
                  <button
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 font-bold transition ${
                      isDark ? "hover:bg-slate-900" : "hover:bg-sky-50 hover:text-sky-700"
                    }`}
                    type="button"
                    role="menuitem"
                    onClick={() => handleProfileNavigate("studentDashboard")}
                  >
                    <UserCircle aria-hidden="true" size={16} />
                    Profile
                  </button>
                  <button
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 font-bold transition ${
                      isDark ? "hover:bg-slate-900" : "hover:bg-sky-50 hover:text-sky-700"
                    }`}
                    type="button"
                    role="menuitem"
                    onClick={() => handleProfileNavigate("subjects")}
                  >
                    <BookOpen aria-hidden="true" size={16} />
                    Subjects
                  </button>
                  <button
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 font-bold transition ${
                      isDark ? "hover:bg-slate-900" : "hover:bg-sky-50 hover:text-sky-700"
                    }`}
                    type="button"
                    role="menuitem"
                    onClick={() => handleProfileNavigate("overview")}
                  >
                    <ClipboardList aria-hidden="true" size={16} />
                    Test overview
                  </button>
                  <div className={`my-2 h-px ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
                  <button
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 font-bold transition ${
                      isDark ? "hover:bg-rose-950/50 hover:text-rose-200" : "hover:bg-rose-50 hover:text-rose-600"
                    }`}
                    type="button"
                    role="menuitem"
                    onClick={handleProfileSignOut}
                  >
                    <LogOut aria-hidden="true" size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="inline-flex h-10 items-center justify-center rounded-full border border-sky-100 bg-white px-4 text-sm font-black text-sky-700 transition hover:-translate-y-0.5 hover:shadow-md"
              type="button"
              onClick={() => onNavigate("student")}
              title="Student sign in"
            >
              <span>Sign in</span>
            </button>
          )}
          {!firstName && (
            <button
              className="hidden h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:shadow-xl sm:inline-flex"
              type="button"
              onClick={() => onNavigate("studentRegister")}
            >
              Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
