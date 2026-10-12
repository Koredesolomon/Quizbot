import { child, children, childVal, type XmlNode } from "./xml";

// Word equations (OMML) converted to LaTeX so MathContent can render them with KaTeX.

const symbols: Record<string, string> = {
  α: "\\alpha", β: "\\beta", γ: "\\gamma", δ: "\\delta", ε: "\\epsilon", ϵ: "\\epsilon", ζ: "\\zeta", η: "\\eta",
  θ: "\\theta", ϑ: "\\vartheta", ι: "\\iota", κ: "\\kappa", λ: "\\lambda", μ: "\\mu", ν: "\\nu", ξ: "\\xi",
  π: "\\pi", ρ: "\\rho", σ: "\\sigma", τ: "\\tau", υ: "\\upsilon", φ: "\\phi", ϕ: "\\phi", χ: "\\chi",
  ψ: "\\psi", ω: "\\omega", Γ: "\\Gamma", Δ: "\\Delta", "∆": "\\Delta", Θ: "\\Theta", Λ: "\\Lambda", Ξ: "\\Xi",
  Π: "\\Pi", Σ: "\\Sigma", Φ: "\\Phi", Ψ: "\\Psi", Ω: "\\Omega", "\u2126": "\\Omega", // Greek capital omega and the ohm sign
  "×": "\\times", "÷": "\\div", "·": "\\cdot", "⋅": "\\cdot", "±": "\\pm", "∓": "\\mp", "∞": "\\infty",
  "≈": "\\approx", "≠": "\\neq", "≤": "\\leq", "≥": "\\geq", "≡": "\\equiv", "∝": "\\propto", "∼": "\\sim",
  "→": "\\rightarrow", "←": "\\leftarrow", "⇒": "\\Rightarrow", "⇔": "\\Leftrightarrow", "↔": "\\leftrightarrow",
  "∂": "\\partial", "∇": "\\nabla", "∑": "\\sum", "∏": "\\prod", "∫": "\\int", "∬": "\\iint", "∮": "\\oint",
  "√": "\\surd", "°": "^{\\circ}", "∠": "\\angle", "∈": "\\in", "∉": "\\notin", "⊂": "\\subset", "∪": "\\cup",
  "∩": "\\cap", "∀": "\\forall", "∃": "\\exists", "ℏ": "\\hbar", "…": "\\ldots", "⋯": "\\cdots", "′": "'",
  "−": "-", "‐": "-",
};

const escapes: Record<string, string> = {
  "\\": "\\backslash ", "{": "\\{", "}": "\\}", "%": "\\%", "#": "\\#", "&": "\\&", "$": "\\$", "_": "\\_", "^": "\\^{}",
};

const accents: Record<string, string> = {
  "̇": "\\dot", "̈": "\\ddot", "̂": "\\hat", "⃗": "\\vec", "̅": "\\bar", "̄": "\\bar",
  "̃": "\\tilde", "̌": "\\check", "́": "\\acute", "̀": "\\grave",
};

const functionNames = new Set(["sin", "cos", "tan", "cot", "sec", "csc", "log", "ln", "exp", "lim", "max", "min", "sinh", "cosh", "tanh", "arcsin", "arccos", "arctan", "det"]);

function escapeText(value: string) {
  return Array.from(value).map((character) => escapes[character] ?? symbols[character] ?? character).join("")
    // Separate command names from following letters ("\\pir" -> "\\pi r").
    .replace(/(\\[A-Za-z]+)(?=[A-Za-z])/g, "$1 ");
}

function group(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 1 ? trimmed : `{${trimmed}}`;
}

function convertChildren(node: XmlNode | undefined): string {
  return children(node).map(convert).join("");
}

function arg(node: XmlNode | undefined, name: string) {
  return convertChildren(child(node, name));
}

function delimiter(value: string | undefined, fallback: string) {
  const character = value ?? fallback;
  if (!character) return ".";
  const map: Record<string, string> = { "{": "\\{", "}": "\\}", "⟨": "\\langle", "⟩": "\\rangle", "|": "|", "‖": "\\|", "⌊": "\\lfloor", "⌋": "\\rfloor", "⌈": "\\lceil", "⌉": "\\rceil" };
  return map[character] ?? character;
}

function convert(node: XmlNode): string {
  switch (node.localName) {
    case "r": {
      const text = children(node, "t").map((item) => item.textContent ?? "").join("");
      const plain = child(child(node, "rPr"), "nor") !== undefined;
      if (plain && /[A-Za-z]{2,}/.test(text)) return `\\text{${text.replace(/[{}\\]/g, "")}}`;
      if (functionNames.has(text.trim())) return `\\${text.trim()} `;
      return escapeText(text);
    }
    case "f": {
      const type = childVal(child(node, "fPr"), "type");
      const numerator = arg(node, "num");
      const denominator = arg(node, "den");
      if (type === "lin" || type === "skw") return `${group(numerator)}/${group(denominator)}`;
      if (type === "noBar") return `\\genfrac{}{}{0pt}{}{${numerator}}{${denominator}}`;
      return `\\frac{${numerator}}{${denominator}}`;
    }
    case "sSup":
      return `${group(arg(node, "e"))}^${group(arg(node, "sup"))}`;
    case "sSub":
      return `${group(arg(node, "e"))}_${group(arg(node, "sub"))}`;
    case "sSubSup":
      return `${group(arg(node, "e"))}_${group(arg(node, "sub"))}^${group(arg(node, "sup"))}`;
    case "sPre":
      return `{}_${group(arg(node, "sub"))}^${group(arg(node, "sup"))}${group(arg(node, "e"))}`;
    case "rad": {
      const degree = arg(node, "deg").trim();
      const hidden = ["1", "on", "true"].includes(childVal(child(node, "radPr"), "degHide") ?? "");
      return degree && !hidden ? `\\sqrt[${degree}]{${arg(node, "e")}}` : `\\sqrt{${arg(node, "e")}}`;
    }
    case "d": {
      const properties = child(node, "dPr");
      const open = delimiter(childVal(properties, "begChr"), "(");
      const close = delimiter(childVal(properties, "endChr"), ")");
      const separator = childVal(properties, "sepChr") ?? "|";
      const items = children(node, "e").map(convertChildren);
      return `\\left${open}${items.join(separator === "|" ? "\\mid " : escapeText(separator))}\\right${close}`;
    }
    case "nary": {
      const properties = child(node, "naryPr");
      const operator = symbols[childVal(properties, "chr") ?? "∫"] ?? escapeText(childVal(properties, "chr") ?? "∫");
      const lower = arg(node, "sub").trim();
      const upper = arg(node, "sup").trim();
      return `${operator}${lower ? `_${group(lower)}` : ""}${upper ? `^${group(upper)}` : ""} ${arg(node, "e")}`;
    }
    case "func":
      return `${arg(node, "fName").trim()} ${arg(node, "e")}`;
    case "acc": {
      const character = childVal(child(node, "accPr"), "chr") ?? "̂";
      return `${accents[character] ?? "\\hat"}{${arg(node, "e")}}`;
    }
    case "bar":
      return childVal(child(node, "barPr"), "pos") === "bot" ? `\\underline{${arg(node, "e")}}` : `\\overline{${arg(node, "e")}}`;
    case "groupChr": {
      const position = childVal(child(node, "groupChrPr"), "pos");
      return position === "top" ? `\\overbrace{${arg(node, "e")}}` : `\\underbrace{${arg(node, "e")}}`;
    }
    case "limLow":
      return `${arg(node, "e")}_${group(arg(node, "lim"))}`;
    case "limUpp":
      return `${arg(node, "e")}^${group(arg(node, "lim"))}`;
    case "eqArr":
      return `\\begin{aligned}${children(node, "e").map((item) => convertChildren(item).replace(/&/g, "")).join("\\\\")}\\end{aligned}`;
    case "m":
      return `\\begin{matrix}${children(node, "mr").map((row) => children(row, "e").map(convertChildren).join("&")).join("\\\\")}\\end{matrix}`;
    case "rPr": case "fPr": case "dPr": case "naryPr": case "accPr": case "barPr": case "radPr": case "sSupPr":
    case "sSubPr": case "sSubSupPr": case "funcPr": case "ctrlPr": case "oMathParaPr": case "eqArrPr": case "mPr":
    case "limLowPr": case "limUppPr": case "groupChrPr": case "boxPr": case "borderBoxPr": case "sPrePr":
      return "";
    default:
      // e, num, den, box, borderBox, phant, oMath and Word runs embedded in math all just wrap content.
      return convertChildren(node);
  }
}

export function ommlToLatex(node: XmlNode) {
  return convert(node).replace(/\s+/g, " ").trim();
}

/** Converts `<m:oMath>` (inline) or `<m:oMathPara>` (display) to delimited LaTeX text. */
export function mathToText(node: XmlNode) {
  if (node.localName === "oMathPara") {
    const equations = children(node, "oMath").map(ommlToLatex).filter(Boolean);
    return equations.length ? `$$${equations.join(" \\\\ ")}$$` : "";
  }
  const latex = ommlToLatex(node);
  return latex ? `$${latex}$` : "";
}

export function isMathNode(node: XmlNode) {
  return node.localName === "oMath" || node.localName === "oMathPara";
}
