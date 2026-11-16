import { tableToMarkdownText } from "@/lib/markdown-table";

/** A table typed as lines of space-separated values, e.g. "⊕ 0 1 2" then "0 0 1 2" … */
export type GridBlock = {
  /** Line range in the text (end is exclusive). */
  start: number;
  end: number;
  corner: string;
  columns: string[];
  rows: string[];
  cells: string[][];
};

const maxColumns = 12;
const maxRows = 20;
const maxTokenLength = 12;

function tokens(line: string) {
  const text = line.trim();
  if (!text || text.length > 80 || text.includes("|")) return [];
  const parts = text.split(/\s+/);
  return parts.length >= 3 && parts.length <= maxColumns + 1 && parts.every((part) => part.length <= maxTokenLength) ? parts : [];
}

const plainNumber = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
/** Table values are short: numbers, symbols or single letters, not words of a sentence. */
const valueLike = (token: string) => /\d/.test(token) || token.length === 1;

/**
 * Finds runs of lines that read as a table: a header row, then rows with one more value (their heading) each.
 * The header may start with a corner symbol ("⊕ 0 1 2" above "0 0 1 2") or leave it out ("0 1 2" above "0 0 1 2").
 * Number grids with a numeric first cell and prose are left alone.
 */
export function findGridBlocks(text: string): GridBlock[] {
  const lines = text.split("\n");
  const blocks: GridBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const header = tokens(lines[index]);
    if (!header.length) { index++; continue; }

    let end = index + 1;
    let shape: { corner: string; columns: string[] } | undefined;

    // Shape 1: a corner symbol, then the column headings, over rows of the same length ("⊕ 0 1 2" above "0 0 1 2").
    while (end < lines.length && tokens(lines[end]).length === header.length && end - index <= maxRows) end++;
    if (end - index - 1 >= 2 && !plainNumber.test(header[0])) shape = { corner: header[0], columns: header.slice(1) };

    // Shape 2: no corner, so the header has one fewer value than the rows below it ("0 1 2" above "0 0 1 2").
    if (!shape) {
      const first = tokens(lines[index + 1] ?? "");
      if (first.length === header.length + 1) {
        end = index + 2;
        while (end < lines.length && tokens(lines[end]).length === first.length && end - index <= maxRows) end++;
        if (end - index - 1 >= 2) shape = { corner: "", columns: header };
      }
    }

    if (shape) {
      const body = lines.slice(index + 1, end).map((line) => tokens(line));
      const values = body.flatMap((row) => row.slice(1));
      const looksLikeValues = values.filter(valueLike).length >= values.length * 0.6;
      // A sentence above a block of numbers is not a header row: its words are not value-like either.
      const headerLooksLikeValues = shape.columns.filter(valueLike).length >= shape.columns.length * 0.6;
      const headings = new Set(body.map((row) => row[0]));
      const distinct = headings.size === body.length && new Set(shape.columns).size === shape.columns.length;
      if (looksLikeValues && headerLooksLikeValues && distinct) {
        blocks.push({ start: index, end, corner: shape.corner, columns: shape.columns, rows: body.map((row) => row[0]), cells: body.map((row) => row.slice(1)) });
        index = end;
        continue;
      }
    }
    index++;
  }
  return blocks;
}

/** Removes the lines of a block from the text. */
export function removeBlock(text: string, block: GridBlock) {
  const lines = text.split("\n");
  lines.splice(block.start, block.end - block.start);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Replaces every grid in the text with a markdown table, which the app displays as a real table. */
export function gridsToMarkdown(text: string) {
  const blocks = findGridBlocks(text);
  if (!blocks.length) return text;
  const lines = text.split("\n");
  for (const block of [...blocks].reverse()) {
    const markdown = tableToMarkdownText([block.corner, ...block.columns], block.rows.map((row, rowIndex) => [row, ...block.cells[rowIndex]]));
    lines.splice(block.start, block.end - block.start, ...markdown.split("\n"));
  }
  return lines.join("\n");
}

export const gridLimits = { maxColumns, maxRows };
