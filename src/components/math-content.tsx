import katex from "katex";

import { parseMathSegments } from "@/lib/math-segments";

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
  return value.replace(/\uFF04/g, "$");
}

function renderMathText(value: string) {
  // Keep generated math HTML out of the formatting parser.
  const protectedHtml: string[] = [];
  const protect = (html: string) => {
    const expanded = html.replace(/\u0000(\d+)\u0000/g, (_, index: string) => protectedHtml[Number(index)] ?? "");
    return `\u0000${protectedHtml.push(expanded) - 1}\u0000`;
  };
  const withCode = value.replace(/`([^`\n]+)`/g, (_, text: string) => protect(`<code class="rounded bg-slate-200 px-1 font-mono">${escapeHtml(text)}</code>`));
  const formatted = parseMathSegments(withCode)
    .map((segment) => {
      if (segment.type === "text") return renderTextWithAutoMath(segment.value, protect);

      try {
        return protect(renderKatex(segment.value, segment.display));
      } catch {
        return escapeHtml(segment.value);
      }
    })
    .join("");

  return renderFormatting(formatted, protect)
    .replace(/\u0000(\d+)\u0000/g, (_, index: string) => protectedHtml[Number(index)] ?? "");
}

function renderFormatting(value: string, protect: (html: string) => string) {
  const inline = value
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
      (_, text: string, href: string) => protect(`<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-sky-700 underline">${text}</a>`))
    .replace(/\*\*([^\n]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>")
    .replace(/_([^\n]+?)_/g, "<em>$1</em>")
    .replace(/\+\+([^\n]+?)\+\+/g, "<u>$1</u>")
    .replace(/~~([^\n]+?)~~/g, "<s>$1</s>")
    .replace(/&lt;u&gt;([^\n]+?)&lt;\/u&gt;/g, "<u>$1</u>");

  return inline.split("\n").map((line) => {
    const heading = line.match(/^(#{2,4}) (.*)$/);
    if (heading) {
      const size = heading[1].length === 2 ? "text-xl" : heading[1].length === 3 ? "text-lg" : "text-base";
      return `<span class="block ${size} font-bold">${heading[2]}</span>`;
    }
    if (line.startsWith("- ")) return `<span class="block pl-3">• ${line.slice(2)}</span>`;
    if (/^\d+\. /.test(line)) return `<span class="block pl-3">${line}</span>`;
    if (line.startsWith("&gt; ")) return `<span class="block border-l-2 border-slate-300 pl-3 italic">${line.slice(5)}</span>`;
    return line;
  }).join("<br />");
}

function renderTextWithAutoMath(value: string, protect: (html: string) => string) {
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

    html += escapeHtml(value.slice(cursor, match.start));
    html += protect(renderKatex(match.value, false));
    cursor = match.end;
  }

  html += escapeHtml(value.slice(cursor));
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
    .trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
