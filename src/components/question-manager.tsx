"use client";

import { useRef, useState } from "react";
import { Eye, Pencil, Plus, Upload } from "lucide-react";
import type { CourseContent } from "@/lib/api";
import { parseQuestionImportFile } from "@/lib/question-import";
import { questionInput, type QuestionInput, type QuizQuestionContext } from "@/lib/question-editor";
import type { Question } from "@/types/platform";
import { ImagePreview, QuestionEditor } from "./question-editor";
import { MathContent } from "./math-content";
import { PrimaryButton, SecondaryButton } from "./ui";

type Props = {
  subject: string;
  context?: QuizQuestionContext;
  questions: Question[];
  courses: CourseContent[];
  onCreate: (input: QuestionInput) => Promise<void>;
  onUpdate: (id: string, input: QuestionInput) => Promise<void>;
  onImport: (questions: QuestionInput[]) => Promise<void>;
};

export function QuestionManager({ subject, context, questions, courses, onCreate, onUpdate, onImport }: Props) {
  const [editor, setEditor] = useState<Question | "new" | null>(null);
  const [preview, setPreview] = useState<Question | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [topic, setTopic] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const uploadBusyRef = useRef(false);
  const scopedQuestions = questions.filter((question) => context
    ? question.quizId === context.quizId
    : (question.subject ?? "Physics") === subject);
  const topics = Array.from(new Set(scopedQuestions.map((question) => question.topic))).sort();
  const filtered = scopedQuestions.filter((question) =>
    (!type || question.type === type) && (!topic || question.topic === topic) &&
    `${question.prompt} ${question.topic} ${question.keywords?.join(" ") ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  const importFile = async (file: File | null) => {
    if (!file || uploadBusyRef.current) return;
    uploadBusyRef.current = true;
    setUploading(true);
    setError("");
    setNotice("");
    try {
      const parsed = await parseQuestionImportFile(file, { defaultSubject: subject, defaultTopic: context?.topic });
      if (!parsed.length) throw new Error("No valid questions were found in this Excel file.");
      await onImport(parsed.map((question) => ({
        ...questionInput(question),
        subject,
        ...(context ? { courseId: context.courseId, moduleId: context.moduleId, subtopicId: context.subtopicId, quizId: context.quizId } : {}),
      })));
      setSearch(""); setType(""); setTopic("");
      setNotice(`${parsed.length} questions imported. Use Edit to correct any question.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Questions could not be imported.");
    } finally { uploadBusyRef.current = false; setUploading(false); }
  };

  const downloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const sheet = XLSX.utils.aoa_to_sheet([
        ["type", "subject", "topic", "question", "optionA", "optionB", "optionC", "optionD", "answer", "explanation", "marks", "difficulty", "learningObjective", "rubricPoints", "commonMistakes", "keywords"],
        ["objective", subject, context?.topic ?? "General", "What is 2 + 2?", "3", "4", "5", "6", "B", "Adding two and two gives four.", 2, "easy", "", "", "", ""],
      ]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Questions");
      XLSX.writeFile(workbook, "question-upload-template.xlsx");
    } catch { setError("The template could not be downloaded."); }
  };

  if (editor) return <QuestionEditor key={editor === "new" ? "new" : editor.id}
    question={editor === "new" ? undefined : editor} subject={subject} context={context} courses={courses}
    onCancel={() => setEditor(null)} onSave={async (input) => {
      if (editor === "new") await onCreate(input); else await onUpdate(editor.id, input);
      setNotice(editor === "new" ? "Question saved." : "Question updated.");
    }} />;

  if (preview) return <section className="space-y-4 rounded-lg border border-[#d5e2f0] bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-black">Question Preview</h3>
      <div className="flex gap-2"><SecondaryButton type="button" onClick={() => setPreview(null)}>Back to Questions</SecondaryButton>
        <PrimaryButton type="button" onClick={() => { setEditor(preview); setPreview(null); }}>Edit Question</PrimaryButton></div>
    </div>
    <p className="text-sm text-[#5e7086]">{preview.topic} · {preview.type === "objective" ? "Multiple Choice" : "Theory"} · {preview.marks} marks · {preview.difficulty ?? "medium"}</p>
    <MathContent>{preview.prompt}</MathContent>
    {preview.imageUrl && <ImagePreview src={preview.imageUrl} />}
    {preview.type === "objective" && <ol className="list-inside list-[upper-alpha] space-y-2">{preview.options?.map((option, index) => <li key={index}><MathContent>{option}</MathContent></li>)}</ol>}
    <p className="font-bold">{preview.type === "objective" ? "Correct Answer" : "Model Answer"}</p><MathContent>{preview.answer}</MathContent>
    <p className="font-bold">Explanation</p><MathContent>{preview.explanation}</MathContent>
    {preview.learningObjective && <p>Learning objective: {preview.learningObjective}</p>}
    {!!preview.rubricPoints?.length && <div><p className="font-bold">Rubric Points</p><ul className="list-inside list-disc">{preview.rubricPoints.map((point, index) => <li key={index}>{point}</li>)}</ul></div>}
    {!!preview.keywords?.length && <p>Grading keywords: {preview.keywords.join(", ")}</p>}
  </section>;

  return <section className="space-y-4 rounded-lg border border-[#d5e2f0] bg-white p-5" aria-busy={uploading}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="text-xl font-black">{context ? "Quiz Questions" : `${subject} Question Bank`}</h3>
        <p className="mt-1 text-sm text-[#5e7086]">{scopedQuestions.length} questions{context ? ` · ${context.label}` : ""}</p></div>
      <div className="flex flex-wrap gap-2">
        <PrimaryButton type="button" disabled={uploading} onClick={() => { setError(""); setNotice(""); setEditor("new"); }}><Plus size={16} /> Add Question</PrimaryButton>
        <label className={`inline-flex min-h-11 items-center gap-2 rounded-md border border-[#d5e2f0] px-4 text-sm font-bold text-[#06479b] ${uploading ? "opacity-50" : "cursor-pointer hover:bg-blue-50"}`}>
          <Upload size={16} />{uploading ? "Importing…" : "Bulk Upload"}
          <input className="sr-only" type="file" disabled={uploading} aria-label="Bulk upload questions" accept=".xlsx,.xls"
            onChange={(event) => { const file = event.target.files?.[0] ?? null; event.currentTarget.value = ""; void importFile(file); }} />
        </label>
        <SecondaryButton type="button" disabled={uploading} onClick={() => void downloadTemplate()}>Download Template</SecondaryButton>
      </div>
    </div>
    {error && <p role="alert" className="text-sm font-bold text-rose-700">{error}</p>}
    {notice && <p role="status" className="text-sm font-bold text-emerald-700">{notice}</p>}
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <label className="grid gap-1 text-xs font-bold">Search Questions<input className="min-h-10 rounded-md border border-[#d5e2f0] px-3 text-sm" type="search" placeholder="Question, topic or keyword" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <label className="grid gap-1 text-xs font-bold">Topic<select className="min-h-10 max-w-full rounded-md border border-[#d5e2f0] px-3 text-sm" value={topic} onChange={(event) => setTopic(event.target.value)}><option value="">All Topics</option>{topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-bold">Type<select className="min-h-10 rounded-md border border-[#d5e2f0] px-3 text-sm" value={type} onChange={(event) => setType(event.target.value)}><option value="">All Types</option><option value="objective">Multiple Choice</option><option value="theory">Theory</option></select></label>
    </div>
    {filtered.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead className="border-b border-[#d5e2f0] text-xs text-[#5e7086]"><tr>{["Question", "Topic", "Type", "Marks", "Linked To", "Actions"].map((label) => <th key={label} className="px-3 py-3">{label}</th>)}</tr></thead>
      <tbody>{filtered.map((question) => <tr key={question.id} className="border-b border-[#e8f0fa] last:border-0">
        <td className="min-w-56 max-w-xl px-3 py-4"><span className="line-clamp-3">{question.prompt}</span></td>
        <td className="px-3 py-4">{question.topic}</td><td className="px-3 py-4">{question.type === "objective" ? "MCQ" : "Theory"}</td><td className="px-3 py-4">{question.marks}</td>
        <td className="px-3 py-4">{question.quizId ? "Quiz" : question.subtopicId ? "Subtopic" : question.courseId ? "Course" : "Question bank"}</td>
        <td className="px-3 py-4"><div className="flex gap-3 whitespace-nowrap">
          <button type="button" disabled={uploading} className="inline-flex min-h-9 items-center gap-1 text-[#06479b] hover:underline disabled:opacity-50" aria-label={`Preview question: ${question.prompt}`} onClick={() => setPreview(question)}><Eye size={15} /> Preview</button>
          <button type="button" disabled={uploading} className="inline-flex min-h-9 items-center gap-1 font-bold text-[#06479b] hover:underline disabled:opacity-50" aria-label={`Edit question: ${question.prompt}`} onClick={() => { setError(""); setNotice(""); setEditor(question); }}><Pencil size={15} /> Edit</button>
        </div></td>
      </tr>)}</tbody>
    </table></div> : <p className="py-8 text-center text-sm text-[#5e7086]">{scopedQuestions.length ? "No questions match your filters." : "No questions yet. Add a question manually or upload an Excel file."}</p>}
  </section>;
}
