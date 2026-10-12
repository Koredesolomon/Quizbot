"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, CircleHelp, XCircle } from "lucide-react";
import { formatAnswerLetters, optionLetter, questionTypeLabels } from "@/lib/question-answers";
import { correctOptionIndices, type QuestionImportResult } from "@/lib/question-import";
import type { Question, QuestionType } from "@/types/platform";
import { MathContent } from "./math-content";
import { ImagePreview } from "./question-editor";
import { PrimaryButton, SecondaryButton } from "./ui";

const typeTone: Record<QuestionType, string> = {
  objective: "bg-sky-50 text-sky-800",
  multiple: "bg-violet-50 text-violet-800",
  theory: "bg-amber-50 text-amber-800",
};

export function ImportReview({ fileName, result, busy = false, busyLabel = "Importing…", confirmLabel, onConfirm, onCancel }: {
  fileName: string;
  result: QuestionImportResult;
  busy?: boolean;
  busyLabel?: string;
  confirmLabel?: (count: number) => string;
  onConfirm: (questions: Question[]) => void;
  onCancel: () => void;
}) {
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  // Correct options chosen here for questions whose file had no answer.
  const [picked, setPicked] = useState<Record<number, number[]>>({});
  const answered = result.needsAnswer.flatMap(({ question }, index): Question[] => {
    const choice = picked[index] ?? [];
    if (!choice.length) return [];
    const multiple = choice.length > 1 || question.type === "multiple";
    return [{ ...question, type: multiple ? "multiple" : "objective", answer: multiple ? formatAnswerLetters(choice) : question.options![choice[0]] }];
  });
  const selected = [...result.questions.filter((_, index) => !excluded.has(index)), ...answered];
  const togglePick = (questionIndex: number, optionIndex: number) => setPicked((current) => {
    const choice = current[questionIndex] ?? [];
    const next = choice.includes(optionIndex) ? choice.filter((index) => index !== optionIndex) : [...choice, optionIndex].sort((a, b) => a - b);
    return { ...current, [questionIndex]: next };
  });
  const counts = result.questions.reduce<Record<QuestionType, number>>(
    (sum, question) => ({ ...sum, [question.type]: sum[question.type] + 1 }), { objective: 0, multiple: 0, theory: 0 });

  return (
    <section className="space-y-4" aria-label="Review imported questions">
      <div>
        <h3 className="text-xl font-black text-[#10243f]">Review import</h3>
        <p className="mt-1 break-all text-sm text-[#5e7086]">{fileName}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-black">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-emerald-800"><CheckCircle2 size={14} /> {result.questions.length} ready</span>
        {(Object.keys(counts) as QuestionType[]).filter((type) => counts[type]).map((type) => (
          <span key={type} className={`rounded-md px-3 py-2 ${typeTone[type]}`}>{counts[type]} {questionTypeLabels[type]}</span>
        ))}
        {result.needsAnswer.length > 0 && <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-3 py-2 text-sky-800"><CircleHelp size={14} /> {answered.length}/{result.needsAnswer.length} answers chosen</span>}
        {result.skipped.length > 0 && <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-3 py-2 text-rose-700"><XCircle size={14} /> {result.skipped.length} skipped</span>}
        {result.warnings.length > 0 && <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-amber-800"><AlertTriangle size={14} /> {result.warnings.length} to check</span>}
      </div>

      {result.skipped.length > 0 && (
        <details open className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm">
          <summary className="cursor-pointer font-bold text-rose-800">Not imported — fix these in your file and upload again</summary>
          <ul className="mt-2 space-y-1 text-rose-900">
            {result.skipped.map((issue, index) => <li key={index}><strong>{issue.location}:</strong> {issue.message}</li>)}
          </ul>
        </details>
      )}
      {result.warnings.length > 0 && (
        <details className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <summary className="cursor-pointer font-bold text-amber-900">Imported with notes</summary>
          <ul className="mt-2 space-y-1 text-amber-950">
            {result.warnings.map((issue, index) => <li key={index}><strong>{issue.location}:</strong> {issue.message}</li>)}
          </ul>
        </details>
      )}

      {result.needsAnswer.length > 0 && (
        <details open className="rounded-lg border border-sky-200 bg-sky-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-sky-900">Choose the correct answer ({result.needsAnswer.length} question{result.needsAnswer.length === 1 ? "" : "s"} had none in the file)</summary>
          <p className="mt-2 text-xs text-sky-950">Click the correct option. Click more than one to make it an MCQ (multiple answers) question. Questions left without an answer are not imported.</p>
          <ol className="mt-3 max-h-[45vh] space-y-3 overflow-y-auto pr-1">
            {result.needsAnswer.map(({ location, question }, questionIndex) => {
              const choice = picked[questionIndex] ?? [];
              return (
                <li key={questionIndex} className="rounded-lg border border-sky-100 bg-white p-4">
                  <p className="text-xs font-black text-sky-800">{location}</p>
                  <div className="mt-2 text-sm font-semibold text-[#10243f]"><MathContent>{question.prompt}</MathContent></div>
                  {question.imageUrl && <div className="mt-2"><ImagePreview src={question.imageUrl} /></div>}
                  <div className="mt-3 grid gap-1.5 text-sm" role="group" aria-label={`Correct answer for ${location}`}>
                    {question.options?.map((option, optionIndex) => {
                      const chosen = choice.includes(optionIndex);
                      return (
                        <button key={optionIndex} type="button" disabled={busy} aria-pressed={chosen}
                          className={`flex min-h-10 gap-2 rounded-md border px-3 py-2 text-left transition ${chosen ? "border-emerald-300 bg-emerald-50 font-bold text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:bg-white"}`}
                          onClick={() => togglePick(questionIndex, optionIndex)}>
                          <span>{optionLetter(optionIndex)}.</span>
                          <span className="min-w-0 flex-1"><MathContent>{option}</MathContent></span>
                          {chosen && <CheckCircle2 className="shrink-0 text-emerald-600" size={16} aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                  {choice.length > 1 && <p className="mt-2 text-xs font-bold text-violet-800">Will be imported as {questionTypeLabels.multiple}.</p>}
                </li>
              );
            })}
          </ol>
        </details>
      )}

      <ol className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {result.questions.map((question, index) => {
          const correct = correctOptionIndices(question);
          const included = !excluded.has(index);
          return (
            <li key={index} className={`rounded-lg border p-4 transition ${included ? "border-[#d5e2f0] bg-white" : "border-dashed border-slate-300 bg-slate-50 opacity-60"}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                <label className="inline-flex min-h-8 items-center gap-2 text-[#10243f]">
                  <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={included} disabled={busy}
                    onChange={() => setExcluded((current) => {
                      const next = new Set(current);
                      if (next.has(index)) next.delete(index); else next.add(index);
                      return next;
                    })} />
                  Question {index + 1}
                </label>
                <span className={`rounded px-2 py-1 ${typeTone[question.type]}`}>{questionTypeLabels[question.type]}</span>
                {question.answerBox && <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-800">+ explanation box</span>}
                <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">{question.marks} mark{question.marks === 1 ? "" : "s"}</span>
                <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">{question.topic}</span>
              </div>
              <div className="mt-3 text-sm font-semibold text-[#10243f]"><MathContent>{question.prompt}</MathContent></div>
              {question.imageUrl && <div className="mt-2"><ImagePreview src={question.imageUrl} /></div>}
              {question.type !== "theory" ? (
                <ul className="mt-3 grid gap-1.5 text-sm">
                  {question.options?.map((option, optionIndex) => {
                    const isCorrect = correct.includes(optionIndex);
                    return (
                      <li key={optionIndex} className={`flex gap-2 rounded-md px-3 py-2 ${isCorrect ? "bg-emerald-50 font-bold text-emerald-900" : "bg-slate-50 text-slate-700"}`}>
                        <span>{optionLetter(optionIndex)}.</span>
                        <span className="min-w-0 flex-1"><MathContent>{option}</MathContent></span>
                        {isCorrect && <CheckCircle2 className="shrink-0 text-emerald-600" size={16} aria-label="Correct answer" />}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
                  <strong className="block text-xs uppercase">Model answer</strong>
                  <MathContent>{question.answer}</MathContent>
                </div>
              )}
              {question.explanation && <p className="mt-2 text-xs text-[#5e7086]"><strong>Explanation:</strong> <MathContent>{question.explanation}</MathContent></p>}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap justify-end gap-3">
        <SecondaryButton type="button" disabled={busy} onClick={onCancel}>Cancel</SecondaryButton>
        <PrimaryButton type="button" disabled={busy || !selected.length} onClick={() => onConfirm(selected)}>
          {busy ? busyLabel : confirmLabel ? confirmLabel(selected.length) : `Import ${selected.length} question${selected.length === 1 ? "" : "s"}`}
        </PrimaryButton>
      </div>
    </section>
  );
}
