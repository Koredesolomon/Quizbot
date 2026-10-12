import type { QuestionType } from "@/types/platform";

export const questionTypeLabels: Record<QuestionType, string> = {
  objective: "Objective (single answer)",
  multiple: "MCQ (multiple answers)",
  theory: "Theory (answer box)",
};

export const questionTypeShortLabels: Record<QuestionType, string> = {
  objective: "Objective",
  multiple: "MCQ",
  theory: "Theory",
};

export function optionLetter(index: number) {
  return String.fromCharCode(65 + index);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").replace(/[.;:]+$/, "").trim();
}

/** Index of the option named by a letter ("B", "option b", "(b)") or by its exact text. */
export function resolveOptionIndex(value: string, options: string[]) {
  const raw = value.trim();
  if (!raw) return -1;
  const byText = options.findIndex((option) => normalize(option) === normalize(raw));
  if (byText >= 0) return byText;
  const letter = raw.match(/^(?:option\s*)?\(?([A-Z])[).:-]?$/i);
  if (!letter) return -1;
  const index = letter[1].toUpperCase().charCodeAt(0) - 65;
  return index < options.length ? index : -1;
}

/**
 * Every option an answer names, in option order. Returns null when any part of the answer does not
 * match an option, so callers never silently drop part of an answer key.
 */
export function resolveAnswerIndices(answer: string, options: string[]): number[] | null {
  const raw = answer.trim();
  if (!raw || !options.length) return null;

  const whole = resolveOptionIndex(raw, options);
  if (whole >= 0) return [whole];

  // "B. 4 m/s" or "(b) Kilogram": a letter followed by that option's text.
  const labelled = raw.match(/^\(?([A-Z])\s*[.)]\s+(.+)$/i);
  if (labelled) {
    const index = resolveOptionIndex(labelled[1], options);
    if (index >= 0 && resolveOptionIndex(labelled[2], options) === index) return [index];
  }

  const compact = raw.replace(/\s+/g, "");
  const parts = /^[A-Z]{2,}$/i.test(compact) && Array.from(compact).every((letter) => resolveOptionIndex(letter, options) >= 0)
    ? Array.from(compact)
    : raw.split(/\s*(?:[,;|\n&/]|\band\b)\s*/i).filter(Boolean);
  if (parts.length < 2) return null;

  const indices = new Set<number>();
  for (const part of parts) {
    const index = resolveOptionIndex(part, options);
    if (index < 0) return null;
    indices.add(index);
  }
  return Array.from(indices).sort((left, right) => left - right);
}

export function formatAnswerLetters(indices: number[]) {
  return [...indices].sort((left, right) => left - right).map(optionLetter).join(", ");
}

/** Normalises any supported way of writing a question type; returns undefined when unrecognised. */
export function parseQuestionType(value: string | undefined): QuestionType | undefined {
  const key = (value ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (!key) return undefined;
  if (["objective", "obj", "single", "singleanswer", "singlechoice", "singleoption", "sca", "scq", "radio", "onecorrect", "objectivequestion"].includes(key)) return "objective";
  if (["mcq", "mcqs", "multiple", "multi", "multianswer", "multipleanswer", "multipleanswers", "multiplechoice", "multipleresponse",
    "multipleselect", "multiselect", "mca", "mrq", "checkbox", "checkboxes", "selectall", "selectallthatapply"].includes(key)) return "multiple";
  if (["theory", "essay", "shortanswer", "longanswer", "structured", "openended", "open", "written", "text", "answerbox", "subjective"].includes(key)) return "theory";
  return undefined;
}

export function isChoiceType(type: QuestionType) {
  return type === "objective" || type === "multiple";
}

/** Student checkbox selections are stored as option letters, e.g. "A, C". */
export function parseSelectedLetters(value: string, optionCount: number) {
  return Array.from(new Set(value.split(/[,\s]+/).map((letter) => letter.trim().toUpperCase()).filter(Boolean)))
    .map((letter) => letter.charCodeAt(0) - 65)
    .filter((index) => index >= 0 && index < optionCount)
    .sort((left, right) => left - right);
}

export function toggleSelectedLetter(value: string, index: number, optionCount: number) {
  const selected = new Set(parseSelectedLetters(value, optionCount));
  if (selected.has(index)) selected.delete(index);
  else selected.add(index);
  return formatAnswerLetters(Array.from(selected));
}

/** Spells out MCQ selections ("A, C") as their option text for result screens. */
export function describeAnswer(question: { type: QuestionType; options?: string[] }, value: string) {
  const { choice, explanation } = splitChoiceAnswer(value);
  let described = choice;
  if (question.type === "multiple" && question.options?.length) {
    const indices = parseSelectedLetters(choice, question.options.length);
    if (indices.length) described = indices.map((index) => `${optionLetter(index)}. ${question.options![index]}`).join("\n");
  }
  return explanation.trim() ? `${described || "No option chosen."}\n\n**Explanation:** ${explanation}` : described;
}

// Choice questions with an answer box store "<choice>\n\n--- Explanation ---\n<written explanation>".
export const explanationDivider = "\n\n--- Explanation ---\n";

export function splitChoiceAnswer(value: string) {
  const index = value.indexOf(explanationDivider);
  return index < 0
    ? { choice: value, explanation: "" }
    : { choice: value.slice(0, index), explanation: value.slice(index + explanationDivider.length) };
}

export function joinChoiceAnswer(choice: string, explanation: string) {
  return explanation.trim() ? `${choice}${explanationDivider}${explanation}` : choice;
}

/** Questions that ask students to explain or justify their choice get an answer box under the options. */
export const asksForExplanation = /\b(?:explain\s+(?:your|the)\s+(?:answer|choice)|explain\s+why|give\s+(?:a|your|the)?\s*reasons?|justify\s+your\s+(?:answer|choice)|state\s+(?:a|the|your)\s+reason|show\s+(?:your|all)\s+working)\b/i;
