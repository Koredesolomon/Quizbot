/** A table written as pipe-separated markdown, as the importer produces and MathContent displays. */
export type MarkdownTable = { header: string[]; rows: string[][] };

export type MarkdownPart = { type: "text"; value: string } | { type: "table"; table: MarkdownTable };

const rowPattern = /^\s*\|.*\|\s*$/;
const separatorPattern = /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/;

function cells(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replace(/\\\|/g, "|").trim());
}

/** Splits text into plain text and pipe tables (a header row, a `| --- |` row, then body rows). */
export function splitMarkdownTables(text: string): MarkdownPart[] {
  const lines = text.split("\n");
  const parts: MarkdownPart[] = [];
  let pending: string[] = [];

  const flush = () => {
    if (pending.length) parts.push({ type: "text", value: pending.join("\n") });
    pending = [];
  };

  for (let index = 0; index < lines.length; index++) {
    if (rowPattern.test(lines[index]) && separatorPattern.test(lines[index + 1] ?? "")) {
      const header = cells(lines[index]);
      const rows: string[][] = [];
      let next = index + 2;
      while (next < lines.length && rowPattern.test(lines[next])) rows.push(cells(lines[next++]));
      flush();
      parts.push({ type: "table", table: { header, rows } });
      index = next - 1;
    } else {
      pending.push(lines[index]);
    }
  }
  flush();
  return parts;
}

const cell = (value: string) => value.replace(/\r?\n/g, " ").replace(/\|/g, "\\|");

export function tableToMarkdownText(header: string[], rows: string[][]) {
  const line = (values: string[]) => `| ${values.map(cell).join(" | ")} |`;
  return [line(header), line(header.map(() => "---")), ...rows.map(line)].join("\n");
}
