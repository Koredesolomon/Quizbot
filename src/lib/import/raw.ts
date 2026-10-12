/** Text plus any pictures (as data URLs) found in one spreadsheet cell, Word paragraph or table cell. */
export type ImportCell = { text: string; images: string[]; problems?: string[] };

/** A question as read from a file, before validation and type detection. */
export type RawQuestion = {
  location: string;
  number?: number;
  declaredType?: string;
  sectionType?: string;
  prompt: string;
  promptImages: string[];
  options: ImportCell[];
  answer?: string;
  explanation?: string;
  marks?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  learningObjective?: string;
  rubricPoints?: string;
  commonMistakes?: string;
  keywords?: string;
  imageUrl?: string;
  id?: string;
  /** Options were labelled I, II, III … in the file, so answers may use Roman numerals. */
  romanOptions?: boolean;
  /** Spreadsheet answerBox column (yes/no). */
  answerBox?: string;
  warnings: string[];
};

export function emptyRawQuestion(location: string): RawQuestion {
  return { location, prompt: "", promptImages: [], options: [], warnings: [] };
}

/** Markdown image syntax understood by MathContent; keeps pictures in place inside text. */
export function imageMarkdown(src: string) {
  return `![](${src})`;
}

export function withImages(text: string, images: string[]) {
  return [text.trim(), ...images.map(imageMarkdown)].filter(Boolean).join("\n");
}
