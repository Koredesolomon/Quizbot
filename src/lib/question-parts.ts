import type { QuestionPart } from "@/types/platform";

/** Read explicitly labelled (a), (b), (c) blocks, retaining shared context before (a). */
export function labelledParts(text: string) {
  const pattern = /(?:^|\n|[ \t]+)(?:\(([a-z])\)|([a-z])[.)])\s+/gim;
  const matches = [...text.matchAll(pattern)];
  if (matches.length < 2 || matches.some((match, index) => (match[1] || match[2]).toLowerCase() !== String.fromCharCode(97 + index))) return null;
  return {
    context: text.slice(0, matches[0].index).trim(),
    parts: matches.map((match, index) => ({
      label: (match[1] || match[2]).toLowerCase(),
      text: text.slice(match.index! + match[0].length, matches[index + 1]?.index ?? text.length).trim(),
    })),
  };
}

export function extractQuestionParts(prompt: string, answer: string, explanation = ""):
  { prompt: string; parts: QuestionPart[] } | { error: string } | null {
  const questions = labelledParts(prompt);
  if (!questions) return null;
  if (questions.parts.length > 12) return { error: "Use at most 12 separately marked parts." };
  const answers = labelledParts(answer);
  const explanations = labelledParts(explanation);
  if (!answers || answers.parts.length !== questions.parts.length) {
    return { error: "This question has labelled parts. Add a model answer for each part, labelled (a), (b), (c), and so on." };
  }
  const parts: QuestionPart[] = [];
  for (const part of questions.parts) {
    const allocation = part.text.match(/(?:^|\s+)(?:\[|\()?\s*(\d+)\s*(?:marks?|mks?|points?|pts?)\s*(?:\]|\))?\s*$/i);
    const model = answers.parts.find((item) => item.label === part.label)?.text ?? "";
    if (!allocation || Number(allocation[1]) < 1) return { error: `Add explicit marks to part (${part.label}), for example [2 marks]. Each part needs its own allocation.` };
    const text = part.text.slice(0, allocation.index).trim();
    if (!text || !model) return { error: `Part (${part.label}) needs both question text and a model answer.` };
    parts.push({ label: part.label, prompt: text, answer: model, marks: Number(allocation[1]), explanation: explanations?.parts.find((item) => item.label === part.label)?.text });
  }
  return { prompt: questions.context || "Answer each part below.", parts };
}

export function partModelAnswer(parts: QuestionPart[]) {
  return parts.map((part) => `(${part.label}) ${part.answer}`).join("\n\n");
}
