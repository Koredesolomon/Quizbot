import { BadRequestException } from "@nestjs/common";

/** Structured answers keep one part's work from being awarded marks for another part. */
export function parsePartAnswers(response: string, labels: string[]): Record<string, string> {
  if (!response.trim()) return {};
  let value: unknown;
  try { value = JSON.parse(response); } catch {
    throw new BadRequestException("Answer each question part in its own answer box. Reload this quiz if the boxes are missing.");
  }
  const data = value as { kind?: unknown; answers?: unknown } | null;
  if (!data || data.kind !== "question-parts" || !data.answers || typeof data.answers !== "object" || Array.isArray(data.answers)) {
    throw new BadRequestException("Invalid question part answers.");
  }
  const entries = Object.entries(data.answers);
  if (entries.some(([label, answer]) => !labels.includes(label) || typeof answer !== "string")) {
    throw new BadRequestException("Answers must belong to the question's parts and contain text only.");
  }
  return Object.fromEntries(entries) as Record<string, string>;
}
