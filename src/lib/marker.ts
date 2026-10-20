import type { MarkedQuestion, TopicBreakdown } from "@/types/platform";

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
