/** A table the student fills in, e.g. a multiplication table. `solution` holds the correct cells (admin and results only). */
export type AnswerTable = {
  corner?: string;
  columns: string[];
  rows: string[];
  solution?: string[][];
};

/** Separates the filled table from the written answer in the stored answer string. */
export const tableDivider = "\n\n--- Written answer ---\n";

const tableHeader = /^\|.*\|\n\|(?: ?---(?: ?\|)?)+/;

export function emptyCells(table: Pick<AnswerTable, "columns" | "rows">) {
  return table.rows.map(() => table.columns.map(() => ""));
}

const escapeCell = (value: string) => value.replace(/\r?\n/g, " ").replace(/\|/g, "\\|");
const unescapeCell = (value: string) => value.replace(/\\\|/g, "|");

/**
 * The stored answer: the filled table as a markdown table (which the AI marker reads directly),
 * then the written answer. A blank table is left out, so an untouched question stays unanswered.
 */
export function serializeTableAnswer(table: AnswerTable, cells: string[][], text: string) {
  if (!cells.some((row) => row.some((cell) => cell.trim()))) return text;

  const line = (values: string[]) => `| ${values.map(escapeCell).join(" | ")} |`;
  const markdown = [
    line([table.corner ?? "", ...table.columns]),
    line(["---", ...table.columns.map(() => "---")]),
    ...table.rows.map((row, rowIndex) => line([row, ...table.columns.map((_, columnIndex) => cells[rowIndex]?.[columnIndex] ?? "")])),
  ].join("\n");

  return text.trim() ? `${markdown}${tableDivider}${text}` : markdown;
}

export function parseTableAnswer(table: AnswerTable, value: string) {
  const cells = emptyCells(table);
  if (!tableHeader.test(value)) return { cells, text: value };

  const dividerIndex = value.indexOf(tableDivider);
  const markdown = dividerIndex < 0 ? value : value.slice(0, dividerIndex);
  const text = dividerIndex < 0 ? "" : value.slice(dividerIndex + tableDivider.length);

  markdown.split("\n").slice(2).forEach((line, rowIndex) => {
    if (rowIndex >= table.rows.length) return;
    const parts = line.replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/);
    // Each cell is written as "| value |"; remove exactly that one space either side so typed spaces survive.
    parts.slice(1).forEach((part, columnIndex) => {
      if (columnIndex < table.columns.length) cells[rowIndex][columnIndex] = unescapeCell(part.replace(/^ /, "").replace(/ $/, ""));
    });
  });

  return { cells, text };
}
