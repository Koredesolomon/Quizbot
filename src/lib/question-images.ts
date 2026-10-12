import type { QuestionInput } from "@/lib/question-editor";

const dataUrlPattern = /data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g;

function dataUrlToBlob(dataUrl: string) {
  const [header, base64] = dataUrl.split(",");
  const type = header.match(/^data:([^;]+)/)?.[1] ?? "application/octet-stream";
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  return new Blob([bytes], { type });
}

/**
 * Uploads every embedded (data URL) picture in the questions and swaps in its hosted URL, so question
 * records and attempt snapshots stay small. Identical pictures are uploaded once.
 */
export async function hostQuestionImages<T extends Partial<QuestionInput>>(
  questions: T[],
  upload: (image: Blob) => Promise<{ url: string }>,
  onProgress?: (done: number, total: number) => void
): Promise<T[]> {
  const fields = (question: T) => [question.imageUrl, question.prompt, question.explanation, question.answer, ...(question.options ?? [])];
  const pending = new Set<string>();
  for (const question of questions) {
    for (const value of fields(question)) for (const match of value?.match(dataUrlPattern) ?? []) pending.add(match);
  }
  if (!pending.size) return questions;

  const hosted = new Map<string, string>();
  let done = 0;
  for (const dataUrl of pending) {
    try {
      hosted.set(dataUrl, (await upload(dataUrlToBlob(dataUrl))).url);
    } catch (error) {
      throw new Error(`A picture could not be uploaded: ${error instanceof Error ? error.message : "unknown error"}`);
    }
    onProgress?.(++done, pending.size);
  }

  const swap = (value: string | undefined) => value?.replace(dataUrlPattern, (match) => hosted.get(match) ?? match);
  return questions.map((question) => ({
    ...question,
    imageUrl: swap(question.imageUrl),
    prompt: swap(question.prompt),
    explanation: swap(question.explanation),
    answer: swap(question.answer),
    options: question.options?.map((option) => swap(option) ?? option),
  }));
}
