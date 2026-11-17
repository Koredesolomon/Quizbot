"use client";

import type { QuestionPart } from "@/types/platform";
import { MathTextEditor } from "./math-text-editor";
import { SecondaryButton } from "./ui";

export function QuestionPartsEditor({ parts, onChange, disabled }: {
  parts: QuestionPart[];
  onChange: (parts: QuestionPart[]) => void;
  disabled: boolean;
}) {
  const control = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
  const update = (index: number, patch: Partial<QuestionPart>) => onChange(parts.map((part, position) => position === index ? { ...part, ...patch } : part));
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Give each part its own question, model answer and marks. The question total is calculated automatically.</p>
      {parts.map((part, index) => (
        <fieldset key={part.label} disabled={disabled} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <legend className="px-1 text-sm font-black">Part ({part.label})</legend>
          <MathTextEditor label={`Question for part (${part.label})`} placeholder={`Write part (${part.label})`} value={part.prompt} onChange={(prompt) => update(index, { prompt })} required disabled={disabled} />
          <label className="grid gap-1 text-sm font-bold">Model answer for ({part.label})
            <textarea required className={`${control} min-h-24`} value={part.answer} onChange={(event) => update(index, { answer: event.target.value })} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-bold">Marks for ({part.label})
              <input required className={control} type="number" min="1" step="1" value={part.marks || ""} onChange={(event) => update(index, { marks: Number(event.target.value) })} />
            </label>
            <label className="grid gap-1 text-sm font-bold">Answer type
              <select className={control} value={part.answerType ?? "text"} onChange={(event) => update(index, { answerType: event.target.value as QuestionPart["answerType"] })}>
                <option value="text">Written answer</option><option value="numeric">Number</option><option value="expression">Expression</option>
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-sm font-bold">Explanation / marking guidance (optional)
            <textarea className={control} value={part.explanation ?? ""} onChange={(event) => update(index, { explanation: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-bold">Grading keywords (comma separated)
            <input className={control} value={part.keywords?.join(", ") ?? ""} onChange={(event) => update(index, { keywords: event.target.value.split(",").map((word) => word.trim()) })} />
          </label>
          <label className="grid gap-1 text-sm font-bold">Rubric points (one per line, optional)
            <textarea className={control} value={part.rubricPoints?.join("\n") ?? ""} onChange={(event) => update(index, { rubricPoints: event.target.value.split("\n") })} />
          </label>
          {parts.length > 2 && <button className="text-sm font-bold text-rose-700" type="button" onClick={() => onChange(parts.filter((_, position) => position !== index).map((item, position) => ({ ...item, label: String.fromCharCode(97 + position) })))}>Remove part ({part.label})</button>}
        </fieldset>
      ))}
      {parts.length < 12 && <SecondaryButton type="button" disabled={disabled} onClick={() => onChange([...parts, { label: String.fromCharCode(97 + parts.length), prompt: "", answer: "", marks: 1 }])}>Add part ({String.fromCharCode(97 + parts.length)})</SecondaryButton>}
    </div>
  );
}
