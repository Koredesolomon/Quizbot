import type { ReactNode } from "react";
import { PrimaryButton, SecondaryButton } from "./ui";
import { Bot, ClipboardCheck, LayoutDashboard, LogIn, PenLine } from "lucide-react";

export function Landing({
  onStart,
  onBrowseSubjects,
}: {
  onStart: () => void;
  onBrowseSubjects: () => void;
}) {
  return (
    <section className="surface-enter relative mx-auto w-full max-w-[1440px] overflow-hidden px-5 py-12 sm:px-10 lg:px-16 lg:py-16">
      <div className="content-rise mx-auto flex max-w-4xl flex-col items-center text-center">
        <div className="mb-6 flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-green)]">
          <span className="h-px w-10 bg-[var(--brand-green)]" />
          The focused practice room
        </div>
        <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.04em] text-[var(--ink)] sm:text-7xl">
          Study with a little more <em className="font-medium text-[var(--brand-blue)]">clarity.</em>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-8 text-[var(--ink-muted)] sm:text-lg">
          AI-Powered STEM Practice for Smarter Learning and Better Results
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <PrimaryButton className="rounded-md bg-[var(--brand-green)] px-6 shadow-[0_12px_24px_rgba(8,124,34,0.24)] hover:bg-[var(--brand-green-bright)]" type="button" onClick={onStart}>
            Begin a session <span aria-hidden="true" className="ml-2 text-lg">↗</span>
          </PrimaryButton>
          <SecondaryButton className="rounded-md border-transparent bg-transparent px-2 text-[var(--ink)] shadow-none hover:bg-transparent hover:text-[var(--brand-blue)]" type="button" onClick={onBrowseSubjects}>
            Browse subjects <span aria-hidden="true" className="ml-2">→</span>
          </SecondaryButton>
        </div>
        <div className="mt-14 grid w-full max-w-md grid-cols-3 gap-6 border-t border-[var(--line)] pt-5">
          <MiniStat value="AI" label="review" />
          <MiniStat value="24/7" label="practice" />
          <MiniStat value="PHS" label="ready" />
        </div>
      </div>
      <div className="content-rise-delay mx-auto mt-14 w-full max-w-5xl lg:mt-20">
        <HeroVisual />
      </div>
      <div className="mt-16 grid gap-4 border-t border-[var(--line)] pt-8 md:grid-cols-3 lg:mt-20 lg:gap-8">
        <LandingMoment number="01" title="Start where you are" text="Choose one focused topic and begin without building a study plan from scratch." />
        <LandingMoment number="02" title="See the reasoning" text="Finish a real attempt, then get marking and explanations that show what to revisit." />
        <LandingMoment number="03" title="Know what is next" text="Use your dashboard to return to the weak spots while the details are still fresh." />
      </div>
    </section>
  );
}

function LandingMoment({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="content-rise rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
      <span className="text-[10px] font-black tracking-[0.16em] text-[var(--brand-green)]">{number}</span>
      <h2 className="mt-5 text-xl font-black tracking-tight text-[var(--ink)]">{title}</h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-[var(--ink-muted)]">{text}</p>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="flow-visual relative min-h-[500px] overflow-hidden" aria-label="The student journey from login to dashboard">
      <div className="absolute inset-5 rounded-[2rem] border border-[var(--line)] bg-[var(--surface-muted)] sm:inset-8" />
      <div className="absolute bottom-4 right-2 h-48 w-48 rounded-full bg-[var(--accent-blue-soft)] blur-3xl" />
      <div className="flow-board relative mx-2 mt-8 rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_30px_60px_rgba(2,34,77,0.18)] sm:mx-10 sm:mt-12 sm:p-7">
        <div className="flex items-end justify-between border-b border-[var(--line)] pb-5">
          <div>
            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--brand-green)]">Your learning loop</span>
            <span className="mt-1 block text-lg font-black tracking-tight text-[var(--ink)]">From first click to clear next step</span>
          </div>
          <span className="hidden rounded-md bg-[var(--brand-mint)] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[var(--brand-green)] sm:block">5 steps</span>
        </div>
        <div className="flow-map mt-7" role="list">
          <div className="flow-track" aria-hidden="true" />
          <FlowStep icon={<LogIn size={19} />} number="01" label="Login" detail="Your account" tone="blue" />
          <FlowStep icon={<ClipboardCheck size={19} />} number="02" label="Choose" detail="A focused test" tone="green" />
          <FlowStep icon={<PenLine size={19} />} number="03" label="Take test" detail="Answer with intent" tone="blue" />
          <FlowStep icon={<Bot size={19} />} number="04" label="AI grading" detail="Feedback that helps" tone="green" />
          <FlowStep icon={<LayoutDashboard size={19} />} number="05" label="Dashboard" detail="See what is next" tone="blue" />
        </div>
        <div className="mt-7 flex items-center justify-between border-t border-[var(--line)] pt-4 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          <span>Practice</span>
          <span className="text-[var(--brand-green)]">Improve</span>
          <span>Repeat</span>
        </div>
      </div>
      <div className="subtle-pulse absolute bottom-8 left-0 rounded-md border border-[var(--line)] bg-[var(--brand-blue-deep)] px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-xl sm:bottom-10 sm:left-4">
        rubric based
      </div>
      <div className="gentle-float absolute right-0 top-3 rounded-md bg-[var(--brand-blue)] px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-xl sm:right-2 sm:top-5">
        guided review
      </div>
    </div>
  );
}

function FlowStep({
  icon,
  number,
  label,
  detail,
  tone,
}: {
  icon: ReactNode;
  number: string;
  label: string;
  detail: string;
  tone: "blue" | "green";
}) {
  return (
    <div className="flow-step relative z-10" role="listitem">
      <div className={`flow-icon flow-icon-${tone}`}>{icon}</div>
      <span className="mt-3 block text-[10px] font-black tracking-[0.12em] text-[var(--ink-muted)]">{number}</span>
      <strong className="mt-1 block text-sm font-black text-[var(--ink)]">{label}</strong>
      <small className="mt-1 block text-[10px] font-semibold leading-4 text-[var(--ink-muted)]">{detail}</small>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong className="block text-2xl font-black tracking-[-0.04em] text-[var(--ink)]">{value}</strong>
      <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">{label}</span>
    </div>
  );
}
