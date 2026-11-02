/** A table the student fills in, e.g. a multiplication table. `solution` holds the correct cells and is never sent to students. */
export type AnswerTable = {
  corner?: string;
  columns: string[];
  rows: string[];
  solution?: string[][];
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
