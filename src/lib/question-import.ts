import type { Question } from "@/types/platform";

type ImportOptions = {
  defaultSubject?: string;
  defaultTopic?: string;
  idOffset?: number;
};

type RowValue = string | number | boolean | Date | null | undefined;

export async function parseQuestionImportFile(file: File, options: ImportOptions = {}) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (extension !== "xlsx" && extension !== "xls") {
    throw new Error("Upload an Excel file with .xlsx or .xls format.");
  }

  const rows = await readSpreadsheetRows(file);
  return rowsToQuestions(rows, options);
}

async function readSpreadsheetRows(file: File) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  return XLSX.utils.sheet_to_json<RowValue[]>(workbook.Sheets[firstSheetName], {
    header: 1,
    blankrows: false,
    raw: false,
  });
}

function rowsToQuestions(rows: RowValue[][], options: ImportOptions) {
  const filledRows = rows.filter((row) => row.some((cell) => String(cell ?? "").trim()));
  if (filledRows.length < 2) return [];

  const headers = filledRows[0].map((header) => normalizeHeader(header));

  return filledRows
    .slice(1)
    .map((row, index) => {
      const values = new Map(headers.map((header, headerIndex) => [header, String(row[headerIndex] ?? "").trim()]));
      const type = getValue(values, "type") === "theory" ? "theory" : "objective";
      const optionsList = [
        getValue(values, "optiona", "option1", "a"),
        getValue(values, "optionb", "option2", "b"),
        getValue(values, "optionc", "option3", "c"),
        getValue(values, "optiond", "option4", "d"),
        getValue(values, "optione", "option5", "e"),
      ].filter(Boolean);
      const packedOptions = splitList(getValue(values, "options", "choices"));

      return normalizeQuestion(
        {
          id: getValue(values, "id") || String((options.idOffset ?? 0) + index + 1),
          type,
          subject: getValue(values, "subject") || options.defaultSubject,
          topic: getValue(values, "topic") || getValue(values, "module") || options.defaultTopic || "General",
          prompt: getValue(values, "question", "prompt"),
          imageUrl: getValue(values, "imageurl", "image", "diagram") || undefined,
          options: type === "objective" ? (optionsList.length ? optionsList : packedOptions) : undefined,
          answer: getValue(values, "answer", "correctanswer"),
          explanation: getValue(values, "explanation", "feedback"),
          marks: Number(getValue(values, "marks", "mark", "points")) || 1,
          difficulty: getDifficulty(getValue(values, "difficulty")),
          learningObjective: getValue(values, "learningobjective", "objective") || undefined,
          rubricPoints: splitList(getValue(values, "rubricpoints", "rubric")),
          commonMistakes: splitList(getValue(values, "commonmistakes", "mistakes")),
          keywords: splitList(getValue(values, "keywords")),
        },
        index,
        options
      );
    })
    .filter((question): question is Question => Boolean(question));
}

function normalizeQuestion(question: Partial<Question>, index: number, options: ImportOptions): Question | null {
  if (!question.prompt || !question.answer || !question.explanation) return null;

  const type = question.type === "theory" ? "theory" : "objective";
  const choices = Array.isArray(question.options) ? question.options.map(String).map((item) => item.trim()).filter(Boolean) : undefined;
  if (type === "objective" && (!choices || choices.length < 2)) return null;

  return {
    id: String(question.id || (options.idOffset ?? 0) + index + 1),
    type,
    subject: question.subject || options.defaultSubject || "Physics",
    topic: question.topic || options.defaultTopic || "General",
    prompt: question.prompt,
    imageUrl: question.imageUrl,
    options: type === "objective" ? choices : undefined,
    answer: question.answer,
    explanation: question.explanation,
    marks: Math.max(1, Number(question.marks) || 1),
    difficulty: question.difficulty ?? "medium",
    learningObjective: question.learningObjective,
    rubricPoints: Array.isArray(question.rubricPoints) ? question.rubricPoints.filter(Boolean) : undefined,
    commonMistakes: Array.isArray(question.commonMistakes) ? question.commonMistakes.filter(Boolean) : undefined,
    keywords: type === "theory" ? question.keywords ?? [] : undefined,
  };
}

function normalizeHeader(value: RowValue) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getValue(values: Map<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = values.get(key);
    if (value) return value;
  }

  return "";
}

function getDifficulty(value: string): Question["difficulty"] {
  return value === "easy" || value === "hard" ? value : "medium";
}

function splitList(value: string) {
  return value
    .split(/\r?\n|;|\|/)
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}
