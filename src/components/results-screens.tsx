import type { CSSProperties } from "react";
import { questions, totalMarks } from "@/data/platform";
import type { MarkedQuestion, TopicBreakdown } from "@/types/platform";
import { Metric, Panel, PrimaryButton, ResultBlock, SecondaryButton, StatusBadge, TileIcon } from "./ui";

export function Marking() {
  return (
    <Panel title="AI is reviewing your answers..." subtitle="This may take a few seconds.">
      <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-lg border-[10px] border-indigo-50 bg-gradient-to-br from-indigo-600 to-emerald-500 text-4xl font-black text-white shadow-2xl shadow-indigo-200">
        AI
      </div>
      <div className="mt-8 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div className="marking-progress h-full w-2/5 rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500" />
      </div>
      <p className="mt-4 text-center text-sm font-semibold text-slate-500">
        Checking answers, explanations, and advice.
      </p>
    </Panel>
  );
}

export function Results({
  marked,
  percent,
  score,
  answeredCount,
  onDetails,
  onRetry,
}: {
  marked: MarkedQuestion[];
  percent: number;
  score: number;
  answeredCount: number;
  onDetails: () => void;
  onRetry: () => void;
}) {
  const correct = marked.filter((question) => question.correct).length;
  const unanswered = marked.filter((question) => !question.userAnswer).length;

  return (
    <Panel title="Great work!" subtitle="You have completed PHS 001 - Topic 1.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="flex h-36 w-36 flex-col items-center justify-center justify-self-start rounded-full sm:justify-self-center"
          style={
            {
              background: `radial-gradient(circle at center, #ffffff 58%, transparent 59%), conic-gradient(#4f46e5 ${percent}%, #e2e8f0 0)`,
            } as CSSProperties
          }
        >
          <span className="text-3xl font-black text-slate-950">{percent}%</span>
          <small className="font-bold text-slate-500">
            {score}/{totalMarks}
          </small>
        </div>
        <Metric label="Correct" value={String(correct)} />
        <Metric label="Answered" value={`${answeredCount}/${questions.length}`} />
        <Metric label="Unanswered" value={String(unanswered)} />
      </div>
      <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <strong className="block font-black text-emerald-700">
          {percent >= 70 ? "Good foundation." : "Keep building."}
        </strong>
        <p className="mt-2 text-sm font-semibold leading-6 text-emerald-800">
          {percent >= 70
            ? "Review the explanations for missed questions and practise more dimensional analysis."
            : "Focus on SI base quantities, instrument errors, and the difference between scalar and vector quantities."}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <PrimaryButton type="button" onClick={onDetails}>
          View Detailed Results
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onRetry}>
          Retake Test
        </SecondaryButton>
      </div>
    </Panel>
  );
}

export function Details({
  marked,
  selectedDetail,
  topicBreakdown,
  onSelectDetail,
  onBack,
}: {
  marked: MarkedQuestion[];
  selectedDetail: number;
  topicBreakdown: TopicBreakdown[];
  onSelectDetail: (index: number) => void;
  onBack: () => void;
}) {
  const question = marked[selectedDetail] ?? marked[0];

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-8">
        <SecondaryButton className="mb-5" type="button" onClick={onBack}>
          Back to Summary
        </SecondaryButton>
        <h2 className="text-2xl font-black">Detailed Results</h2>
        <div className="mt-5 space-y-2">
          {marked.map((item, index) => (
            <button
              className={`flex min-h-12 w-full items-center justify-between rounded-lg border p-3 text-left transition hover:border-indigo-200 ${
                selectedDetail === index
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-slate-200 bg-white"
              }`}
              key={item.id}
              type="button"
              onClick={() => onSelectDetail(index)}
            >
              <span className="font-bold text-slate-700">Question {item.id}</span>
              <strong className={item.correct ? "text-emerald-700" : "text-rose-700"}>
                {item.awarded}/{item.marks}
              </strong>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-indigo-700">{question.topic}</p>
            <h2 className="mt-2 text-2xl font-black">Question {question.id}</h2>
          </div>
          <StatusBadge tone={question.correct ? "available" : "wrong"}>
            {question.awarded}/{question.marks} marks
          </StatusBadge>
        </div>
        <p className="mt-5 font-bold text-slate-900">{question.prompt}</p>
        <ResultBlock label="Your Answer" text={question.userAnswer || "No answer submitted."} />
        <ResultBlock label="Model Answer" text={question.answer} />
        <ResultBlock label="AI Feedback" text={question.aiFeedback} />
        <ResultBlock label="Explanation" text={question.explanation} />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {topicBreakdown.map((topic) => (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4" key={topic.topic}>
              <strong className="block text-lg font-black text-indigo-800">{topic.percent}%</strong>
              <small className="mt-1 block text-xs font-bold leading-5 text-slate-500">{topic.topic}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ComingSoon({ onAvailable }: { onAvailable: () => void }) {
  return (
    <Panel title="Coming Soon!" subtitle="We are working hard to bring this test to you.">
      <div className="flex h-32 items-center justify-center rounded-lg border border-orange-200 bg-[repeating-linear-gradient(-45deg,#f97316,#f97316_14px,#ffffff_14px,#ffffff_28px)] text-2xl font-black text-slate-950">
        Soon
      </div>
      <div className="mt-6 flex w-full flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 text-left sm:flex-row sm:items-center sm:justify-between">
        <TileIcon tone="emerald">P</TileIcon>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm font-black">Available Now</strong>
          <small className="mt-1 block text-xs font-semibold text-slate-500">Physics - PHS 001 - Topic 1</small>
        </span>
        <SecondaryButton className="h-10 min-h-10 px-4 py-0 text-sm" type="button" onClick={onAvailable}>
          Start Practice
        </SecondaryButton>
      </div>
    </Panel>
  );
}
