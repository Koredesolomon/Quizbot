import { comingSoonSubjects, phs001Topics, physicsCourses } from "@/data/platform";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, LockKeyhole, Sparkles } from "lucide-react";
import type { Question } from "@/types/platform";
import { BackButton, Metric, Panel, PrimaryButton, StatusBadge, TileIcon } from "./ui";

const rowClass =
  "interactive-lift flex min-h-18 w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 text-left text-slate-950 transition hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg hover:shadow-indigo-100";
const lockedRowClass =
  "interactive-lift flex min-h-18 w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-slate-950";

export function HowItWorks({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const steps = [
    { icon: ClipboardCheck, title: "Choose a focused test", text: "Pick a subject, course, and topic so every session has a clear purpose." },
    { icon: Sparkles, title: "Take it at your pace", text: "Work through objective and theory questions in one calm, focused session." },
    { icon: CheckCircle2, title: "Get useful feedback", text: "See your score, marking, explanations, and the topics worth revisiting next." },
  ];

  return (
    <Panel title="A clearer way to practise" subtitle="Every session moves you from a question to a useful next step.">
      <BackButton className="mb-6" label="Home" onClick={onBack} />
      <div className="stagger-list grid gap-3">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <div className="flex items-start gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4 sm:p-5" key={title}>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-md text-white ${index === 1 ? "bg-[var(--brand-green)]" : "bg-[var(--brand-blue)]"}`}>
              <Icon aria-hidden="true" size={20} />
            </span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">Step 0{index + 1}</span>
              <strong className="mt-1 block text-base font-black text-[var(--ink)]">{title}</strong>
              <span className="mt-2 block text-sm font-semibold leading-6 text-[var(--ink-muted)]">{text}</span>
            </span>
          </div>
        ))}
      </div>
      <PrimaryButton className="mt-6 w-full" type="button" onClick={onStart}>
        Start a practice session <ArrowRight aria-hidden="true" className="ml-2" size={17} />
      </PrimaryButton>
    </Panel>
  );
}

export function Programme({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <Panel title="Select Programme" subtitle="Choose a programme to get started.">
      <BackButton className="mb-5" label="Home" onClick={onBack} />
      <button className={`${rowClass} min-h-32`} type="button" onClick={onNext}>
        <TileIcon>S</TileIcon>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm font-black">STEM-JUPEB</strong>
          <small className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
            Science, Technology, Engineering and Mathematics Joint Universities Preliminary Examination Board
          </small>
        </span>
        <span className="text-xs font-black text-emerald-600">Next</span>
      </button>
    </Panel>
  );
}

export function Subjects({
  onPhysics,
  onComingSoon,
  onBack,
}: {
  onPhysics: () => void;
  onComingSoon: () => void;
  onBack: () => void;
}) {
  return (
    <Panel title="Choose where to begin" subtitle="Build momentum with one focused subject at a time.">
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton label="Programme" onClick={onBack} />
        <span className="rounded-md bg-[var(--brand-ice)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--brand-blue)]">
          Phase 01
        </span>
      </div>
      <button
        className="interactive-lift group flex w-full items-center gap-4 rounded-lg border-2 border-[var(--brand-green)] bg-[var(--brand-mint)] p-5 text-left transition hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(8,124,34,0.16)] sm:p-6"
        type="button"
        onClick={onPhysics}
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-[var(--brand-green)] text-white shadow-lg shadow-green-900/15">
          <BookOpen aria-hidden="true" size={25} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <strong className="text-lg font-black text-[var(--ink)]">Physics</strong>
            <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--brand-green)]">
              Available now
            </span>
          </span>
          <small className="mt-2 block text-sm font-semibold leading-6 text-[var(--ink-muted)]">
            Start with PHS 001 and practise the foundations at your own pace.
          </small>
        </span>
        <ArrowRight aria-hidden="true" className="shrink-0 text-[var(--brand-green)] transition group-hover:translate-x-1" size={22} />
      </button>
      <div className="mt-8 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--line)]" />
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--ink-muted)]">Coming next</span>
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>
      <div className="stagger-list mt-4 grid gap-3 sm:grid-cols-3">
        {comingSoonSubjects.map((subject) => (
          <button
            className="interactive-lift flex min-h-32 flex-col items-start justify-between gap-5 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4 text-left transition hover:-translate-y-1 hover:border-[var(--brand-blue)] hover:shadow-lg"
            key={subject}
            type="button"
            onClick={onComingSoon}
          >
            <span className="flex w-full items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--accent-blue-soft)] text-sm font-black text-[var(--brand-blue)]">
                {subject.slice(0, 1)}
              </span>
              <LockKeyhole aria-hidden="true" className="text-[var(--ink-muted)]" size={15} />
            </span>
            <span>
              <strong className="block text-sm font-black text-[var(--ink)]">{subject}</strong>
              <small className="mt-1 block text-xs font-semibold text-[var(--ink-muted)]">Coming soon</small>
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

export function Courses({
  onPHS001,
  onComingSoon,
  onBack,
}: {
  onPHS001: () => void;
  onComingSoon: () => void;
  onBack: () => void;
}) {
  return (
    <Panel title="Physics Courses" subtitle="Choose a course.">
      <BackButton className="mb-5" label="Subjects" onClick={onBack} />
      <div className="stagger-list space-y-3">
        {physicsCourses.map((course, index) => (
          <button
            className={index === 0 ? rowClass : lockedRowClass}
            key={course}
            type="button"
            onClick={index === 0 ? onPHS001 : onComingSoon}
          >
            <TileIcon>{index + 1}</TileIcon>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm font-black">{course}</strong>
              <small className="mt-1 block text-xs font-semibold text-slate-500">
                {index === 0 ? "Available" : "Coming Soon"}
              </small>
            </span>
            <StatusBadge tone={index === 0 ? "available" : "neutral"}>
              {index === 0 ? "Available" : "Locked"}
            </StatusBadge>
          </button>
        ))}
      </div>
    </Panel>
  );
}

export function Topics({
  onTopicOne,
  onComingSoon,
  onBack,
}: {
  onTopicOne: () => void;
  onComingSoon: () => void;
  onBack: () => void;
}) {
  return (
    <Panel title="PHS 001" subtitle="Select a topic.">
      <BackButton className="mb-5" label="Courses" onClick={onBack} />
      <div className="stagger-list space-y-3">
        {phs001Topics.map((topic, index) => (
          <button
            className={index === 0 ? rowClass : lockedRowClass}
            key={topic}
            type="button"
            onClick={index === 0 ? onTopicOne : onComingSoon}
          >
            <TileIcon>{index + 1}</TileIcon>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm font-black">{topic}</strong>
              <small className="mt-1 block text-xs font-semibold text-slate-500">
                {index === 0 ? "Physical Quantities and Measurement" : "Coming Soon"}
              </small>
            </span>
            <StatusBadge tone={index === 0 ? "available" : "neutral"}>
              {index === 0 ? "Open" : "Soon"}
            </StatusBadge>
          </button>
        ))}
      </div>
    </Panel>
  );
}

export function Overview({
  questions,
  totalMarks,
  onStart,
  onBack,
}: {
  questions: Question[];
  totalMarks: number;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <Panel title="PHS 001 - Topic 1" subtitle="Physical quantities, measurement, errors, and dimensions.">
      <BackButton className="mb-5" label="Topics" onClick={onBack} />
      <div className="stagger-list grid gap-3 sm:grid-cols-3">
        <Metric label="Questions" value={String(questions.length)} />
        <Metric label="Marks" value={String(totalMarks)} />
        <Metric label="Time" value="30 min" />
      </div>
      <div className="content-rise-delay mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-black text-slate-900">Topics Covered</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>Physical quantities and units</li>
          <li>Measurement and errors</li>
          <li>Dimensional analysis</li>
        </ul>
      </div>
      <PrimaryButton className="mt-6 w-full" disabled={questions.length === 0} type="button" onClick={onStart}>
        Start Test
      </PrimaryButton>
    </Panel>
  );
}
