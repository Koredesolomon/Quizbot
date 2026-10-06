type MathSegment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; display: boolean; start: number; end: number };

export function parseMathSegments(value: string): MathSegment[] {
  const segments: MathSegment[] = [];
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
    const closeIndex = delimiterIndex(value, match.close, contentStart);

    if (closeIndex === -1) {
      segments.push({ type: "text", value: value.slice(match.start) });
      break;
    }

    segments.push({
      type: "math",
      value: value.slice(contentStart, closeIndex),
      display: match.display,
      start: contentStart,
      end: closeIndex,
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
      start: delimiterIndex(value, delimiter.open, cursor),
    }))
    .filter((delimiter) => delimiter.start >= 0)
    .sort((a, b) => a.start - b.start || b.open.length - a.open.length)[0];
}

function delimiterIndex(value: string, delimiter: string, cursor: number) {
  let index = value.indexOf(delimiter, cursor);
  while (index >= 0) {
    let slashes = 0;
    for (let previous = index - 1; previous >= 0 && value[previous] === "\\"; previous -= 1) slashes += 1;
    if (slashes % 2 === 0) return index;
    index = value.indexOf(delimiter, index + delimiter.length);
  }
  return -1;
}

