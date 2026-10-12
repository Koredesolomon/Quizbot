import type { Question, QuestionType } from "@/types/platform";
import {
  asksForExplanation,
  formatAnswerLetters,
  optionLetter,
  parseQuestionType,
  resolveAnswerIndices,
  resolveOptionIndex,
} from "@/lib/question-answers";
import { readDocxQuestions } from "@/lib/import/docx";
import { withImages, type ImportCell, type RawQuestion } from "@/lib/import/raw";
import { rowsToRawQuestions } from "@/lib/import/rows";
import { readFirstSheetImages } from "@/lib/import/xlsx-images";
import { loadZip } from "@/lib/import/zip";

type ImportOptions = {
  defaultSubject?: string;
  defaultTopic?: string;
  idOffset?: number;
};

export type ImportIssue = { location: string; message: string };

export type QuestionImportResult = {
  questions: Question[];
  /** Questions that could not be imported, with the reason. */
  skipped: ImportIssue[];
  /** Imported questions that were adjusted or lost something (e.g. an unreadable picture). */
  warnings: ImportIssue[];
  /** Choice questions read correctly except for their answer, which the admin can pick before importing. */
  needsAnswer: Array<{ location: string; question: Question }>;
};

export const questionImportAccept = [
  ".docx", ".xlsx", ".xls", ".csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
].join(",");

export const questionImportFormats = "Word (.docx), Excel (.xlsx, .xls) or CSV";

export async function parseQuestionImportFile(file: File, options: ImportOptions = {}): Promise<QuestionImportResult> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  let raw: RawQuestion[];

  if (extension === "docx") {
    raw = await readDocxQuestions(await loadZip(await file.arrayBuffer()));
  } else if (extension === "doc") {
    throw new Error("Older .doc files cannot be read. In Word choose File → Save As → Word Document (.docx), then upload that file.");
  } else if (extension === "xlsx" || extension === "xlsm" || extension === "xls" || extension === "csv") {
    raw = await readSpreadsheet(file, extension);
  } else {
    throw new Error(`Upload a ${questionImportFormats} file.`);
  }

  return finalizeQuestions(raw, options);
}

async function readSpreadsheet(file: File, extension: string) {
  const XLSX = await import("xlsx");
  // CSV cells stay as typed text, so values like "1/2" are not turned into dates.
  const workbook = extension === "csv"
    ? XLSX.read(await file.text(), { type: "string", raw: true })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!sheet?.["!ref"]) return [];

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const values = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: true, raw: false, defval: "" });
  const rows: ImportCell[][] = values.map((row) => row.map((value) => ({ text: String(value ?? ""), images: [] })));

  if (extension === "xlsx" || extension === "xlsm") {
    const images = await readFirstSheetImages(await loadZip(await file.arrayBuffer()));
    const place = (key: string, apply: (cell: ImportCell) => void) => {
      const [row, col] = key.split(":").map(Number);
      const rowIndex = row - range.s.r;
      const colIndex = col - range.s.c;
      if (rowIndex < 0 || colIndex < 0) return;
      while (rows.length <= rowIndex) rows.push([]);
      while (rows[rowIndex].length <= colIndex) rows[rowIndex].push({ text: "", images: [] });
      apply(rows[rowIndex][colIndex]);
    };
    images.byCell.forEach((dataUrls, key) => place(key, (cell) => cell.images.push(...dataUrls)));
    images.problems.forEach((reasons, key) => place(key, (cell) => { cell.problems = [...(cell.problems ?? []), ...reasons]; }));
  }

  return rowsToRawQuestions(rows, (index) => `Row ${range.s.r + index + 1}`);
}

function splitList(value: string | undefined) {
  if (!value) return [];
  const parts = /[\n;|]/.test(value) ? value.split(/\s*[\n;|]\s*/) : value.split(/\s*,\s*/);
  return parts.map((item) => item.trim()).filter(Boolean);
}

const romanLetters: Record<string, string> = { I: "A", II: "B", III: "C", IV: "D", V: "E", VI: "F", VII: "G", VIII: "H" };

/** "IV" -> "D", "II and IV" -> "B, D", "IV. reason" -> "D. reason", for options numbered I, II, III ... */
function romanToLetters(answer: string) {
  return answer.replace(/^\(?(VIII|VII|VI|IV|V|III|II|I)\b\)?((?:\s*(?:,|and|&)\s*\(?(?:VIII|VII|VI|IV|V|III|II|I)\b\)?)*)/, (_, first: string, rest: string) =>
    [first, ...Array.from(rest.matchAll(/VIII|VII|VI|IV|V|III|II|I/g), (match) => match[0])].map((numeral) => romanLetters[numeral]).join(", "));
}

function difficulty(value: string | undefined): Question["difficulty"] {
  const key = value?.trim().toLowerCase();
  return key === "easy" || key === "hard" ? key : "medium";
}

function finalizeQuestions(raw: RawQuestion[], options: ImportOptions): QuestionImportResult {
  const result: QuestionImportResult = { questions: [], skipped: [], warnings: [], needsAnswer: [] };

  raw.forEach((item) => {
    const outcome = finalizeQuestion(item, result.questions.length + result.needsAnswer.length, options);
    outcome.warnings.forEach((message) => result.warnings.push({ location: item.location, message }));
    if ("error" in outcome) result.skipped.push({ location: item.location, message: outcome.error });
    else if (outcome.needsAnswer) result.needsAnswer.push({ location: item.location, question: outcome.question });
    else result.questions.push(outcome.question);
  });

  return result;
}

type Outcome = { question: Question; warnings: string[]; needsAnswer?: boolean } | { error: string; warnings: string[] };

function finalizeQuestion(raw: RawQuestion, index: number, options: ImportOptions): Outcome {
  const warnings = Array.from(new Set(raw.warnings));
  const fail = (error: string): Outcome => ({ error, warnings });

  if (!raw.prompt.trim() && !raw.promptImages.length && !raw.imageUrl) return fail("The question text is empty.");

  // Drop trailing empty option columns; an empty option in the middle would shift every letter after it.
  const cells = [...raw.options];
  while (cells.length && !cells[cells.length - 1].text.trim() && !cells[cells.length - 1].images.length) cells.pop();
  const emptyOption = cells.findIndex((cell) => !cell.text.trim() && !cell.images.length);
  let choices = cells.map((cell) => withImages(cell.text, cell.images));

  let answer = (raw.answer ?? "").trim();
  let explanation = (raw.explanation ?? "").trim();
  const rubric = splitList(raw.rubricPoints);

  if (raw.romanOptions) answer = romanToLetters(answer);

  // "IV. 2.671 cm is the most precise because ..." names an option and then explains it.
  if (choices.length >= 2 && answer && !resolveAnswerIndices(answer, choices)) {
    const labelled = answer.match(/^\(?([A-H])\s*[.)]\s+([\s\S]+)$/);
    const index = labelled ? labelled[1].toUpperCase().charCodeAt(0) - 65 : -1;
    if (labelled && index < choices.length) {
      const reason = labelled[2].trim();
      const optionText = choices[index].toLowerCase();
      if (reason.toLowerCase().startsWith(optionText.split("\n")[0].trim().split(" ")[0])) {
        answer = labelled[1].toUpperCase();
        if (!explanation) explanation = reason;
      }
    }
  }

  // A marking scheme without a written answer: use its points as the model answer.
  if (!answer && !choices.length && rubric.length) {
    answer = rubric.join("\n");
    warnings.push("No model answer was written, so the marking points were used as the model answer.");
  }

  // A question printed in a picture with only "Answer: B": its options are in the picture.
  const pictureOnly = !raw.prompt.trim() && (raw.promptImages.length || raw.imageUrl);
  const pictureLetters = pictureOnly && !choices.length ? answer.match(/^\(?([A-H])\)?(?:\s*(?:,|and|&)\s*\(?([A-H])\)?)*\.?$/i) : null;
  if (pictureLetters) {
    const highest = Math.max(3, ...Array.from(answer.toUpperCase().matchAll(/[A-H]/g), (match) => match[0].charCodeAt(0) - 65));
    choices = Array.from({ length: highest + 1 }, (_, index) => optionLetter(index));
    warnings.push(`The options are inside the picture, so they were set to ${choices[0]}–${choices[choices.length - 1]}. Check this matches the picture.`);
  }

  const declared = parseQuestionType(raw.declaredType);
  if (raw.declaredType?.trim() && !declared) {
    warnings.push(`Question type "${raw.declaredType.trim()}" is not recognised, so the type was detected automatically.`);
  }

  // "Answer: B" followed by an unlabelled explanation line.
  if (choices.length >= 2 && answer.includes("\n") && !resolveAnswerIndices(answer, choices)) {
    const [first, ...rest] = answer.split("\n");
    if (resolveAnswerIndices(first, choices)) {
      answer = first.trim();
      explanation = [explanation, rest.join("\n").trim()].filter(Boolean).join("\n");
    }
  }

  const resolved = choices.length >= 2 ? resolveAnswerIndices(answer, choices) : null;
  let type: QuestionType = declared ?? parseQuestionType(raw.sectionType) ?? (choices.length >= 2 ? "objective" : "theory");
  const detected = !declared;
  let needsAnswer = false;

  if (type !== "theory") {
    if (choices.length < 2) {
      if (!detected) return fail(`${type === "multiple" ? "MCQ" : "Objective"} questions need at least two options.`);
      type = "theory";
    } else if (emptyOption >= 0) {
      return fail(`Option ${optionLetter(emptyOption)} is empty. Fill it in or remove it.`);
    } else if (!answer) {
      needsAnswer = true;
    } else if (!resolved) {
      const lettersOnly = /^\(?[A-Z]\)?(?:\s*(?:[,;&/]|and)?\s*\(?[A-Z]\)?)*\.?$/i.test(answer);
      if (detected && !raw.sectionType && !lettersOnly) {
        // Lettered lines with a written answer: a theory question with parts (a), (b) ...
        type = "theory";
        warnings.push("The answer does not match any option, so this was imported as a theory question with its parts in the question text.");
      } else {
        return fail(`The answer "${answer}" does not match any option (${optionLetter(0)}–${optionLetter(choices.length - 1)}).`);
      }
    } else if (resolved.length > 1 && type === "objective") {
      if (!detected && parseQuestionType(raw.declaredType) === "objective") {
        warnings.push("Several correct answers were given, so this was imported as an MCQ (multiple answers) question.");
      }
      type = "multiple";
    }
  }

  let prompt = raw.prompt.trim() || "Answer the question shown in the picture.";
  if (type === "theory" && choices.length) {
    prompt = [prompt, ...choices.map((choice, position) => `(${optionLetter(position).toLowerCase()}) ${choice}`)].join("\n");
  }
  if (type === "theory" && !answer) return fail("No model answer was found. Theory questions need an answer to mark against.");

  const promptImages = [...raw.promptImages];
  const imageUrl = raw.imageUrl || promptImages.shift();
  prompt = withImages(prompt, promptImages);

  let finalAnswer = answer;
  if (type === "objective") finalAnswer = needsAnswer ? "" : choices[resolved![0]];
  if (type === "multiple") finalAnswer = needsAnswer ? "" : formatAnswerLetters(resolved!);

  const marksValue = Number(raw.marks);
  if (raw.marks?.trim() && !(Number.isInteger(marksValue) && marksValue >= 1)) {
    warnings.push(`Marks "${raw.marks}" is not a whole number, so 1 mark was used.`);
  }

  return {
    warnings,
    needsAnswer,
    question: {
      id: raw.id || String((options.idOffset ?? 0) + index + 1),
      type,
      subject: raw.subject || options.defaultSubject || "Physics",
      topic: raw.topic || options.defaultTopic || "General",
      prompt,
      imageUrl: imageUrl || undefined,
      options: type === "theory" ? undefined : choices,
      // Choice questions that ask "Explain your answer" (or are marked so in a spreadsheet) also get an answer box.
      answerBox: type !== "theory" && (asksForExplanation.test(prompt) || /^(?:yes|y|true|1|x)$/i.test(raw.answerBox?.trim() ?? "")) ? true : undefined,
      answer: finalAnswer,
      explanation,
      marks: Number.isInteger(marksValue) && marksValue >= 1 ? marksValue : 1,
      difficulty: difficulty(raw.difficulty),
      learningObjective: raw.learningObjective || undefined,
      rubricPoints: rubric,
      commonMistakes: splitList(raw.commonMistakes),
      keywords: type === "theory" ? splitList(raw.keywords) : undefined,
    },
  };
}

/** The correct option indices of a choice question, for previews and editors. */
export function correctOptionIndices(question: Pick<Question, "type" | "answer" | "options">) {
  const options = question.options ?? [];
  if (question.type === "multiple") return resolveAnswerIndices(question.answer, options) ?? [];
  const index = resolveOptionIndex(question.answer, options);
  return index >= 0 ? [index] : [];
}
