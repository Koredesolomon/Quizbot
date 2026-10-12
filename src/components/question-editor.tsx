"use client";

import { useRef, useState } from "react";
import { ImagePlus, UploadCloud, Trash2 } from "lucide-react";
import type { CourseContent } from "@/lib/api";
import { formatAnswerLetters, isChoiceType, optionLetter, questionTypeLabels, resolveAnswerIndices } from "@/lib/question-answers";
import { questionInput, quizQuestionContexts, type QuestionInput, type QuizQuestionContext } from "@/lib/question-editor";
import type { Question } from "@/types/platform";
import { MathContent } from "./math-content";
import { MathTextEditor } from "./math-text-editor";
import { PrimaryButton, SecondaryButton } from "./ui";

const maxOptions = 8;
const control = "w-full rounded-md border border-[#d5e2f0] bg-white px-3 py-2.5 text-sm font-medium text-[#10243f] outline-none focus:border-[#06479b] focus:ring-2 focus:ring-blue-100";

function initialForm(question?: Question, subject = "Physics", context?: QuizQuestionContext) {
  const options = question?.options?.length ? question.options : ["", "", "", ""];
  const answer = question?.answer ?? "";
  const letter = answer.trim().match(/^(?:option\s*)?([A-E])[).:-]?$/i);
  const selectedAnswer = options.find((option) => option.trim().toLowerCase() === answer.trim().toLowerCase())
    ?? (letter ? options[letter[1].toUpperCase().charCodeAt(0) - 65] : undefined) ?? answer;
  return {
    type: question?.type ?? "objective" as Question["type"],
    topic: question?.topic ?? context?.topic ?? "General",
    subject: question?.subject ?? context?.subject ?? subject,
    prompt: question?.prompt ?? "",
    imageUrl: question?.imageUrl ?? "",
    options,
    answerBox: Boolean(question?.answerBox),
    answer: question?.type === "theory" || question?.type === "multiple" ? answer : selectedAnswer,
    // Correct option indices for MCQ (multiple answers) questions.
    correct: question?.type === "multiple" ? resolveAnswerIndices(answer, options) ?? [] : [] as number[],
    explanation: question?.explanation ?? "",
    marks: String(question?.marks ?? 2),
    difficulty: question?.difficulty ?? "medium" as NonNullable<Question["difficulty"]>,
    learningObjective: question?.learningObjective ?? "",
    rubricPoints: question?.rubricPoints?.join("\n") ?? "",
    commonMistakes: question?.commonMistakes?.join("\n") ?? "",
    keywords: question?.keywords?.join(", ") ?? "",
  };
}

export function QuestionEditor({ question, subject, context, courses, onSave, onCancel }: {
  question?: Question;
  subject: string;
  context?: QuizQuestionContext;
  courses: CourseContent[];
  onSave: (input: QuestionInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [editorVersion, setEditorVersion] = useState(0);
  const [form, setForm] = useState(() => initialForm(question, subject, context));
  const [targetQuizId, setTargetQuizId] = useState(question ? "keep" : context?.quizId ?? "");
  const [saving, setSaving] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageName, setImageName] = useState("");
  const [draggingImage, setDraggingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageDragDepthRef = useRef(0);
  const imageReadBusyRef = useRef(false);
  const busyRef = useRef(false);
  const quizChoices = quizQuestionContexts(courses);
  const target = context ?? quizChoices.find((choice) => choice.quizId === targetQuizId);
  const busy = saving || readingImage;
  const change = <K extends keyof typeof form>(key: K, value: typeof form[K]) => setForm((current) => ({ ...current, [key]: value }));
  const lines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const save = async (addAnother = false) => {
    if (busyRef.current || imageReadBusyRef.current) return;
    setError("");
    setNotice("");
    const choice = isChoiceType(form.type);
    const answer = form.type === "multiple" ? formatAnswerLetters(form.correct) : form.answer.trim();
    if (![form.topic, form.prompt, answer].every((value) => value.trim())) {
      setError(form.type === "multiple" ? "Complete the topic and question, and tick at least one correct answer." : "Complete the topic, question, and answer.");
      return;
    }
    const marks = Number(form.marks);
    if (!Number.isInteger(marks) || marks < 1) {
      setError("Marks must be a positive whole number.");
      return;
    }
    const options = form.options.map((option) => option.trim());
    if (choice && (options.length < 2 || options.some((option) => !option))) {
      setError("Enter at least two options. Fill or remove any blank options.");
      return;
    }
    if (form.type === "objective" && !options.includes(form.answer.trim())) {
      setError("Select the correct answer from the options.");
      return;
    }
    busyRef.current = true;
    setSaving(true);
    try {
      await onSave({
        ...(question ? questionInput(question) : {}),
        ...(!context && targetQuizId !== "keep" ? {
          courseId: target?.courseId ?? "", moduleId: target?.moduleId ?? "", subtopicId: target?.subtopicId ?? "", quizId: target?.quizId ?? "",
        } : context && !question ? {
          courseId: context.courseId, moduleId: context.moduleId, subtopicId: context.subtopicId, quizId: context.quizId,
        } : {}),
        subject: target ? target.subject : form.subject,
        type: form.type,
        topic: form.topic.trim(),
        prompt: form.prompt.trim(),
        imageUrl: form.imageUrl.trim(),
        options: choice ? options : [],
        answerBox: choice && form.answerBox ? true : undefined,
        answer,
        explanation: form.explanation.trim(),
        marks,
        difficulty: form.difficulty,
        learningObjective: form.learningObjective.trim(),
        rubricPoints: lines(form.rubricPoints),
        commonMistakes: lines(form.commonMistakes),
        keywords: form.type === "theory" ? form.keywords.split(/[,;\n]/).map((word) => word.trim()).filter(Boolean) : [],
      });
      if (addAnother) {
        setForm({ ...initialForm(undefined, form.subject, target), topic: form.topic, type: form.type, marks: form.marks, difficulty: form.difficulty });
        setEditorVersion((current) => current + 1);
        setImageName("");
        setImageError("");
        setNotice("Question saved. You can add another.");
      } else {
        onCancel();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Question could not be saved.");
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  };

  const uploadImage = async (file: File | null) => {
    if (!file || busyRef.current || imageReadBusyRef.current) return;
    setImageError("");
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) || file.size > 1_500_000) {
      setImageError("Choose a PNG, JPG, WebP, or GIF image up to 1.5 MB.");
      return;
    }
    imageReadBusyRef.current = true;
    setReadingImage(true);
    try {
      const imageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Image could not be loaded."));
        reader.readAsDataURL(file);
      });
      change("imageUrl", imageUrl);
      setImageName(file.name);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Image could not be loaded.");
    } finally { imageReadBusyRef.current = false; setReadingImage(false); }
  };

  return (
    <form className="space-y-5 rounded-lg border border-[#d5e2f0] bg-white p-5" aria-busy={busy}
      onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <h3 className="text-xl font-black">{question ? "Edit Question" : "Add Question"}</h3>
      <p className="text-sm text-[#5e7086]">{context?.label ?? quizChoices.find((choice) => choice.quizId === question?.quizId)?.label ?? (question?.quizId ? "Linked quiz" : `${subject} question bank`)}</p>
      <fieldset disabled={busy} className="grid gap-4 disabled:opacity-70">
        {!context && <label className="grid gap-1.5 text-sm font-bold">Quiz assignment
          <select className={control} value={targetQuizId} onChange={(event) => {
            setTargetQuizId(event.target.value);
            const choice = quizChoices.find((item) => item.quizId === event.target.value);
            if (choice) setForm((current) => ({ ...current, topic: choice.topic, subject: choice.subject }));
            else change("subject", question?.subject ?? subject);
          }}>
            {question && <option value="keep">Keep existing assignment</option>}
            <option value="">Question bank only</option>
            {quizChoices.filter((choice) => choice.subject === subject).map((choice) => <option key={choice.quizId} value={choice.quizId}>{choice.label}</option>)}
          </select>
        </label>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-bold">Question Type
            <select className={control} value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as Question["type"], answer: "", correct: [] }))}>
              {(["objective", "multiple", "theory"] as const).map((type) => <option key={type} value={type}>{questionTypeLabels[type]}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-bold">Topic<input required className={control} value={form.topic} onChange={(event) => change("topic", event.target.value)} /></label>
          <label className="grid gap-1.5 text-sm font-bold">Marks<input required type="number" min="1" step="1" className={control} value={form.marks} onChange={(event) => change("marks", event.target.value)} /></label>
          <label className="grid gap-1.5 text-sm font-bold">Difficulty<select className={control} value={form.difficulty} onChange={(event) => change("difficulty", event.target.value as typeof form.difficulty)}>
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select></label>
        </div>
        <section className="grid gap-1.5" aria-label="Question editor">
          <h4 className="text-sm font-bold">Question</h4>
          <MathTextEditor key={editorVersion} required disabled={busy} label="Question" value={form.prompt} onChange={(value) => change("prompt", value)} placeholder="Write your question (supports LaTeX)" />
        </section>
        <section className="space-y-2" aria-label="Image / Diagram">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold">Image / Diagram <span className="font-normal text-[#5e7086]">(optional)</span></h4>
            {form.imageUrl && <button type="button" disabled={busy} className="inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-rose-700 hover:underline disabled:opacity-50"
              onClick={() => { change("imageUrl", ""); setImageName(""); setImageError(""); }}><Trash2 size={14} /> Remove image</button>}
          </div>
          <div className={`overflow-hidden rounded-xl border-2 border-dashed transition ${draggingImage && !busy ? "border-[#06479b] bg-[#e2efff] ring-4 ring-blue-100" : "border-[#b8d8ff] bg-[#f8fbff]"}`}
            onDragEnter={(event) => {
              if (busy || !event.dataTransfer.types.includes("Files")) return;
              event.preventDefault(); imageDragDepthRef.current++; setDraggingImage(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault(); imageDragDepthRef.current = Math.max(0, imageDragDepthRef.current - 1);
              if (!imageDragDepthRef.current) setDraggingImage(false);
            }}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = busy ? "none" : "copy"; }}
            onDrop={(event) => {
              event.preventDefault(); imageDragDepthRef.current = 0; setDraggingImage(false);
              if (busy) return;
              if (event.dataTransfer.files.length > 1) { setImageError("Upload one image at a time."); return; }
              void uploadImage(event.dataTransfer.files[0] ?? null);
            }}>
            <button type="button" disabled={busy} aria-label={form.imageUrl ? "Replace image or diagram" : "Upload image or diagram"}
              className="flex min-h-52 w-full flex-col items-center justify-center gap-3 px-6 py-7 text-center transition hover:bg-[#edf5ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-300 disabled:cursor-wait disabled:opacity-60"
              onClick={() => imageInputRef.current?.click()}>
              {form.imageUrl ? <ImagePreview src={form.imageUrl} /> : <span className="grid h-14 w-14 place-items-center rounded-full bg-[#e2efff] text-[#06479b]"><ImagePlus size={28} aria-hidden="true" /></span>}
              <span className="text-sm font-bold text-[#10243f]">{readingImage ? "Reading image…" : draggingImage ? "Drop your image here" : form.imageUrl ? imageName || "Current diagram" : "Drag and drop an image or diagram here"}</span>
              {!readingImage && <span className="inline-flex items-center gap-2 rounded-md border border-[#8dbcf5] bg-white px-4 py-2 text-sm font-bold text-[#06479b]"><UploadCloud size={16} aria-hidden="true" />{form.imageUrl ? "Replace image" : "Browse files"}</span>}
              <span className="text-xs text-[#5e7086]">PNG, JPG, WebP or GIF · Up to 1.5 MB</span>
            </button>
            <input ref={imageInputRef} className="sr-only" type="file" tabIndex={-1} disabled={busy} aria-label="Image or diagram file" accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => { const file = event.target.files?.[0] ?? null; event.currentTarget.value = ""; void uploadImage(file); }} />
          </div>
          {imageError && <p role="alert" className="text-sm font-bold text-rose-700">{imageError}</p>}
        </section>
        {isChoiceType(form.type) ? <>
          <div className="grid gap-3 sm:grid-cols-2">{form.options.map((option, index) => <div key={index} className="flex items-end gap-2">
            <label className="grid flex-1 gap-1.5 text-sm font-bold">Option {optionLetter(index)}<input required className={control} value={option}
              onChange={(event) => {
                const value = event.target.value;
                setForm((current) => ({ ...current, options: current.options.map((item, i) => i === index ? value : item), answer: current.answer === option ? value : current.answer }));
              }} /></label>
            {form.options.length > 2 && <button type="button" className="min-h-10 px-2 text-xs font-bold text-rose-700" aria-label={`Remove option ${optionLetter(index)}`}
              onClick={() => setForm((current) => ({
                ...current,
                options: current.options.filter((_, i) => i !== index),
                answer: current.answer === option ? "" : current.answer,
                correct: current.correct.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
              }))}>Remove</button>}
          </div>)}</div>
          {form.options.length < maxOptions && <SecondaryButton className="justify-self-start" type="button" onClick={() => change("options", [...form.options, ""])}>Add option</SecondaryButton>}
          {form.type === "objective" ? <label className="grid gap-1.5 text-sm font-bold">Correct Answer<select required className={control} value={form.answer} onChange={(event) => change("answer", event.target.value)}>
            <option value="">Select the correct option</option>
            {form.answer && !form.options.includes(form.answer) && <option value={form.answer}>Current answer: {form.answer} — select an option</option>}
            {form.options.map((option, index) => option.trim() && <option key={index} value={option}>{optionLetter(index)}: {option}</option>)}
          </select></label> : <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-bold">Correct Answers <span className="font-normal text-[#5e7086]">(tick every correct option)</span></legend>
            {form.options.map((option, index) => <label key={index} className="flex min-h-10 items-center gap-3 rounded-md border border-[#d5e2f0] px-3 text-sm has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50">
              <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={form.correct.includes(index)}
                onChange={() => change("correct", form.correct.includes(index) ? form.correct.filter((i) => i !== index) : [...form.correct, index].sort((a, b) => a - b))} />
              <span className="font-bold">{optionLetter(index)}.</span><span className="min-w-0 truncate">{option || "(empty option)"}</span>
            </label>)}
          </fieldset>}
          <label className="flex min-h-10 items-start gap-3 rounded-md border border-[#d5e2f0] bg-[#f8fbff] px-3 py-2.5 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#06479b]" checked={form.answerBox} onChange={(event) => change("answerBox", event.target.checked)} />
            <span><strong>Also show an answer box</strong> so students explain their choice.
              <span className="block text-xs text-[#5e7086]">With 2+ marks, the option earns half the marks and the AI marks the explanation for the rest. Put the model reasoning in Explanation below.</span></span>
          </label>
        </> : <label className="grid gap-1.5 text-sm font-bold">Model Answer<textarea required className={`${control} min-h-24`} value={form.answer} onChange={(event) => change("answer", event.target.value)} /></label>}
        <label className="grid gap-1.5 text-sm font-bold">{isChoiceType(form.type) && form.answerBox ? "Model explanation (used to mark the student's explanation)" : "Explanation / Feedback (optional)"}<textarea className={`${control} min-h-24`} value={form.explanation} onChange={(event) => change("explanation", event.target.value)} /></label>
        <label className="grid gap-1.5 text-sm font-bold">Learning Objective (optional)<input className={control} value={form.learningObjective} onChange={(event) => change("learningObjective", event.target.value)} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-bold">Rubric Points (one per line)<textarea className={`${control} min-h-24`} value={form.rubricPoints} onChange={(event) => change("rubricPoints", event.target.value)} /></label>
          <label className="grid gap-1.5 text-sm font-bold">Common Mistakes (one per line)<textarea className={`${control} min-h-24`} value={form.commonMistakes} onChange={(event) => change("commonMistakes", event.target.value)} /></label>
        </div>
        {form.type === "theory" && <label className="grid gap-1.5 text-sm font-bold">Grading Keywords (comma separated)<input className={control} value={form.keywords} onChange={(event) => change("keywords", event.target.value)} /></label>}
      </fieldset>
      <details className="rounded-md border border-[#d5e2f0] p-3"><summary className="cursor-pointer text-sm font-bold">Preview question and answer</summary>
        <div className="mt-3 space-y-3"><MathContent>{form.prompt || "Question preview"}</MathContent>
          {form.imageUrl && <ImagePreview src={form.imageUrl} />}
          {isChoiceType(form.type) && <ol className="list-inside list-[upper-alpha]">{form.options.map((option, index) => <li key={index}><MathContent>{option}</MathContent></li>)}</ol>}
          <p className="text-xs font-bold">{form.type === "theory" ? "Model answer" : form.type === "multiple" ? "Correct answers" : "Correct answer"}</p>
          <MathContent>{form.type === "multiple" ? formatAnswerLetters(form.correct) : form.answer}</MathContent>
          <p className="text-xs font-bold">Explanation</p><MathContent>{form.explanation}</MathContent>
        </div>
      </details>
      {error && <p role="alert" className="text-sm font-bold text-rose-700">{error}</p>}
      {notice && <p role="status" className="text-sm font-bold text-emerald-700">{notice}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <SecondaryButton type="button" disabled={busy} onClick={onCancel}>Cancel</SecondaryButton>
        {!question && <SecondaryButton type="button" disabled={busy} onClick={() => void save(true)}>Save & Add Another</SecondaryButton>}
        <PrimaryButton type="submit" disabled={busy}>{saving ? "Saving…" : readingImage ? "Reading image…" : question ? "Save Changes" : "Save Question"}</PrimaryButton>
      </div>
    </form>
  );
}

export function ImagePreview({ src }: { src: string }) {
  // Question diagrams can be uploaded data URLs or externally hosted images.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="max-h-64 max-w-full rounded object-contain" src={src} alt="Question diagram" />;
}
