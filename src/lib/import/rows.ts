import { emptyRawQuestion, withImages, type ImportCell, type RawQuestion } from "./raw";

type Field =
  | "type" | "prompt" | "options" | "answer" | "explanation" | "marks" | "subject" | "topic" | "difficulty"
  | "learningObjective" | "rubricPoints" | "commonMistakes" | "keywords" | "image" | "id" | "answerBox" | `option${number}`;

const aliases: Record<string, Field> = {
  type: "type", questiontype: "type", category: "type", kind: "type", format: "type",
  question: "prompt", prompt: "prompt", questiontext: "prompt", stem: "prompt", questions: "prompt",
  options: "options", choices: "options", answeroptions: "options",
  answer: "answer", answers: "answer", correctanswer: "answer", correctanswers: "answer", correctoption: "answer",
  correctoptions: "answer", key: "answer", answerkey: "answer", correct: "answer", modelanswer: "answer",
  explanation: "explanation", feedback: "explanation", rationale: "explanation", solution: "explanation", reason: "explanation",
  marks: "marks", mark: "marks", points: "marks", point: "marks", score: "marks",
  subject: "subject", topic: "topic", module: "topic", difficulty: "difficulty", level: "difficulty",
  learningobjective: "learningObjective", objective: "learningObjective",
  rubricpoints: "rubricPoints", rubric: "rubricPoints", commonmistakes: "commonMistakes", mistakes: "commonMistakes",
  keywords: "keywords", keyword: "keywords",
  imageurl: "image", image: "image", diagram: "image", picture: "image", figure: "image", imagelink: "image",
  id: "id", questionid: "id",
  answerbox: "answerBox", explanationbox: "answerBox", explainbox: "answerBox", requireexplanation: "answerBox", explain: "answerBox",
};

export function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function headerField(header: string): Field | undefined {
  const key = normalizeHeader(header);
  if (aliases[key]) return aliases[key];
  // optionA, choice B, option1, A, (b) ...
  const option = key.match(/^(?:option|choice|opt|answeroption)?([a-h]|[1-8])$/);
  if (option) {
    const value = option[1];
    const index = /\d/.test(value) ? Number(value) - 1 : value.charCodeAt(0) - 97;
    return `option${index}`;
  }
  return undefined;
}

/** Finds the header row (it may sit below a title row) by looking for a question column. */
export function findHeaderRow(rows: ImportCell[][]) {
  for (let index = 0; index < Math.min(rows.length, 10); index++) {
    if (rows[index].some((cell) => headerField(cell.text) === "prompt")) return index;
  }
  return -1;
}

export function looksLikeQuestionTable(rows: ImportCell[][]) {
  return findHeaderRow(rows) >= 0;
}

function splitPackedOptions(value: string) {
  const parts = /[\n;|]/.test(value) ? value.split(/\s*[\n;|]\s*/) : value.split(/\s*,\s*/);
  return parts.map((part) => part.replace(/^\(?[A-H][.)]\s+/i, "").trim()).filter(Boolean);
}

function stripOptionLabel(text: string, index: number) {
  const match = text.match(/^\(?([A-H])[.)]\s+/i);
  return match && match[1].toUpperCase().charCodeAt(0) - 65 === index ? text.slice(match[0].length) : text;
}

/**
 * Converts spreadsheet-style rows into raw questions.
 * `rowLabel` names a row for error messages (e.g. "Row 7" or "Table 2, row 3").
 */
export function rowsToRawQuestions(rows: ImportCell[][], rowLabel: (rowIndex: number) => string): RawQuestion[] {
  const headerIndex = findHeaderRow(rows);
  if (headerIndex < 0) return [];
  const fields = rows[headerIndex].map((cell) => headerField(cell.text));
  const questions: RawQuestion[] = [];

  for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (!row.some((cell) => cell.text.trim() || cell.images.length)) continue;

    const raw = emptyRawQuestion(rowLabel(rowIndex));
    const options: ImportCell[] = [];

    row.forEach((cell, column) => {
      const field = fields[column];
      const text = cell.text.trim();
      if (cell.problems?.length) raw.warnings.push(...cell.problems);
      if (!field) {
        if (cell.images.length) raw.promptImages.push(...cell.images);
        return;
      }
      if (field.startsWith("option") && field !== "options") {
        const optionIndex = Number(field.slice(6));
        if (text || cell.images.length) options[optionIndex] = { text: stripOptionLabel(text, optionIndex), images: cell.images };
        return;
      }
      switch (field) {
        case "prompt": raw.prompt = text; raw.promptImages.unshift(...cell.images); break;
        case "image":
          if (/^(https?:\/\/|\/)/i.test(text)) raw.imageUrl = text;
          raw.promptImages.push(...cell.images);
          break;
        case "options":
          if (text) options.push(...splitPackedOptions(text).map((option) => ({ text: option, images: [] })));
          break;
        case "answer":
          raw.answer = text;
          if (cell.images.length) raw.warnings.push("Pictures in the answer column were ignored. Put them in the question or option columns.");
          break;
        case "explanation": raw.explanation = withImages(text, cell.images); break;
        case "type": raw.declaredType = text; break;
        case "marks": raw.marks = text; break;
        default:
          if (text) (raw as Record<string, unknown>)[field] = text;
      }
    });

    // Keep gaps so a missing middle option is reported rather than silently shifting answer letters.
    for (let index = 0; index < options.length; index++) raw.options.push(options[index] ?? { text: "", images: [] });
    questions.push(raw);
  }

  return questions;
}
