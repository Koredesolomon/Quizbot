import { parse, evaluate } from "mathjs";

/** The result of checking a student's final answer in code. `null` means the check cannot decide. */
export type FinalAnswerVerdict = { correct: boolean; expected: string } | null;

const NUMBER = /[-+]?(?:\d+\.?\d*|\.\d+)(?:\s*(?:[eE][-+]?\d+|(?:[x×*]|\\times)\s*10\s*\^\s*\{?[-+]?\d+\}?))?/g;
const MARKER = /(?:final\s+answer|answer|ans|therefore|hence|thus|∴|=)\s*[:=is]*/gi;
const RELATIVE_TOLERANCE = 0.01;

export function checkFinalAnswer(type: "numeric" | "expression" | "text" | undefined, response: string, modelAnswer: string): FinalAnswerVerdict {
  if (type === "numeric") return checkNumeric(response, modelAnswer);
  if (type === "expression") return checkExpression(response, modelAnswer);
  return null;
}

function checkNumeric(response: string, modelAnswer: string): FinalAnswerVerdict {
  const expectedToken = numbersIn(modelAnswer)[0];
  const expected = expectedToken === undefined ? NaN : toNumber(expectedToken);
  if (!Number.isFinite(expected)) return null;

  const tail = afterLastMarker(response);
  const tokens = numbersIn(tail);
  // After "answer:" or "=" the first number is the result. Without a marker the last number is.
  const token = tail === response ? tokens[tokens.length - 1] : tokens[0];
  const actual = token === undefined ? NaN : toNumber(token);
  if (!Number.isFinite(actual)) return { correct: false, expected: modelAnswer.trim() };

  const allowed = Math.max(Math.abs(expected) * RELATIVE_TOLERANCE, halfLastDigit(expectedToken as string), 1e-9);
  return { correct: Math.abs(actual - expected) <= allowed, expected: modelAnswer.trim() };
}

function checkExpression(response: string, modelAnswer: string): FinalAnswerVerdict {
  const expected = parseExpression(modelAnswer);
  const actual = parseExpression(afterLastEquals(response));
  if (!expected) return null;
  if (!actual) return null;

  const symbols = Array.from(new Set([...expected.symbols, ...actual.symbols]));
  const samples = [1.3, 2.7, 0.6, 4.1, 3.3];
  try {
    for (let round = 0; round < samples.length; round++) {
      const scope: Record<string, number> = {};
      symbols.forEach((symbol, index) => { scope[symbol] = samples[(round + index * 2) % samples.length] + index * 0.37; });
      const left = Number(evaluate(expected.text, { ...scope }));
      const right = Number(evaluate(actual.text, { ...scope }));
      if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
      if (Math.abs(left - right) > 1e-6 * Math.max(1, Math.abs(left))) return { correct: false, expected: modelAnswer.trim() };
    }
  } catch {
    return null;
  }
  return { correct: true, expected: modelAnswer.trim() };
}

function parseExpression(raw: string) {
  const text = raw
    .replace(/\$+/g, "")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "(($1)/($2))")
    .replace(/\\(?:cdot|times)/g, "*")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/[{}]/g, (brace) => (brace === "{" ? "(" : ")"))
    .trim();
  if (!text) return null;
  try {
    const symbols = new Set<string>();
    parse(text).traverse((node, _path, parent) => {
      const named = node as unknown as { type: string; name?: string };
      const isCall = parent && (parent as unknown as { type: string; fn?: unknown }).type === "FunctionNode" && (parent as unknown as { fn: unknown }).fn === node;
      if (named.type === "SymbolNode" && named.name && !isCall && !CONSTANTS.has(named.name)) symbols.add(named.name);
    });
    return { text, symbols: Array.from(symbols) };
  } catch {
    return null;
  }
}

const CONSTANTS = new Set(["pi", "e", "PI", "E", "tau", "phi", "Infinity", "NaN", "i"]);

function afterLastMarker(text: string) {
  const matches = [...text.matchAll(MARKER)];
  const last = matches[matches.length - 1];
  return last?.index === undefined ? text : text.slice(last.index + last[0].length);
}

function afterLastEquals(text: string) {
  const index = text.lastIndexOf("=");
  return (index >= 0 ? text.slice(index + 1) : text).trim();
}

/** Numbers in the text, ignoring unit exponents such as the 2 in "m/s^2". */
function numbersIn(text: string) {
  const cleaned = text.replace(/−/g, "-").replace(/(\d),(?=\d{3}\b)/g, "$1").replace(/([A-Za-z)])(\s*\^?\s*\{?[-+]?\d+\}?)/g, (match, letter: string, _rest: string, offset: number, whole: string) =>
      // "3e8" and "3 x 10^8" are numbers, not units.
      /^[xeE]$/.test(letter) && /\d$/.test(whole.slice(0, offset).trimEnd()) ? match : letter);
  return cleaned.match(NUMBER)?.map((token) => token.trim()) ?? [];
}

function toNumber(token: string) {
  const scientific = token.match(/^([-+]?[\d.]+)\s*(?:[x×*]|\\times)\s*10\s*\^\s*\{?([-+]?\d+)\}?$/);
  return Number(scientific ? `${scientific[1]}e${scientific[2]}` : token);
}

/** Half a unit in the last written digit, so "9.8" accepts 9.81 and 9.75 but a stray 9.0 is out. */
function halfLastDigit(token: string) {
  if (/[eE×x*]/.test(token)) return 0;
  const decimals = token.split(".")[1]?.length ?? 0;
  return 0.5 * 10 ** -decimals;
}
