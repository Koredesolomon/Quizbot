import { PrimaryButton, SecondaryButton } from "./ui";

export function Landing({
  onStart,
  onBrowseSubjects,
}: {
  onStart: () => void;
  onBrowseSubjects: () => void;
}) {
  return (
    <section className="surface-enter mx-auto grid min-h-[calc(100vh-4.25rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">
      <div className="content-rise flex flex-col justify-center">
        <p className="text-sm font-black uppercase text-indigo-600">Practice. Learn. Excel.</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-6xl">
          STEM-JUPEB Test Platform
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
          Take free Physics practice tests, get AI-style marking, review model answers, and receive focused advice for
          your next study session.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryButton type="button" onClick={onStart}>
            Start a Test
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onBrowseSubjects}>
            Browse Subjects
          </SecondaryButton>
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
    <div className="relative min-h-[340px] overflow-hidden" aria-label="AI marked test illustration">
      <div className="gentle-float absolute left-[6%] right-[8%] top-12 min-h-64 rounded-lg border border-indigo-200 bg-gradient-to-b from-white to-indigo-50 p-5 shadow-2xl shadow-indigo-200">
        <div className="mb-5 h-11 rounded-lg bg-indigo-950" />
        <div className="relative mt-3 h-9 rounded-lg border border-emerald-200 bg-emerald-100 before:absolute before:left-3 before:top-2 before:text-xs before:font-black before:text-emerald-700 before:content-['OK']" />
        <div className="relative mt-3 h-9 w-3/4 rounded-lg border border-emerald-200 bg-emerald-100 before:absolute before:left-3 before:top-2 before:text-xs before:font-black before:text-emerald-700 before:content-['OK']" />
        <div className="mt-3 h-9 rounded-lg border border-blue-200 bg-blue-100" />
        <div className="absolute bottom-4 right-4 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-black text-indigo-800">
          AI Score 80%
        </div>
      </div>
      <div className="subtle-pulse absolute bottom-5 left-[12%] h-9 w-40 rounded-lg bg-blue-600" />
      <div className="absolute bottom-16 left-[18%] h-6 w-32 rounded-lg bg-orange-500" />
      <div className="gentle-float absolute right-[8%] top-5 rotate-12 rounded-lg bg-slate-950 px-4 py-3 text-xs font-black text-white">
        JUPEB
      </div>
    </div>
  );
}
