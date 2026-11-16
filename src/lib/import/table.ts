import type { AnswerTable } from "@/lib/answer-table";
import type { ImportCell } from "./raw";

/** Same limits the API enforces on a table the student fills in. */
export const maxTableColumns = 12;
export const maxTableRows = 20;

const clean = (cell: ImportCell | undefined) => (cell?.text ?? "").replace(/\s+/g, " ").trim();

/** Words in a question that say the student must complete a table. */
const completeTableCue = /\b(?:complete|fill(?:\s+in)?|copy\s+and\s+complete|draw\s+and\s+complete)\b[^.?!]{0,60}\btable\b|\btable\b[^.?!]{0,60}\b(?:to\s+be\s+(?:completed|filled)|blank|empty)\b/i;

export function asksToCompleteTable(prompt: string) {
  return completeTableCue.test(prompt);
}

/** The cells below the header row and right of the heading column. */
function bodyCells(rows: ImportCell[][]) {
  return rows.slice(1).flatMap((row) => row.slice(1));
}

/**
 * A Word table in a question is something for the student to fill in when its body is mostly blank,
 * or when the question says to complete a table. A table of given values is data to read, not to fill in.
 */
export function isFillInTable(rows: ImportCell[][], prompt: string) {
  const body = bodyCells(rows);
  if (!body.length) return false;
  const blank = body.filter((cell) => !clean(cell)).length;
  return blank >= body.length / 2 || asksToCompleteTable(prompt);
}

/** A grid worth turning into a table: a heading row, a heading column, at least one body cell, and no pictures. */
export function isGrid(rows: ImportCell[][]) {
  if (rows.length < 2) return false;
  const width = Math.max(...rows.map((row) => row.length));
  if (width < 2) return false;
  return !rows.some((row) => row.some((cell) => cell.images.length));
}

/** Plain-text version of a table, used when it cannot become a fill-in table. */
export function tableToText(rows: ImportCell[][]) {
  return rows.map((row) => row.map(clean).join(" | ")).join("\n");
}

export type BuiltTable = { table: AnswerTable; warnings: string[] } | { error: string };

/**
 * First row = column headings, first column = row headings, top-left cell = corner.
 * Cells typed into the question's table are dropped (students fill every cell); the correct cells come from
 * the table in the answer, when there is one.
 */
export function buildAnswerTable(rows: ImportCell[][], solutionRows?: ImportCell[][]): BuiltTable {
  const width = Math.max(...rows.map((row) => row.length));
  const columns = Array.from({ length: width - 1 }, (_, index) => clean(rows[0][index + 1]));
  const rowHeadings = rows.slice(1).map((row) => clean(row[0]));

  if (columns.some((heading) => !heading) || rowHeadings.some((heading) => !heading)) {
    return { error: "A table in this question has a blank row or column heading, so it was not turned into a fill-in table." };
  }
  if (columns.length > maxTableColumns || rowHeadings.length > maxTableRows) {
    return { error: `A table in this question is larger than ${maxTableColumns} columns by ${maxTableRows} rows, so it was not turned into a fill-in table.` };
  }

  const warnings: string[] = [];
  const corner = clean(rows[0][0]);
  const table: AnswerTable = { ...(corner ? { corner } : {}), columns, rows: rowHeadings };

  if (bodyCells(rows).some((cell) => clean(cell))) {
    warnings.push("The table in the question had values typed in its cells. Students fill in every cell, so those values were not kept.");
  }

  if (solutionRows) {
    const solution = solutionRows.slice(1).map((row) => columns.map((_, index) => clean(row[index + 1])));
    const sameShape = solution.length === rowHeadings.length && solutionRows[0].length - 1 === columns.length;
    if (sameShape) {
      table.solution = solution;
    } else {
      warnings.push("The table in the answer does not have the same rows and columns as the question's table, so the correct cells were left blank. Enter them when you edit the question.");
    }
  }

  return { table, warnings };
}
