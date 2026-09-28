import type { MarkedQuestion, Question, TopicBreakdown } from "@/types/platform";

export function markResponses(answers: Record<string, string>, questions: Question[]): MarkedQuestion[] {
  return questions.map((question) => {
    const userAnswer = (answers[question.id] ?? "").trim();

    if (!userAnswer) {
      return {
        ...question,
        userAnswer,
        awarded: 0,
        correct: false,
        aiFeedback: "No response was submitted for this question.",
      };
    }

    if (question.type === "objective") {
      const correct = objectiveAnswersMatch(userAnswer, question.answer, question.options);

      return {
        ...question,
        userAnswer,
        awarded: correct ? question.marks : 0,
        correct,
        aiFeedback: correct
          ? "Correct. Your response matches the expected answer."
          : "Incorrect. Review the concept and compare your choice with the model answer.",
      };
    }

    const normalizedAnswer = userAnswer.toLowerCase();
    const keywordHits =
      question.keywords?.filter((keyword) => normalizedAnswer.includes(keyword.toLowerCase()))
        .length ?? 0;
    const ratio = keywordHits / (question.keywords?.length || 1);
    const awarded = Math.min(question.marks, Math.round(ratio * question.marks));
    const correct = awarded >= Math.ceil(question.marks * 0.7);

    return {
      ...question,
      userAnswer,
      awarded,
      correct,
      aiFeedback:
        awarded === question.marks
          ? "Excellent response. You included the key idea and relevant supporting terms."
          : awarded > 0
            ? "Partially correct. Your answer shows understanding, but it misses some expected points."
            : "The response does not include enough of the expected concepts yet.",
    };
  });
}

function objectiveAnswersMatch(userAnswer: string, modelAnswer: string, options: string[] = []) {
  const expectedValues = answerCandidates(modelAnswer, options);
  const responseValues = answerCandidates(userAnswer, options);

  return responseValues.some((response) => expectedValues.includes(response));
}

function answerCandidates(value: string, options: string[]) {
  const raw = value.trim();
  const candidates = new Set<string>([normalizeAnswer(raw)]);
  const letterIndex = answerLetterIndex(raw);

  if (letterIndex !== null) {
    candidates.add(normalizeAnswer(String.fromCharCode(65 + letterIndex)));
    if (options[letterIndex]) candidates.add(normalizeAnswer(options[letterIndex]));
  }

  const optionIndex = options.findIndex((option) => normalizeAnswer(option) === normalizeAnswer(raw));
  if (optionIndex >= 0) candidates.add(normalizeAnswer(String.fromCharCode(65 + optionIndex)));

  return Array.from(candidates).filter(Boolean);
}

function answerLetterIndex(value: string) {
  const match = value.trim().match(/^(?:option\s*)?([A-E])[\).:\-]?$/i);
  if (!match) return null;
  return match[1].toUpperCase().charCodeAt(0) - 65;
}

function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .replace(/\$+/g, "")
    .replace(/\\mathrm\{([^{}]+)\}/g, "$1")
    .replace(/\^\{([^{}]+)\}/g, "^$1")
    .replace(/_\{([^{}]+)\}/g, "_$1")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, (character) => superscriptToAscii[character] ?? character)
    .replace(/[₀₁₂₃₄₅₆₇₈₉₋₊]/g, (character) => subscriptToAscii[character] ?? character)
    .replace(/\s+/g, "")
    .replace(/[.,;:]/g, "")
    .trim();
}

const superscriptToAscii: Record<string, string> = {
  "⁰": "^0",
  "¹": "^1",
  "²": "^2",
  "³": "^3",
  "⁴": "^4",
  "⁵": "^5",
  "⁶": "^6",
  "⁷": "^7",
  "⁸": "^8",
  "⁹": "^9",
  "⁻": "^-",
  "⁺": "^+",
};

const subscriptToAscii: Record<string, string> = {
  "₀": "_0",
  "₁": "_1",
  "₂": "_2",
  "₃": "_3",
  "₄": "_4",
  "₅": "_5",
  "₆": "_6",
  "₇": "_7",
  "₈": "_8",
  "₉": "_9",
  "₋": "_-",
  "₊": "_+",
};

export function getTopicBreakdown(marked: MarkedQuestion[]): TopicBreakdown[] {
  const groups = new Map<string, { scored: number; available: number; weak: number }>();

  marked.forEach((question) => {
    const current = groups.get(question.topic) ?? { scored: 0, available: 0, weak: 0 };
    current.scored += question.awarded;
    current.available += question.marks;
    if (question.awarded < question.marks) current.weak += 1;
    groups.set(question.topic, current);
  });

  return Array.from(groups.entries()).map(([topic, values]) => ({
    topic,
    ...values,
    percent: values.available ? Math.round((values.scored / values.available) * 100) : 0,
  }));
}
