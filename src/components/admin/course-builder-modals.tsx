import { useRef, useState } from "react";
import { CheckCircle2, GripVertical, MoreVertical, Pencil, Trash2, UploadCloud } from "lucide-react";
import { questionImportAccept, questionImportFormats, type QuestionImportResult } from "@/lib/question-import";
import type { Question } from "@/types/platform";
import { ImportFormatGuide } from "../import-format-guide";
import { ImportReview } from "../import-review";
import { PrimaryButton } from "../ui";
import { emptyCourseForm, emptyQuizForm, subjectCatalog } from "./config";
import { Field, ShellActionButton, TextArea } from "./ui";

export function CourseEditModal({
  form,
  onChange,
  onCancel,
  onDelete,
  onSave,
}: {
  form: typeof emptyCourseForm;
  onChange: (form: typeof emptyCourseForm) => void;
  onCancel: () => void;
  onDelete: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#071a38]/45 px-4 py-6">
      <section className="w-full max-w-3xl rounded-xl border border-[#d5e2f0] bg-white p-6 text-[#10243f] shadow-[0_24px_90px_rgba(8,43,99,0.22)]">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <span>
            <span className="text-xs font-black uppercase tracking-wide text-[#06479b]">Course</span>
            <h3 className="mt-1 text-2xl font-black">Edit course</h3>
          </span>
          <button className="min-h-10 px-2 text-sm font-black text-[#596273]" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Course title" value={form.title} onChange={(title) => onChange({ ...form, title })} />
          <Field label="Course code" value={form.code} onChange={(code) => onChange({ ...form, code })} />
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Subject
            <select
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-emerald-400"
              value={form.subject}
              onChange={(event) => onChange({ ...form, subject: event.target.value })}
            >
              {subjectCatalog.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.title}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Status
            <select
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-emerald-400"
              value={form.status}
              onChange={(event) => onChange({ ...form, status: event.target.value as typeof form.status })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <TextArea label="Course description" value={form.description} onChange={(description) => onChange({ ...form, description })} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-rose-200 px-4 text-sm font-black text-rose-700 transition hover:bg-rose-50"
            type="button"
            onClick={onDelete}
          >
            <Trash2 size={16} /> Delete Course
          </button>
          <div className="flex items-center gap-3">
            <button className="min-h-11 rounded-md px-4 text-sm font-black text-[#596273]" type="button" onClick={onCancel}>
              Cancel
            </button>
            <PrimaryButton className="min-h-11 gap-2 px-5" type="button" onClick={onSave}>
              <Pencil size={16} /> Save Course
            </PrimaryButton>
          </div>
        </div>
      </section>
    </div>
  );
}

export function TopicEditorShell({
  title,
  summary,
  onTitleChange,
  onSummaryChange,
  onCancel,
  onConfirm,
}: {
  title: string;
  summary: string;
  onTitleChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-152px)] rounded-lg border-2 border-[#4772f2] bg-[#f6f7fb]">
      <div className="grid grid-cols-[36px_1fr] gap-6 px-8 py-6">
        <GripVertical className="mt-4 text-[#9aa3b2]" size={28} />
        <div className="grid gap-12">
          <input
            className="min-h-20 rounded-lg border-0 bg-white px-8 text-2xl font-semibold text-[#404756] outline-none placeholder:text-[#737b8d]"
            placeholder="Add a module title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
          <textarea
            className="min-h-72 resize-y rounded-lg border-0 bg-white px-8 py-8 text-2xl font-semibold leading-9 text-[#404756] outline-none placeholder:text-[#737b8d]"
            placeholder="Add a module summary"
            value={summary}
            onChange={(event) => onSummaryChange(event.target.value)}
          />
          <div className="flex justify-end gap-8 pr-1 text-xl font-semibold">
            <button className="min-h-16 px-2 text-[#596273]" type="button" onClick={onCancel}>Cancel</button>
            <button className="min-h-16 rounded-lg bg-[#e9edff] px-8 text-[#3867ee]" type="button" onClick={onConfirm}>Ok</button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 border-t border-[#d9dde5] px-8 py-8">
        <ShellActionButton label="Topic" onClick={() => undefined} />
        <ShellActionButton label="Subtopic" onClick={() => undefined} />
        <button
          className="ml-auto grid h-16 w-16 place-items-center rounded-full bg-white text-[#9aa3b2]"
          type="button"
          aria-label="Module options"
        >
          <MoreVertical size={30} />
        </button>
      </div>
    </div>
  );
}

export function SubtopicModal({
  title,
  notes,
  titlePlaceholder = "Add a subtopic title",
  notesPlaceholder = "Add subtopic notes",
  onTitleChange,
  onNotesChange,
  onCancel,
  onConfirm,
}: {
  title: string;
  notes: string;
  titlePlaceholder?: string;
  notesPlaceholder?: string;
  onTitleChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#071a38]/45 px-4 py-6">
      <div className="w-full max-w-3xl rounded-xl border border-[#d5e2f0] bg-[#f6f7fb] p-6 shadow-[0_24px_90px_rgba(8,43,99,0.26)]">
        <div className="grid grid-cols-[28px_1fr] gap-5">
          <GripVertical className="mt-4 text-[#9aa3b2]" size={24} />
          <div className="grid gap-5">
            <input
              className="min-h-16 rounded-lg border-0 bg-white px-5 text-xl font-semibold text-[#404756] outline-none placeholder:text-[#737b8d]"
              placeholder={titlePlaceholder}
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              autoFocus
            />
            <textarea
              className="min-h-48 resize-y rounded-lg border-0 bg-white px-5 py-5 text-lg font-semibold leading-8 text-[#404756] outline-none placeholder:text-[#737b8d]"
              placeholder={notesPlaceholder}
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
            />
            <div className="flex justify-end gap-5 text-base font-semibold">
              <button className="min-h-12 px-2 text-[#596273]" type="button" onClick={onCancel}>Cancel</button>
              <button className="min-h-12 rounded-lg bg-[#e9edff] px-6 text-[#3867ee]" type="button" onClick={onConfirm}>Ok</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuizUploadModal({
  title,
  onTitleChange,
  onCancel,
  onRead,
  onCreate,
  onCreateEmpty,
  settings,
  onSettingsChange,
  subject,
}: {
  subject: string;
  title: string;
  onTitleChange: (value: string) => void;
  onCancel: () => void;
  onRead: (file: File) => Promise<QuestionImportResult>;
  onCreate: (questions: Question[], onProgress?: (stage: number) => void) => Promise<boolean>;
  onCreateEmpty: () => Promise<boolean>;
  settings: typeof emptyQuizForm;
  onSettingsChange: (settings: typeof emptyQuizForm) => void;
}) {
  const inputId = "course-quiz-upload";
  const [file, setFile] = useState<File | null>(null);
  const [review, setReview] = useState<QuestionImportResult | null>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "review" | "uploading" | "creating" | "done" | "error">("idle");
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const uploading = status === "reading" || status === "uploading" || status === "creating";
  const busyRef = useRef(false);
  const steps = ["Reading file", "Creating quiz", "Saving pictures and questions"];
  const read = async (selected: File) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setFile(selected);
    setStatus("reading");
    setError("");
    try {
      setReview(await onRead(selected));
      setStatus("review");
    } catch (error) {
      setError(error instanceof Error ? error.message : "The file could not be read.");
      setStatus("error");
    } finally { busyRef.current = false; }
  };
  const create = async (questions: Question[]) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setStatus("uploading");
    setStage(1);
    setError("");
    try {
      if (!await onCreate(questions, setStage)) throw new Error("Upload did not complete. Please try again.");
      setSavedCount(questions.length);
      setStage(3);
      setStatus("done");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed. Please try again.");
      setStatus("review");
    } finally { busyRef.current = false; }
  };
  const createEmpty = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setStatus("creating");
    setError("");
    try {
      if (!await onCreateEmpty()) throw new Error("Quiz could not be created.");
      onCancel();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Quiz could not be created.");
      setStatus("error");
    } finally { busyRef.current = false; }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#071a38]/45 px-4 py-6">
      <div role="dialog" aria-modal="true" aria-labelledby="quiz-upload-title" aria-busy={uploading} className="max-h-full w-full max-w-3xl overflow-y-auto rounded-xl border border-[#d5e2f0] bg-[#f6f7fb] p-6 shadow-[0_24px_90px_rgba(8,43,99,0.26)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wide text-[#06479b]">Quiz</span>
            <h3 id="quiz-upload-title" className="mt-1 text-2xl font-black text-[#10243f]">Create Quiz</h3>
          </div>
          <button className="min-h-10 px-2 text-sm font-black text-[#596273] disabled:opacity-40" type="button" disabled={uploading} onClick={onCancel}>{status === "done" ? "Done" : "Cancel"}</button>
        </div>
        <div className="grid gap-5">
          <input
            aria-label="Quiz title"
            className="min-h-16 rounded-lg border-0 bg-white px-5 text-xl font-semibold text-[#404756] outline-none placeholder:text-[#737b8d]"
            placeholder="Quiz title"
            value={title}
            disabled={uploading || status === "done"}
            onChange={(event) => onTitleChange(event.target.value)}
            autoFocus
          />
          <fieldset disabled={uploading || status === "done"} className="grid gap-3 sm:max-w-xs">
            <Field label="Passing score (%)" type="number" value={String(settings.passingPercent)} onChange={(value) => onSettingsChange({ ...settings, passingPercent: Number(value) })} />
          </fieldset>
          {(status === "review" || status === "uploading") && review && file ? (
            <div className="rounded-lg border border-[#d5e2f0] bg-white p-4">
              {error && <p role="alert" className="mb-3 text-sm font-bold text-rose-700">{error}</p>}
              {status === "uploading" && <p role="status" className="mb-3 text-sm font-bold text-[#06479b]">{steps[stage] ?? "Finishing upload"}…</p>}
              <ImportReview fileName={file.name} result={review} busy={status === "uploading"} busyLabel="Creating quiz…"
                confirmLabel={(count) => `Create quiz with ${count} question${count === 1 ? "" : "s"}`}
                onConfirm={(questions) => void create(questions)}
                onCancel={() => { setReview(null); setFile(null); setStatus("idle"); setError(""); }} />
            </div>
          ) : <>
            <div className="rounded-lg border border-[#d5e2f0] bg-white p-4">
              <p className="mb-3 text-sm text-[#5e7086]">Create an empty quiz, then add questions one at a time.</p>
              <PrimaryButton type="button" disabled={uploading || status === "done" || !title.trim()} onClick={() => void createEmpty()}>
                {status === "creating" ? "Creating…" : "Create Quiz & Add Questions"}
              </PrimaryButton>
            </div>
            <div className="grid min-h-72 place-items-center rounded-lg border-2 border-dashed border-[#8dbcf5] bg-white p-8 text-center">
              <div className="w-full min-w-0">
                {status === "done" ? <CheckCircle2 className="mx-auto text-emerald-600" size={46} /> : <UploadCloud className="mx-auto text-[#3867ee]" size={46} />}
                <strong className="mt-4 block break-all text-xl font-black text-[#10243f]">{file ? file.name : "Bulk upload quiz questions"}</strong>
                {file && <small className="mt-1 block text-[#737b8d]">{(file.size / 1024).toFixed(1)} KB</small>}
                <div role="status" aria-live="polite" className="mt-4 text-sm font-bold text-[#06479b]">
                  {status === "reading" ? "Reading questions, options and pictures…" : status === "done" ? `Quiz created with ${savedCount} question${savedCount === 1 ? "" : "s"}.` : ""}
                </div>
                {status === "done" && <progress className="mt-4 h-3 w-full accent-[#3867ee]" value={3} max={3} aria-label="Quiz upload steps completed" />}
                {error && <p role="alert" className="mt-3 text-sm font-bold text-rose-700">{error}</p>}
                {!uploading && status !== "done" && <label htmlFor={inputId} className="mt-3 inline-flex cursor-pointer rounded-md bg-[#e9edff] px-6 py-3 text-base font-black text-[#3867ee]">{file ? "Choose another file" : "Choose file"}</label>}
                <small className="mt-4 block font-semibold text-[#737b8d]">{questionImportFormats} · Objective, MCQ (multiple answers) and theory questions, with pictures</small>
                <input id={inputId} className="sr-only" type="file" disabled={uploading || status === "done"}
                  accept={questionImportAccept}
                  onChange={(event) => { const selected = event.target.files?.[0]; event.currentTarget.value = ""; if (selected) void read(selected); }} />
              </div>
            </div>
            {status !== "done" && <ImportFormatGuide key={error ? "guide-open" : "guide"} subject={subject} defaultOpen={Boolean(error)} />}
          </>}
        </div>
      </div>
    </div>
  );
}
