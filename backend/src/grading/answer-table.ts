/** A table the student fills in, e.g. a multiplication table. `solution` holds the correct cells and is never sent to students. */
export type AnswerTable = {
  corner?: string;
  columns: string[];
  rows: string[];
  solution?: string[][];
  /** Marks for the table cells. The rest of the question's marks are for the written answer. Defaults to all marks. */
  tableMarks?: number;
};

function cell(value: string) {
  return value.replace(/\r?\n/g, " ").replace(/\|/g, "\\|");
}

/** The table as a markdown table, the same layout the student's answer is stored in. */
export function tableToMarkdown(table: Pick<AnswerTable, "corner" | "columns" | "rows">, cells: string[][]) {
  const line = (values: string[]) => `| ${values.map(cell).join(" | ")} |`;
  return [
    line([table.corner ?? "", ...table.columns]),
    line(["---", ...table.columns.map(() => "---")]),
    ...table.rows.map((row, rowIndex) => line([row, ...table.columns.map((_, columnIndex) => cells[rowIndex]?.[columnIndex] ?? "")])),
  ].join("\n");
}

/** Separates the filled table from the written answer in the stored answer string (same text the app writes). */
const tableDivider = "\n\n--- Written answer ---\n";
const tableHeader = /^\|.*\|\n\|(?: ?---(?: ?\|)?)+/;

/** Reads the student's stored answer back into cells and the written part. */
export function parseTableAnswer(table: Pick<AnswerTable, "columns" | "rows">, value: string) {
  const cells = table.rows.map(() => table.columns.map(() => ""));
  if (!tableHeader.test(value)) return { cells, text: value };

  const dividerIndex = value.indexOf(tableDivider);
  const markdown = dividerIndex < 0 ? value : value.slice(0, dividerIndex);
  const text = dividerIndex < 0 ? "" : value.slice(dividerIndex + tableDivider.length);

  markdown.split("\n").slice(2).forEach((line, rowIndex) => {
    if (rowIndex >= table.rows.length) return;
    const parts = line.replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/);
    parts.slice(1).forEach((part, columnIndex) => {
      if (columnIndex < table.columns.length) cells[rowIndex][columnIndex] = part.replace(/^ /, "").replace(/ $/, "").replace(/\\\|/g, "|");
    });
  });

  return { cells, text };
}

/** Case, spacing and number formatting do not matter: " 0.50 ", ".5" and "0.5" are the same answer. */
export function normalizeCell(value: string) {
  const text = value.replace(/[−–]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
  return /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/.test(text) ? String(Number(text)) : text;
}

export type TableComparison = {
  /** Cells that have a correct value to compare against (blank correct cells are not marked). */
  total: number;
  correct: number;
  wrong: Array<{ row: string; column: string; expected: string; got: string }>;
};

export function compareTable(table: Pick<AnswerTable, "columns" | "rows" | "solution">, cells: string[][]): TableComparison {
  const result: TableComparison = { total: 0, correct: 0, wrong: [] };
  table.rows.forEach((row, rowIndex) => table.columns.forEach((column, columnIndex) => {
    const expected = table.solution?.[rowIndex]?.[columnIndex] ?? "";
    if (!expected.trim()) return;
    result.total++;
    const got = cells[rowIndex]?.[columnIndex] ?? "";
    if (normalizeCell(got) === normalizeCell(expected)) result.correct++;
    else result.wrong.push({ row, column, expected: expected.trim(), got: got.trim() });
  }));
  return result;
}
