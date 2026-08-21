import {
  Bold,
  Code2,
  FileText,
  Heading2,
  Heading3,
  Heading4,
  ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Sigma,
  Strikethrough,
  Subscript,
  Superscript,
  Trash2,
  Underline,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import type { ComponentType } from "react";
import { useMemo, useRef, useState } from "react";
import {
  dedupeAttachments,
  formatBytes,
  parseAnswerValue,
  serializeAnswerValue,
} from "@/lib/answer-attachments";
import type { Question } from "@/types/platform";
import { MathContent } from "./math-content";
import { BackButton, PrimaryButton, SecondaryButton } from "./ui";

type AnswerTool =
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "code"
  | "h2"
  | "h3"
  | "h4"
  | "bullet"
  | "numbered"
  | "quote"
  | "link"
  | "superscript"
  | "subscript"
  | "image"
  | "undo"
  | "redo"
  | "equation";

const answerTools: {
  label: string;
  command: AnswerTool;
  icon: ComponentType<{ "aria-hidden"?: "true"; size?: number; strokeWidth?: number }>;
}[] = [
  { label: "Bold", command: "bold", icon: Bold },
  { label: "Italic", command: "italic", icon: Italic },
  { label: "Underline", command: "underline", icon: Underline },
  { label: "Strikethrough", command: "strike", icon: Strikethrough },
  { label: "Code", command: "code", icon: Code2 },
  { label: "Heading 2", command: "h2", icon: Heading2 },
  { label: "Heading 3", command: "h3", icon: Heading3 },
  { label: "Heading 4", command: "h4", icon: Heading4 },
  { label: "Bullet list", command: "bullet", icon: List },
  { label: "Numbered list", command: "numbered", icon: ListOrdered },
  { label: "Quote", command: "quote", icon: Quote },
  { label: "Link", command: "link", icon: Link },
  { label: "Superscript", command: "superscript", icon: Superscript },
  { label: "Subscript", command: "subscript", icon: Subscript },
  { label: "Image note", command: "image", icon: ImageIcon },
  { label: "Undo", command: "undo", icon: Undo2 },
  { label: "Redo", command: "redo", icon: Redo2 },
  { label: "Equation", command: "equation", icon: Sigma },
];

export function TestInterface({
  questions,
  answers,
  currentQuestion,
  onAnswer,
  onCurrentQuestion,
  onBack,
  onSubmit,
}: {
  questions: Question[];
  answers: Record<string, string>;
  currentQuestion: number;
  onAnswer: (id: string, value: string) => void;
  onCurrentQuestion: (index: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const question = questions[currentQuestion];
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const answeredCount = questions.filter((item) => Boolean(answers[item.id]?.trim())).length;
  const unansweredCount = questions.length - answeredCount;

  const requestSubmit = () => setShowSubmitModal(true);
  const reviewAnswers = () => setShowSubmitModal(false);
  const confirmSubmit = () => {
    setShowSubmitModal(false);
    onSubmit();
  };

  if (!question) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <BackButton className="mb-4" label="Overview" onClick={onBack} />
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
          <h2 className="text-2xl font-black text-slate-950">No questions available</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Ask an admin to publish questions before starting this test.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="surface-enter relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <BackButton className="mb-4" label="Overview" onClick={onBack} />
      <div className="relative">
        <div className="grid min-h-[620px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/70 lg:grid-cols-[280px_1fr]">
          <aside className="flex flex-col gap-6 border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
            <div>
              <p className="text-xs font-black uppercase text-slate-500">PHS 001 - Topic 1</p>
              <h2 className="mt-2 text-xl font-black">Questions</h2>
            </div>
            <div className="stagger-list grid grid-cols-5 gap-2">
              {questions.map((item, index) => {
                const isCurrent = index === currentQuestion;
                const isAnswered = Boolean(answers[item.id]);

                return (
                  <button
                    className={`interactive-lift aspect-square rounded-lg border text-sm font-black transition ${
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
                    {index + 1}
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

          <section className="question-step p-5 sm:p-8" key={question.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-indigo-700">Question {currentQuestion + 1}</p>
                <h2 className="mt-2 text-xl font-black leading-7 text-slate-950">
                  <MathContent>{question.prompt}</MathContent>
                </h2>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-800">
                {question.marks} marks
              </span>
            </div>

            {question.type === "objective" ? (
              <div className="mt-6 space-y-3">
                {question.options?.map((option, index) => (
                  <label
                    className={`interactive-lift flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50 hover:border-indigo-200 ${
                      answers[question.id] === option ? "selected-pop" : ""
                    }`}
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
                    <strong className="font-bold text-slate-900">
                      <MathContent>{option}</MathContent>
                    </strong>
                  </label>
                ))}
              </div>
            ) : (
              <WordAnswerBox
                questionId={question.id}
                value={answers[question.id] ?? ""}
                onChange={(value) => onAnswer(question.id, value)}
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
                <PrimaryButton type="button" onClick={requestSubmit}>
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

        {showSubmitModal && (
          <SubmitConfirmModal
            answeredCount={answeredCount}
            totalQuestions={questions.length}
            unansweredCount={unansweredCount}
            onClose={reviewAnswers}
            onConfirm={confirmSubmit}
          />
        )}
      </div>
    </section>
  );
}

function SubmitConfirmModal({
  answeredCount,
  totalQuestions,
  unansweredCount,
  onClose,
  onConfirm,
}: {
  answeredCount: number;
  totalQuestions: number;
  unansweredCount: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const allAnswered = unansweredCount === 0;

  return (
    <div className="modal-backdrop-enter absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-[1px]">
      <div
        aria-modal="true"
        className="modal-card-enter w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/25"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-950">Ready to submit?</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {allAnswered
                ? "All questions answered. Submit your quiz?"
                : `${unansweredCount} of ${totalQuestions} questions unanswered. Submit your quiz?`}
            </p>
          </div>
          <button
            aria-label="Close submit confirmation"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          <PrimaryButton className="min-h-10 px-5 py-2 text-sm" type="button" onClick={onConfirm}>
            Submit anyway
          </PrimaryButton>
          <SecondaryButton className="min-h-10 border-0 px-4 py-2 text-sm shadow-none" type="button" onClick={onClose}>
            Review
          </SecondaryButton>
        </div>
        <p className="mt-4 text-xs font-bold text-slate-500">
          Answered {answeredCount}/{totalQuestions}
        </p>
      </div>
    </div>
  );
}

function WordAnswerBox({
  questionId,
  value,
  onChange,
}: {
  questionId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const answer = useMemo(() => parseAnswerValue(value), [value]);

  const focusTextarea = () => textareaRef.current?.focus();

  const updateAnswer = (nextText: string, nextAttachments = answer.attachments) => {
    onChange(serializeAnswerValue(nextText, nextAttachments));
  };

  const updateSelection = (nextValue: string, start: number, end = start) => {
    updateAnswer(nextValue);
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(start, end);
    });
  };

  const wrapSelection = (before: string, after = before, fallback = "answer") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const selected = answer.text.slice(selectionStart, selectionEnd) || fallback;
    const nextValue = `${answer.text.slice(0, selectionStart)}${before}${selected}${after}${answer.text.slice(selectionEnd)}`;
    const cursorStart = selectionStart + before.length;
    updateSelection(nextValue, cursorStart, cursorStart + selected.length);
  };

  const insertBlock = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const lineStart = answer.text.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
    const needsBreak = lineStart === 0 ? "" : answer.text[lineStart - 1] === "\n" ? "" : "\n";
    const selected = answer.text.slice(selectionStart, selectionEnd) || "Type here";
    const nextValue = `${answer.text.slice(0, lineStart)}${needsBreak}${prefix}${selected}${answer.text.slice(selectionEnd)}`;
    const cursorStart = lineStart + needsBreak.length + prefix.length;
    updateSelection(nextValue, cursorStart, cursorStart + selected.length);
  };

  const insertText = (text: string, cursorOffset = text.length) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const nextValue = `${answer.text.slice(0, selectionStart)}${text}${answer.text.slice(selectionEnd)}`;
    updateSelection(nextValue, selectionStart + cursorOffset);
  };

  const runNativeEdit = (command: "undo" | "redo") => {
    focusTextarea();
    document.execCommand(command);
  };

  const applyTool = (command: AnswerTool) => {
    const actions: Record<AnswerTool, () => void> = {
      bold: () => wrapSelection("**"),
      italic: () => wrapSelection("_"),
      underline: () => wrapSelection("<u>", "</u>"),
      strike: () => wrapSelection("~~"),
      code: () => wrapSelection("`"),
      h2: () => insertBlock("## "),
      h3: () => insertBlock("### "),
      h4: () => insertBlock("#### "),
      bullet: () => insertBlock("- "),
      numbered: () => insertBlock("1. "),
      quote: () => insertBlock("> "),
      link: () => wrapSelection("[", "](https://)", "link text"),
      superscript: () => wrapSelection("^{", "}"),
      subscript: () => wrapSelection("_{", "}"),
      image: () => insertText("[image: describe your diagram]"),
      undo: () => runNativeEdit("undo"),
      redo: () => runNativeEdit("redo"),
      equation: () => insertText("$  $", 2),
    };

    actions[command]();
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;

    const supportedFiles = Array.from(files).filter(isSupportedAnswerFile);

    if (!supportedFiles.length) {
      setUploadMessage("Use PDF, DOC, or DOCX files.");
      return;
    }

    const nextAttachments = [
      ...answer.attachments,
      ...supportedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        size: file.size,
        type: file.type || file.name.split(".").pop()?.toUpperCase() || "Document",
      })),
    ];

    updateAnswer(answer.text, dedupeAttachments(nextAttachments));
    setUploadMessage(
      supportedFiles.length === files.length
        ? `${supportedFiles.length} file${supportedFiles.length === 1 ? "" : "s"} attached.`
        : "Some files were skipped."
    );

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) => {
    updateAnswer(
      answer.text,
      answer.attachments.filter((attachment) => attachment.id !== id)
    );
    setUploadMessage("");
  };

  return (
    <div className="content-rise mt-6">
      <div className="focus-glow overflow-hidden rounded-lg border border-indigo-300 bg-white shadow-sm shadow-indigo-100 transition focus-within:border-indigo-500">
        <div className="flex min-h-10 flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
          {answerTools.map(({ label, command, icon: Icon }, index) => (
            <button
              aria-label={label}
              className={`grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:-translate-y-0.5 hover:bg-white hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 active:translate-y-0 ${
                index === 5 || index === 8 || index === 11 || index === 15 ? "ml-1 border-l border-slate-200 pl-1" : ""
              }`}
              key={label}
              title={label}
              type="button"
              onClick={() => applyTool(command)}
            >
              <Icon aria-hidden="true" size={15} strokeWidth={2.1} />
            </button>
          ))}
        </div>
        <textarea
          aria-label={`Answer for question ${questionId}`}
          className="min-h-44 w-full resize-y border-0 bg-white px-4 py-4 text-base leading-7 text-slate-900 outline-none placeholder:text-slate-400"
          ref={textareaRef}
          value={answer.text}
          onChange={(event) => updateAnswer(event.target.value)}
          placeholder="Write your answer (supports LaTeX)"
        />
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              className="interactive-lift inline-flex min-h-10 items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-sm font-black text-indigo-700 hover:shadow-md"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload aria-hidden="true" size={16} />
              Attach PDF/DOC
            </button>
            <span className="text-xs font-bold text-slate-500">
              {answer.attachments.length ? `${answer.attachments.length} attached` : "No files attached"}
            </span>
          </div>
          <input
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            multiple
            ref={fileInputRef}
            type="file"
            onChange={(event) => handleFiles(event.target.files)}
          />
          {uploadMessage && <p className="mt-2 text-xs font-bold text-slate-500">{uploadMessage}</p>}
          {answer.attachments.length > 0 && (
            <div className="stagger-list mt-3 grid gap-2">
              {answer.attachments.map((attachment) => (
                <div
                  className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                  key={attachment.id}
                >
                  <FileText aria-hidden="true" className="shrink-0 text-indigo-700" size={17} />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-black text-slate-900">{attachment.name}</strong>
                    <small className="block text-xs font-bold text-slate-500">{formatBytes(attachment.size)}</small>
                  </span>
                  <button
                    aria-label={`Remove ${attachment.name}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-rose-600"
                    title="Remove file"
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    <Trash2 aria-hidden="true" size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="content-rise-delay mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <strong className="block text-xs font-black uppercase text-slate-600">Preview</strong>
        <div className="mt-2 min-h-8 text-sm font-semibold leading-7 text-slate-900">
          <MathContent>{answer.text || "Your rendered math preview will appear here."}</MathContent>
        </div>
      </div>
    </div>
  );
}

function isSupportedAnswerFile(file: File) {
  const fileName = file.name.toLowerCase();
  const supportedExtensions = [".pdf", ".doc", ".docx"];

  return supportedExtensions.some((extension) => fileName.endsWith(extension));
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <b className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
