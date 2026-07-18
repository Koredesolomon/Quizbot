import { comingSoonSubjects, phs001Topics, physicsCourses } from "@/data/platform";
import type { Question } from "@/types/platform";
import { BackButton, Metric, Panel, PrimaryButton, StatusBadge, TileIcon } from "./ui";

const rowClass =
  "flex min-h-18 w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 text-left text-slate-950 transition hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100";
const lockedRowClass =
  "flex min-h-18 w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-slate-950";

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
        <span className="text-xs font-black text-indigo-600">Next</span>
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
    <Panel title="Select Subject" subtitle="Only Physics is open in this first phase.">
      <BackButton className="mb-5" label="Programme" onClick={onBack} />
      <div className="grid gap-3 sm:grid-cols-2">
        {comingSoonSubjects.map((subject) => (
          <button className={lockedRowClass} key={subject} type="button" onClick={onComingSoon}>
            <TileIcon tone="orange">{subject.slice(0, 1)}</TileIcon>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm font-black">{subject}</strong>
              <small className="mt-1 block text-xs font-semibold text-slate-500">Coming Soon</small>
            </span>
          </button>
        ))}
        <button className={rowClass} type="button" onClick={onPhysics}>
          <TileIcon tone="emerald">P</TileIcon>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm font-black">Physics</strong>
            <small className="mt-1 block text-xs font-semibold text-emerald-600">Available</small>
          </span>
        </button>
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
      <div className="space-y-3">
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
      <div className="space-y-3">
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
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Questions" value={String(questions.length)} />
        <Metric label="Marks" value={String(totalMarks)} />
        <Metric label="Time" value="30 min" />
      </div>
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
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
