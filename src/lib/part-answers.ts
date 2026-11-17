/** A blank set stays blank for unanswered counts. Labels keep answers stable when navigating and reloading. */
export function serializePartAnswers(answers: Record<string, string>): string {
  return Object.values(answers).some((answer) => answer.trim())
    ? JSON.stringify({ kind: "question-parts", answers }) : "";
}

export function parsePartAnswers(value: string): Record<string, string> {
  try {
    const data = JSON.parse(value);
    if (data?.kind !== "question-parts" || !data.answers || typeof data.answers !== "object" || Array.isArray(data.answers)) return {};
    return Object.fromEntries(Object.entries(data.answers).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  } catch { return {}; }
}
