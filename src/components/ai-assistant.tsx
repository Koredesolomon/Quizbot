"use client";

import { MessageCircle, Sparkles, X } from "lucide-react";
import { useState } from "react";
import type { MarkedQuestion, Question, Screen, StudentAttempt, StudentFeedback } from "@/types/platform";

type AiAssistantProps = {
  screen: Screen;
  questions: Question[];
  answers: Record<string, string>;
  marked: MarkedQuestion[];
  attempts: StudentAttempt[];
  feedback: StudentFeedback[];
  currentQuestion: number;
  studentName?: string;
  adminName?: string;
  isAdmin: boolean;
  isStudentSignedIn: boolean;
  aiSummary?: string;
};

export function TlchubAiAssistant(props: AiAssistantProps) {
  void props;
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-2">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-lg shadow-slate-950/10">
          Hubpilot
        </span>
        <button
          aria-label="Open Hubpilot"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white shadow-2xl shadow-blue-950/25 transition hover:-translate-y-0.5 hover:bg-[var(--brand-blue-deep)] focus:outline-none focus:ring-4 focus:ring-sky-200"
          type="button"
          onClick={() => setIsComingSoonOpen(true)}
        >
          <MessageCircle aria-hidden="true" size={24} />
        </button>
      </div>

      {isComingSoonOpen && (
        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
            <h2 className="text-base font-black text-slate-950">Hubpilot</h2>
            <button
              aria-label="Close Hubpilot"
              className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
              type="button"
              onClick={() => setIsComingSoonOpen(false)}
            >
              <X aria-hidden="true" size={20} />
            </button>
          </header>

          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div className="max-w-sm">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sky-50 text-[var(--brand-blue)]">
                <Sparkles aria-hidden="true" size={24} />
              </span>
              <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950">Coming soon</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                We&apos;re working on Hubpilot and it will be available soon.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 px-5 py-4">
            <div className="rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400">
              Assistant chat is coming soon...
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
