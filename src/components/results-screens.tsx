import type { CSSProperties } from "react";
import type { MarkedQuestion, Question, TopicBreakdown } from "@/types/platform";
import { MathContent } from "./math-content";
import { BackButton, Metric, Panel, PrimaryButton, ResultBlock, SecondaryButton, StatusBadge, TileIcon } from "./ui";

export function Marking() {
  return (
    <Panel title="AI is reviewing your answers..." subtitle="This may take a few seconds.">
      <div className="marking-orb mx-auto flex h-32 w-32 items-center justify-center rounded-lg border-[10px] border-indigo-50 bg-gradient-to-br from-indigo-600 to-emerald-500 text-4xl font-black text-white shadow-2xl shadow-indigo-200">
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
  questions,
  totalMarks,
  aiSummary,
  onFeedback,
  onBack,
  onDetails,
  onRetry,
}: {
  marked: MarkedQuestion[];
  percent: number;
  score: number;
  answeredCount: number;
  questions: Question[];
  totalMarks: number;
  aiSummary?: string;
  onFeedback: (message: string, rating: number) => void;
  onBack: () => void;
  onDetails: () => void;
  onRetry: () => void;
}) {
  const correct = marked.filter((question) => question.correct).length;
  const unanswered = marked.filter((question) => !question.userAnswer).length;
  const feedbackOptions = [1, 2, 3, 4, 5];

  return (
    <Panel title="Great work!" subtitle="You have completed PHS 001 - Topic 1.">
      <BackButton className="mb-5" label="Overview" onClick={onBack} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="score-ring flex h-36 w-36 flex-col items-center justify-center justify-self-start rounded-full sm:justify-self-center"
          style={
            {
              "--score-value": `${percent}%`,
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
        <strong className="block font-black text-emerald-700">AI Review</strong>
        <div className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-emerald-800">
          {aiSummary ||
            (percent >= 70
              ? "Good foundation. Review the explanations for missed questions and practise the weaker areas before your next attempt."
              : "Keep building. Review the model explanations, focus on missed topics, and retry similar questions after studying.")}
        </div>
      </div>
      <form
        className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);
          const message = String(formData.get("feedback") ?? "").trim();
          const rating = Number(formData.get("rating") ?? 5);

          if (!message) return;
          onFeedback(message, rating);
          form.reset();
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <strong className="text-sm font-black text-slate-900">Platform Feedback</strong>
          <select
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400"
            defaultValue="5"
            name="rating"
          >
            {feedbackOptions.map((option) => (
              <option key={option} value={option}>
                {option}/5
              </option>
            ))}
          </select>
        </div>
        <textarea
          className="mt-3 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          name="feedback"
          placeholder="Share your opinion about the test platform..."
        />
        <PrimaryButton className="mt-3 h-10 min-h-10 px-4 py-0 text-sm" type="submit">
          Send Feedback
        </PrimaryButton>
      </form>
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
      <section className="surface-enter mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="content-rise rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-8">
        <BackButton className="mb-5" label="Summary" onClick={onBack} />
        <h2 className="text-2xl font-black">Detailed Results</h2>
        <div className="stagger-list mt-5 space-y-2">
          {marked.map((item, index) => (
            <button
              className={`interactive-lift flex min-h-12 w-full items-center justify-between rounded-lg border p-3 text-left hover:border-indigo-200 ${
                selectedDetail === index
                  ? "selected-pop border-indigo-300 bg-indigo-50"
                  : "border-slate-200 bg-white"
              }`}
              key={item.id}
              type="button"
              onClick={() => onSelectDetail(index)}
            >
              <span className="font-bold text-slate-700">Question {index + 1}</span>
              <strong className={item.correct ? "text-emerald-700" : "text-rose-700"}>
                {item.awarded}/{item.marks}
              </strong>
            </button>
          ))}
        </div>
      </div>

      <div className="content-rise-delay rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-indigo-700">{question.topic}</p>
            <h2 className="mt-2 text-2xl font-black">Question {selectedDetail + 1}</h2>
          </div>
          <StatusBadge tone={question.correct ? "available" : "wrong"}>
            {question.awarded}/{question.marks} marks
          </StatusBadge>
        </div>
        <p className="mt-5 font-bold text-slate-900">
          <MathContent>{question.prompt}</MathContent>
        </p>
        <ResultBlock label="Your Answer" text={question.userAnswer || "No answer submitted."} />
        <ResultBlock label="Model Answer" text={question.answer} />
        <ResultBlock label="AI Feedback" text={question.aiFeedback} />
        <ResultBlock label="Explanation" text={question.explanation} />

        <div className="stagger-list mt-6 grid gap-3 sm:grid-cols-3">
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

export function ComingSoon({ onAvailable, onBack }: { onAvailable: () => void; onBack: () => void }) {
  return (
    <Panel title="Coming Soon!" subtitle="We are working hard to bring this test to you.">
      <BackButton className="mb-5" label="Back" onClick={onBack} />
      <div className="flex h-32 items-center justify-center rounded-lg border border-orange-200 bg-[repeating-linear-gradient(-45deg,#f97316,#f97316_14px,#ffffff_14px,#ffffff_28px)] text-2xl font-black text-slate-950">
        Soon
      </div>
      <div className="content-rise-delay mt-6 flex w-full flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 text-left sm:flex-row sm:items-center sm:justify-between">
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
