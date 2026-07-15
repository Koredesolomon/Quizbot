import { questions } from "@/data/platform";
import { PrimaryButton, SecondaryButton } from "./ui";

export function TestInterface({
  answers,
  currentQuestion,
  onAnswer,
  onCurrentQuestion,
  onSubmit,
}: {
  answers: Record<number, string>;
  currentQuestion: number;
  onAnswer: (id: number, value: string) => void;
  onCurrentQuestion: (index: number) => void;
  onSubmit: () => void;
}) {
  const question = questions[currentQuestion];

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid min-h-[620px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/70 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-6 border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
          <div>
            <p className="text-xs font-black uppercase text-slate-500">PHS 001 - Topic 1</p>
            <h2 className="mt-2 text-xl font-black">Questions</h2>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((item, index) => {
              const isCurrent = index === currentQuestion;
              const isAnswered = Boolean(answers[item.id]);

              return (
                <button
                  className={`aspect-square rounded-lg border text-sm font-black transition ${
                    isCurrent
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : isAnswered
                        ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                        : "border-slate-300 bg-white text-slate-600"
                  }`}
                  key={item.id}
                  type="button"
                  onClick={() => onCurrentQuestion(index)}
                >
                  {item.id}
                </button>
              );
            })}
          </div>
          <div className="mt-auto grid gap-2 text-xs font-bold text-slate-500">
            <LegendItem className="bg-indigo-600" label="Current" />
            <LegendItem className="bg-emerald-500" label="Answered" />
            <LegendItem className="border border-slate-300 bg-white" label="Not answered" />
          </div>
        </aside>

        <section className="p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-indigo-700">Question {question.id}</p>
              <h2 className="mt-2 text-xl font-black leading-7 text-slate-950">{question.prompt}</h2>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-800">
              {question.marks} marks
            </span>
          </div>

          {question.type === "objective" ? (
            <div className="mt-6 space-y-3">
              {question.options?.map((option, index) => (
                <label
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50 hover:border-indigo-200"
                  key={option}
                >
                  <input
                    checked={answers[question.id] === option}
                    className="h-4 w-4 accent-emerald-500"
                    name={`question-${question.id}`}
                    type="radio"
                    onChange={() => onAnswer(question.id, option)}
                  />
                  <span className="font-semibold text-slate-500">{String.fromCharCode(65 + index)}.</span>
                  <strong className="font-bold text-slate-900">{option}</strong>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              className="mt-6 min-h-52 w-full resize-y rounded-lg border border-slate-200 bg-white p-4 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              value={answers[question.id] ?? ""}
              onChange={(event) => onAnswer(question.id, event.target.value)}
              placeholder="Type your answer here..."
            />
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <SecondaryButton
              disabled={currentQuestion === 0}
              type="button"
              onClick={() => onCurrentQuestion(Math.max(0, currentQuestion - 1))}
            >
              Previous
            </SecondaryButton>
            {currentQuestion === questions.length - 1 ? (
              <PrimaryButton type="button" onClick={onSubmit}>
                Submit Test
              </PrimaryButton>
            ) : (
              <PrimaryButton type="button" onClick={() => onCurrentQuestion(currentQuestion + 1)}>
                Next
              </PrimaryButton>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <b className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
