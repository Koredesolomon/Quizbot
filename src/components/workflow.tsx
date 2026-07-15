import { workflowSteps } from "@/data/platform";

export function Workflow() {
  return (
    <section id="workflow" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
        <h2 className="text-center text-xl font-black">Workflow Guideline</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {workflowSteps.map((step, index) => (
            <div
              className="flex min-h-16 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
              key={step}
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                {index + 1}
              </span>
              <strong className="text-sm font-black">{step}</strong>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs font-semibold text-slate-500">
          Only PHS 001 - Topic 1 is available now. More subjects, courses, and topics will be added progressively.
        </p>
      </div>
    </section>
  );
}
