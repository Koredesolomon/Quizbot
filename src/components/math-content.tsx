import katex from "katex";

type Segment =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "math";
      value: string;
      display: boolean;
    };

export function MathContent({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  const html = renderMathText(normalizeMathInput(children));

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function normalizeMathInput(value: string) {
  return value
    .replace(/\uFF04/g, "$")
    .replace(/\\\$/g, "$")
    .replace(/\\\\(?=[A-Za-z([])/g, "\\");
}

function renderMathText(value: string) {
  return parseMathSegments(value)
    .map((segment) => {
      if (segment.type === "text") return renderTextWithAutoMath(segment.value);

      try {
        return renderKatex(segment.value, segment.display);
      } catch {
        return escapeHtml(segment.value);
      }
    })
    .join("");
}

function renderTextWithAutoMath(value: string) {
  const dimensionPattern = /\b(?:[MLT](?:\^-?\d+)?){2,}\b/g;
  const unitExpressionPattern =
    /\b(?:kg|g|m|s|A|K|mol|cd|N|Pa|J|W|C|V|Hz|Ω|ohm|Ohm)(?:\^-?\d+)?(?:\s+(?:kg|g|m|s|A|K|mol|cd|N|Pa|J|W|C|V|Hz|Ω|ohm|Ohm)(?:\^-?\d+)?)+\b/g;
  const latexCommandPattern =
    /\\[A-Za-z]+(?:\s*(?:\{[^{}\n]*(?:\{[^{}\n]*\}[^{}\n]*)*\}|\[[^\]\n]*\])){0,4}(?:\s*[_^](?:\{[^{}\n]+\}|[A-Za-z0-9+\-=]+))?/g;
  const simpleLatexPattern =
    /\b[A-Za-z][A-Za-z0-9]*(?:\s*[A-Za-z][A-Za-z0-9]*)?\s*(?:\^\{[^{}\n]+\}|_\{[^{}\n]+\})(?:\s*(?:\^\{[^{}\n]+\}|_\{[^{}\n]+\}))?/g;
  const mathMatches = [
    ...Array.from(value.matchAll(latexCommandPattern), (match) => ({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      value: match[0].replace(/\s+/g, ""),
    })),
    ...Array.from(value.matchAll(unitExpressionPattern), (match) => ({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      value: toUnitLatex(match[0]),
    })),
    ...Array.from(value.matchAll(dimensionPattern), (match) => ({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      value: toDimensionLatex(match[0]),
    })),
    ...Array.from(value.matchAll(simpleLatexPattern), (match) => ({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      value: match[0].replace(/\s+/g, ""),
    })),
  ].sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));

  let cursor = 0;
  let html = "";

  for (const match of mathMatches) {
    if (match.start < cursor) continue;

    html += escapeHtml(value.slice(cursor, match.start)).replace(/\n/g, "<br />");
    html += renderKatex(match.value, false);
    cursor = match.end;
  }

  html += escapeHtml(value.slice(cursor)).replace(/\n/g, "<br />");
  return html;
}

function toDimensionLatex(value: string) {
  const terms = [...value.matchAll(/[MLT](?:\^-?\d+)?/g)].map(([term]) => {
    const [symbol, exponent] = term.split("^");
    return exponent ? `${symbol}^{${exponent}}` : symbol;
  });

  return terms.join("");
}

function toUnitLatex(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((term) => {
      const match = term.match(/^(.+?)\^(-?\d+)$/);
      if (!match) return term === "ohm" || term === "Ohm" ? "\\Omega" : `\\mathrm{${term}}`;

      const [, unit, exponent] = match;
      const renderedUnit = unit === "ohm" || unit === "Ohm" ? "\\Omega" : `\\mathrm{${unit}}`;
      return `${renderedUnit}^{${exponent}}`;
    })
    .join("\\,");
}

function renderKatex(value: string, displayMode: boolean) {
  return katex.renderToString(normalizeLatex(value), {
    displayMode,
    throwOnError: false,
    trust: false,
  });
}

function normalizeLatex(value: string) {
  return value
    .trim()
    .replace(/^\$+|\$+$/g, "")
    .replace(/^\\\(|\\\)$/g, "")
    .replace(/^\\\[|\\\]$/g, "")
    .replace(/\\\\(?=[A-Za-z([])/g, "\\")
    .trim();
}

function parseMathSegments(value: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const match = findNextDelimiter(value, cursor);

    if (!match) {
      segments.push({ type: "text", value: value.slice(cursor) });
      break;
    }

    if (match.start > cursor) {
      segments.push({ type: "text", value: value.slice(cursor, match.start) });
    }

    const contentStart = match.start + match.open.length;
    const closeIndex = value.indexOf(match.close, contentStart);

    if (closeIndex === -1) {
      segments.push({ type: "text", value: value.slice(match.start) });
      break;
    }

    segments.push({
      type: "math",
      value: value.slice(contentStart, closeIndex),
      display: match.display,
    });
    cursor = closeIndex + match.close.length;
  }

  return segments;
}

function findNextDelimiter(value: string, cursor: number) {
  const delimiters = [
    { open: "$$", close: "$$", display: true },
    { open: "\\[", close: "\\]", display: true },
    { open: "\\(", close: "\\)", display: false },
    { open: "$", close: "$", display: false },
  ];

  return delimiters
    .map((delimiter) => ({
      ...delimiter,
      start: value.indexOf(delimiter.open, cursor),
    }))
    .filter((delimiter) => delimiter.start >= 0)
    .sort((a, b) => a.start - b.start || b.open.length - a.open.length)[0];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
