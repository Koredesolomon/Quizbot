import type { MarkedQuestion, Question, TopicBreakdown } from "@/types/platform";

export function markResponses(answers: Record<number, string>, questions: Question[]): MarkedQuestion[] {
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
      const correct = userAnswer === question.answer;

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
