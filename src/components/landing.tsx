import { PrimaryButton, SecondaryButton } from "./ui";

export function Landing({
  onStart,
  onBrowseSubjects,
}: {
  onStart: () => void;
  onBrowseSubjects: () => void;
}) {
  return (
    <section className="surface-enter mx-auto grid min-h-[calc(100vh-4.25rem)] max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-14">
      <div className="content-rise flex flex-col justify-center">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-500">Practice. Review. Improve.</p>
        <h1 className="mt-4 max-w-2xl text-5xl font-black leading-[1.02] tracking-normal text-slate-950 sm:text-7xl">
          Simple and powerful test prep
        </h1>
        <p className="mt-6 max-w-xl text-base leading-8 text-slate-500 sm:text-lg">
          Take STEM-JUPEB practice tests, get real AI review after each attempt, and use focused explanations to close
          your weak areas before the next session.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <PrimaryButton type="button" onClick={onStart}>
            start a test
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onBrowseSubjects}>
            browse subjects
          </SecondaryButton>
        </div>
        <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
          <MiniStat value="AI" label="Review" />
          <MiniStat value="24/7" label="Practice" />
          <MiniStat value="PHS" label="Ready" />
        </div>
      </div>
      <div className="content-rise-delay">
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative min-h-[470px] overflow-hidden" aria-label="AI marked test interface preview">
      <div className="absolute inset-x-8 bottom-8 top-10 rounded-lg bg-gradient-to-br from-sky-100 via-emerald-50 to-white" />
      <div className="gentle-float absolute left-[8%] right-[10%] top-12 min-h-[360px] rounded-lg border border-white bg-white/92 p-5 shadow-2xl shadow-sky-100">
        <div className="flex items-center justify-between rounded-lg bg-slate-950 px-5 py-4 text-white">
          <span className="text-sm font-black">PHS 001</span>
          <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-slate-950">live review</span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_150px]">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs font-black uppercase text-slate-400">Question 4</span>
            <div className="mt-3 h-4 w-11/12 rounded-full bg-slate-200" />
            <div className="mt-2 h-4 w-8/12 rounded-full bg-slate-200" />
            <div className="mt-5 space-y-3">
              <div className="h-10 rounded-lg border border-emerald-200 bg-emerald-50" />
              <div className="h-10 rounded-lg border border-sky-200 bg-sky-50" />
              <div className="h-10 rounded-lg border border-slate-200 bg-white" />
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-sky-500 to-emerald-400 p-4 text-white">
            <span className="text-xs font-black uppercase opacity-80">Score</span>
            <strong className="mt-4 block text-5xl font-black">82%</strong>
            <small className="mt-2 block font-bold opacity-90">clear next steps</small>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <span className="text-xs font-black uppercase text-emerald-600">AI Review</span>
          <div className="mt-3 h-3 w-full rounded-full bg-emerald-200" />
          <div className="mt-2 h-3 w-9/12 rounded-full bg-emerald-200" />
        </div>
      </div>
      <div className="subtle-pulse absolute bottom-14 left-[5%] rounded-lg bg-white px-5 py-4 text-sm font-black text-slate-900 shadow-xl shadow-sky-100">
        rubric based
      </div>
      <div className="gentle-float absolute right-[4%] top-8 rounded-lg bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-xl">
        AI mastered
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong className="block text-2xl font-black text-slate-950">{value}</strong>
      <span className="mt-1 block text-xs font-bold uppercase text-slate-400">{label}</span>
    </div>
  );
}
