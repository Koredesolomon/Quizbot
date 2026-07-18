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
  const html = renderMathText(children);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
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
  let cursor = 0;
  let html = "";

  for (const match of value.matchAll(dimensionPattern)) {
    const start = match.index ?? 0;
    const expression = match[0];

    html += escapeHtml(value.slice(cursor, start)).replace(/\n/g, "<br />");
    html += renderKatex(toDimensionLatex(expression), false);
    cursor = start + expression.length;
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

function renderKatex(value: string, displayMode: boolean) {
  return katex.renderToString(value, {
    displayMode,
    throwOnError: false,
    trust: false,
  });
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
