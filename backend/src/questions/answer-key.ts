// Mirrors src/lib/question-answers.ts in the frontend so both sides read answer keys identically.

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").replace(/[.;:]+$/, "").trim();
}

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

/** Every option an answer names, or null when any part does not match an option. */
export function resolveAnswerIndices(answer: string, options: string[]): number[] | null {
  const raw = answer.trim();
  if (!raw || !options.length) return null;

  const whole = resolveOptionIndex(raw, options);
  if (whole >= 0) return [whole];

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

// Choice questions with an answer box submit "<choice>\n\n--- Explanation ---\n<written explanation>".
const explanationDivider = "\n\n--- Explanation ---\n";

export function splitChoiceAnswer(value: string) {
  const index = value.indexOf(explanationDivider);
  return index < 0
    ? { choice: value.trim(), explanation: "" }
    : { choice: value.slice(0, index).trim(), explanation: value.slice(index + explanationDivider.length).trim() };
}

/** Student checkbox answers arrive as option letters ("A, C"); option text is accepted too. */
export function selectedOptionIndices(response: string, options: string[]) {
  const resolved = resolveAnswerIndices(response, options);
  if (resolved) return resolved;
  return Array.from(new Set(response.split(/[,\s]+/).map((part) => resolveOptionIndex(part, options)).filter((index) => index >= 0)))
    .sort((left, right) => left - right);
}
