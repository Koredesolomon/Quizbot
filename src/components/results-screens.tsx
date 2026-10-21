import { Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { describeAnswer } from "@/lib/question-answers";
import type { MarkedQuestion, QuizQuestion } from "@/types/platform";
import { MathContent } from "./math-content";
import { BackButton, Metric, Panel, PrimaryButton, ResultBlock, SecondaryButton, StatusBadge } from "./ui";

export function Marking() {
  return (
    <Panel title="AI is reviewing your answers..." subtitle="This can take a minute or two for written answers.">
      <div className="marking-orb mx-auto flex h-32 w-32 items-center justify-center rounded-lg border-[10px] border-sky-50 bg-[#082b63] text-4xl font-black text-white shadow-2xl shadow-sky-100">
        AI
      </div>
      <div className="mt-8 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div className="marking-progress h-full w-2/5 rounded-full bg-emerald-600" />
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
  aiSummarySource,
  onFeedback,
  onBack,
  onDetails,
  onRetry,
}: {
  marked: MarkedQuestion[];
  percent: number;
  score: number;
  answeredCount: number;
  questions: QuizQuestion[];
  totalMarks: number;
  aiSummary?: string;
  aiSummarySource?: "ai" | "auto";
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
        <strong className="block font-black text-emerald-700">{aiSummarySource === "ai" ? "AI Review" : "Summary"}</strong>
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
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-400"
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
          className="mt-3 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
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
  onSelectDetail,
  onBack,
}: {
  marked: MarkedQuestion[];
  selectedDetail: number;
  onSelectDetail: (index: number) => void;
  onBack: () => void;
}) {
  const question = marked[selectedDetail] ?? marked[0];

  return (
      <section className="surface-enter mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="content-rise rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-8">
        <BackButton className="mb-5" label="Summary" onClick={onBack} />
        <h2 className="text-2xl font-black">Detailed Results</h2>
        <div className="stagger-list mt-5 space-y-2">
          {marked.map((item, index) => (
            <button
              className={`interactive-lift flex min-h-12 w-full items-center justify-between rounded-lg border p-3 text-left hover:border-emerald-200 ${
                selectedDetail === index
                  ? "selected-pop border-emerald-300 bg-emerald-50"
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
            <p className="text-xs font-black uppercase text-emerald-700">{question.topic}</p>
            <h2 className="mt-2 text-2xl font-black">Question {selectedDetail + 1}</h2>
          </div>
          <StatusBadge tone={question.correct ? "available" : "wrong"}>
            {question.awarded}/{question.marks} marks
          </StatusBadge>
        </div>
        <div className="mt-5 font-bold text-slate-900">
          <MathContent>{question.prompt}</MathContent>
        </div>
        <ResultBlock label="Your Answer" text={question.userAnswer ? describeAnswer(question, question.userAnswer) : "No answer submitted."} />
        <ResultBlock label={question.type === "multiple" ? "Correct Answers" : "Model Answer"} text={describeAnswer(question, question.answer)} />
        {question.userAnswer && (
          <ResultBlock
            icon={question.feedbackSource === "ai" ? <Sparkles aria-hidden="true" className="text-[var(--brand-green)]" size={14} /> : undefined}
            label={feedbackLabel(question.feedbackSource)}
            text={question.aiFeedback}
          />
        )}
        {question.explanation && <ResultBlock label="Explanation" text={question.explanation} />}
      </div>
    </section>
  );
}

export function ComingSoon({ onBack }: { onBack: () => void }) {
  return (
    <Panel title="Coming Soon!" subtitle="We are working hard to bring this test to you.">
      <BackButton className="mb-5" label="Back" onClick={onBack} />
      <div className="flex h-32 items-center justify-center rounded-lg border border-orange-200 bg-[repeating-linear-gradient(-45deg,#f97316,#f97316_14px,#ffffff_14px,#ffffff_28px)] text-2xl font-black text-slate-950">
        Soon
      </div>
    </Panel>
  );
}

function feedbackLabel(source: MarkedQuestion["feedbackSource"]) {
  if (source === "ai") return "AI Feedback";
  if (source === "keyword") return "Auto-marked by keywords";
  return "Feedback";
}
