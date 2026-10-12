import type JSZip from "jszip";
import { parseQuestionType } from "@/lib/question-answers";
import { isMathNode, mathToText } from "./omml";
import { emptyRawQuestion, type ImportCell, type RawQuestion } from "./raw";
import { looksLikeQuestionTable, rowsToRawQuestions } from "./rows";
import { attr, child, children, childVal, descendants, type XmlNode } from "./xml";
import { readRelationships, readZipImage, readZipXml } from "./zip";

type ListMarker = { kind: "number" | "letter" | "bullet"; value: number; level: number; listId: string };

/** One visual line of the document: paragraph text split on manual line breaks. */
type Line = { text: string; images: string[]; problems: string[]; list?: ListMarker };

type Context = {
  zip: JSZip;
  rels: Map<string, string>;
  numbering: Numbering;
  tableQuestions: RawQuestion[];
  tableCount: number;
};

// ---------- Word list numbering ----------

type Level = { format: string; start: number };

class Numbering {
  private abstract = new Map<string, Map<number, Level>>();
  private nums = new Map<string, { abstractId: string; starts: Map<number, number> }>();
  private styleNumbering = new Map<string, { numId?: string; ilvl?: number; basedOn?: string }>();
  private counters = new Map<string, number[]>();

  constructor(numbering: XmlNode | undefined, styles: XmlNode | undefined) {
    for (const abstract of children(numbering, "abstractNum")) {
      const levels = new Map<number, Level>();
      for (const level of children(abstract, "lvl")) {
        levels.set(Number(attr(level, "ilvl") ?? 0), {
          format: childVal(level, "numFmt") ?? "decimal",
          start: Number(childVal(level, "start") ?? 1),
        });
      }
      this.abstract.set(attr(abstract, "abstractNumId") ?? "", levels);
    }
    for (const num of children(numbering, "num")) {
      const starts = new Map<number, number>();
      for (const override of children(num, "lvlOverride")) {
        const start = childVal(override, "startOverride");
        if (start) starts.set(Number(attr(override, "ilvl") ?? 0), Number(start));
      }
      this.nums.set(attr(num, "numId") ?? "", { abstractId: childVal(num, "abstractNumId") ?? "", starts });
    }
    for (const style of children(styles, "style")) {
      const numPr = child(child(style, "pPr"), "numPr");
      this.styleNumbering.set(attr(style, "styleId") ?? "", {
        numId: childVal(numPr, "numId"),
        ilvl: childVal(numPr, "ilvl") ? Number(childVal(numPr, "ilvl")) : undefined,
        basedOn: childVal(style, "basedOn"),
      });
    }
  }

  private fromStyle(styleId: string | undefined, depth = 0): { numId?: string; ilvl?: number } {
    const style = styleId ? this.styleNumbering.get(styleId) : undefined;
    if (!style || depth > 10) return {};
    if (style.numId) return style;
    return this.fromStyle(style.basedOn, depth + 1);
  }

  marker(paragraphProperties: XmlNode | undefined): ListMarker | undefined {
    const numPr = child(paragraphProperties, "numPr");
    const styled = this.fromStyle(childVal(paragraphProperties, "pStyle"));
    const numId = childVal(numPr, "numId") ?? styled.numId;
    const ilvl = Number(childVal(numPr, "ilvl") ?? styled.ilvl ?? 0);
    if (!numId || numId === "0") return undefined;
    const num = this.nums.get(numId);
    const level = num ? this.abstract.get(num.abstractId)?.get(ilvl) : undefined;
    const format = level?.format ?? "decimal";
    const start = num?.starts.get(ilvl) ?? level?.start ?? 1;

    const counters = this.counters.get(numId) ?? [];
    counters[ilvl] = counters[ilvl] === undefined ? start : counters[ilvl] + 1;
    counters.length = ilvl + 1; // a higher-level item restarts deeper levels
    this.counters.set(numId, counters);

    const kind = /letter/i.test(format) ? "letter" : format === "bullet" || format === "none" ? "bullet" : "number";
    return { kind, value: counters[ilvl], level: ilvl, listId: numId };
  }
}

// ---------- Paragraph content ----------

const IMAGE = "\u0001"; // placeholder marking where each picture sits inside the text

async function runContent(node: XmlNode, context: Context, out: { text: string; images: string[]; problems: string[] }) {
  const addImage = async (relationId: string | undefined) => {
    const path = relationId ? context.rels.get(relationId) : undefined;
    if (!path) return;
    const image = await readZipImage(context.zip, path);
    if (image.ok) {
      out.text += `${IMAGE}${out.images.length}${IMAGE}`;
      out.images.push(image.dataUrl);
    } else out.problems.push(image.reason);
  };

  for (const item of children(node)) {
    switch (item.localName) {
      case "t": out.text += item.textContent ?? ""; break;
      case "tab": out.text += " "; break;
      case "br": case "cr": out.text += "\n"; break;
      case "noBreakHyphen": out.text += "-"; break;
      case "drawing":
        for (const blip of descendants(item, "blip")) await addImage(attr(blip, "embed") ?? attr(blip, "link"));
        break;
      case "pict":
        for (const image of descendants(item, "imagedata")) await addImage(attr(image, "id"));
        break;
      case "object":
        out.problems.push(
          "An equation or object inserted with MathType (or another add-in) cannot be read. " +
          "Recreate it with Word's Insert → Equation, or paste it as a picture."
        );
        break;
      case "rPr": case "delText": case "instrText": case "fldChar": case "lastRenderedPageBreak": break;
      default: await runContent(item, context, out);
    }
  }
}

async function paragraphContent(paragraph: XmlNode, context: Context) {
  const out = { text: "", images: [] as string[], problems: [] as string[] };
  const visit = async (node: XmlNode) => {
    for (const item of children(node)) {
      if (isMathNode(item)) { out.text += mathToText(item); continue; }
      switch (item.localName) {
        case "r": {
          const before = out.text.length;
          await runContent(item, context, out);
          const vertical = childVal(child(item, "rPr"), "vertAlign");
          const added = out.text.slice(before);
          if ((vertical === "superscript" || vertical === "subscript") && added.trim() && !added.includes(IMAGE)) {
            out.text = out.text.slice(0, before) + `$${vertical === "superscript" ? "^" : "_"}{${added.trim()}}$`;
          }
          break;
        }
        case "pPr": case "del": case "moveFrom": case "bookmarkStart": case "bookmarkEnd": case "proofErr": break;
        default: await visit(item); // hyperlink, ins, smartTag, sdt, fldSimple, customXml ...
      }
    }
  };
  await visit(paragraph);
  return out;
}

function splitLines(content: { text: string; images: string[]; problems: string[] }, list?: ListMarker): Line[] {
  const lines = content.text.split("\n");
  return lines.map((text, index) => {
    const images: string[] = [];
    const clean = text.replace(new RegExp(`${IMAGE}(\\d+)${IMAGE}`, "g"), (_, imageIndex: string) => {
      images.push(content.images[Number(imageIndex)]);
      return "";
    });
    return {
      text: clean.replace(/[  ]+/g, " ").trim(),
      images,
      problems: index === 0 ? content.problems : [],
      list: index === 0 ? list : undefined,
    };
  });
}

async function cellContent(cell: XmlNode, context: Context): Promise<ImportCell> {
  const parts: ImportCell[] = [];
  for (const paragraph of descendants(cell, "p")) {
    const content = await paragraphContent(paragraph, context);
    parts.push({ text: content.text.replace(new RegExp(`${IMAGE}\\d+${IMAGE}`, "g"), "").trim(), images: content.images });
  }
  return { text: parts.map((part) => part.text).filter(Boolean).join("\n"), images: parts.flatMap((part) => part.images) };
}

async function bodyLines(container: XmlNode, context: Context, lines: Line[]) {
  for (const node of children(container)) {
    if (node.localName === "p") {
      const list = context.numbering.marker(child(node, "pPr"));
      lines.push(...splitLines(await paragraphContent(node, context), list));
    } else if (node.localName === "tbl") {
      const rows: ImportCell[][] = [];
      for (const row of children(node, "tr")) {
        const cells: ImportCell[] = [];
        for (const cell of children(row, "tc")) cells.push(await cellContent(cell, context));
        rows.push(cells);
      }
      context.tableCount++;
      if (looksLikeQuestionTable(rows)) {
        const table = context.tableCount;
        context.tableQuestions.push(...rowsToRawQuestions(rows, (index) => `Table ${table}, row ${index + 1}`));
      } else {
        // Layout tables (options in a grid, answer keys): read row by row.
        for (const row of rows) {
          const joined = row.map((cell) => cell.text).filter(Boolean).join(" ");
          const images = row.flatMap((cell) => cell.images);
          if (/^\s*\d{1,3}\s*$/.test(row[0]?.text ?? "") && row.length === 2) {
            lines.push({ text: `${row[0].text.trim()}. ${row[1].text}`, images, problems: [] }); // "1 | B" answer-key rows
          } else if (row.every((cell) => /^\s*\(?[A-H][.)]/i.test(cell.text) || !cell.text.trim())) {
            for (const cell of row) if (cell.text.trim() || cell.images.length) lines.push({ text: cell.text, images: cell.images, problems: [] });
          } else if (joined || images.length) {
            lines.push({ text: joined, images, problems: [] });
          }
        }
      }
    } else if (node.localName === "sdt") {
      await bodyLines(child(node, "sdtContent") ?? node, context, lines);
    } else if (node.localName === "customXml" || node.localName === "ins") {
      await bodyLines(node, context, lines);
    }
  }
}

// ---------- Turning lines into questions ----------

// "1.2 Derived quantities" is a section heading, not question 1.
const questionPattern = /^(?:Q(?:uestion|ue|n)?\s*\.?\s*)?(\d{1,3})(?!\.\d)\s*[.):\-–]\s*(.*)$/i;
const questionWordPattern = /^Q(?:uestion)?\s*(\d{1,3})\s*[.):\-–]?\s*(.*)$/i;
const optionPattern = /^\(?([A-H])\s*[.):]\s*(.*)$/;
const lowerOptionPattern = /^\(?([a-h])\s*[.)]\s*(.*)$/;
const fieldPatterns: Array<[keyof RawQuestion | "answerKey", RegExp]> = [
  ["answer", /^(?:correct\s+)?(?:answers?|ans|key|correct\s+options?)\s*[:.\-–=]\s*(.*)$/i],
  ["answer", /^(?:model\s+answer|solution)\s*[:\-–=]\s*(.*)$/i],
  ["explanation", /^(?:explanation|reason|rationale|feedback|working|hint)\s*[:\-–]\s*(.*)$/i],
  ["declaredType", /^(?:question\s+)?type\s*[:\-–]\s*(.*)$/i],
  ["marks", /^(?:marks?|points?|score)\s*[:\-–]\s*(.*)$/i],
  ["topic", /^topic\s*[:\-–]\s*(.*)$/i],
  ["subject", /^subject\s*[:\-–]\s*(.*)$/i],
  ["difficulty", /^difficulty\s*[:\-–]\s*(.*)$/i],
  ["keywords", /^keywords?\s*[:\-–]\s*(.*)$/i],
  ["rubricPoints", /^rubric(?:\s+points?)?\s*[:\-–]\s*(.*)$/i],
  ["commonMistakes", /^common\s+mistakes?\s*[:\-–]\s*(.*)$/i],
  ["learningObjective", /^learning\s+objective\s*[:\-–]\s*(.*)$/i],
];
const answerKeyHeading = /^(?:answer\s*key|answers|marking\s+(?:scheme|guide)|solutions?|key)\s*:?\s*$/i;

function sectionType(text: string) {
  if (text.length > 80 || /[?]$/.test(text)) return undefined;
  const words = text
    .replace(/^(?:section|part)\s+[A-Z0-9]+\s*[:.\-–]?\s*/i, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\b(?:questions?|section|instructions?)\b/gi, "")
    .replace(/[:.\-–]/g, " ")
    .trim();
  return words.split(/\s+/).length <= 4 ? parseQuestionType(words) : undefined;
}

const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const difficultyHeading = /^(easy|simple|moderate|medium|intermediate|hard|difficult|challenging)\s*:?$/i;
const topicHeading = /^topic\s*\d*\s*[:.\-–]\s*(.+)$/i;
const numberedHeading = /^\d+\.\d+(?:\.\d+)*\s+([A-Z][^=+]*)$/;
const markingPoint = /^(?:[✅✔☑✓]\s*|\(?\d+\s*marks?\)?\s*[:\-–]\s*)(.+)$/i;
const inlineAnswer = /\s(?:correct\s+)?(?:answers?|ans)\s*[:\-–=]\s*/i;
// Text after a "?" that still belongs to the question rather than being its answer.
const questionContinuation = /^(?:[[(]|explain|give|show|state|justify|describe|discuss|list|name|calculate|determine|find|hence|why|how|what|which|who|where|when|use|identify|mention|write|draw|define|compare|suggest|comment|select|choose|tick|circle|is|are|do|does|can)\b/i;
const questionLike = /\?|^(?:what|which|who|why|how|where|when|explain|discuss|describe|state|list|name|calculate|determine|find|define|identify|mention|give|write|draw|compare|estimate|measure|read|use)\b/i;

type Marker = { index: number; start: number; end: number; punctuated: boolean };

/**
 * Finds a run of options inside one line: "A. 7Kg B.70Kg", "A current B gram C kelvin", "(a) x (b) y" or
 * "I. 3 cm II. 2.6 cm". Unpunctuated letters need at least three in sequence to avoid reading "A ball ..." as an option.
 */
export function splitInlineOptions(text: string, firstIndex = 0) {
  const patterns: Array<{ roman: boolean; pattern: RegExp; label: (value: string) => number }> = [
    { roman: false, pattern: /(^|[\s?:])\(?([A-H])(?:\s*([.)])\s*|\s+(?=\S))/g, label: (value) => value.charCodeAt(0) - 65 },
    { roman: false, pattern: /(^|[\s?:])\(([a-h])(\))\s*/g, label: (value) => value.charCodeAt(0) - 97 },
    { roman: true, pattern: /(^|[\s?:])\(?(VIII|VII|VI|IV|V|III|II|I)\s*([.)])\s*/g, label: (value) => romanNumerals.indexOf(value) },
  ];
  let best: { chain: Marker[]; roman: boolean } | undefined;
  for (const { roman, pattern, label } of patterns) {
    const candidates: Marker[] = Array.from(text.matchAll(pattern), (match) => ({
      index: label(match[2]),
      start: (match.index ?? 0) + match[1].length,
      end: (match.index ?? 0) + match[0].length,
      punctuated: Boolean(match[3]),
    }));
    for (const first of candidates.filter((candidate) => candidate.index === firstIndex)) {
      const chain = [first];
      for (const candidate of candidates) {
        const last = chain[chain.length - 1];
        if (candidate.start >= last.end && candidate.index === last.index + 1) chain.push(candidate);
      }
      const valid = chain.length >= 3 || (chain.length === 2 && chain.every((marker) => marker.punctuated));
      if (valid && (!best || chain.length > best.chain.length)) best = { chain, roman };
    }
  }
  if (!best) return undefined;
  const { chain, roman } = best;
  return {
    before: text.slice(0, chain[0].start).trim(),
    options: chain.map((marker, position) =>
      text.slice(marker.end, position + 1 < chain.length ? chain[position + 1].start : text.length).trim().replace(/[,;]$/, "").trim()),
    roman,
  };
}

/** Splits one question line into prompt, inline options and an inline answer. */
function parseQuestionText(text: string) {
  let prompt = text;
  let answer: string | undefined;
  const labelled = text.match(inlineAnswer);
  if (labelled && labelled.index) {
    prompt = text.slice(0, labelled.index).trim();
    answer = text.slice(labelled.index + labelled[0].length).trim();
  }
  const inline = splitInlineOptions(prompt);
  if (inline) return { prompt: inline.before, options: inline.options, roman: inline.roman, answer };
  if (answer === undefined) {
    // "List three basic quantities? Mass, Length, Time": the answer written straight after the question.
    const mark = prompt.lastIndexOf("?");
    const rest = mark >= 0 ? prompt.slice(mark + 1).trim() : "";
    if (rest && !questionContinuation.test(rest)) {
      answer = rest;
      prompt = prompt.slice(0, mark + 1).trim();
    }
  }
  return { prompt, options: [] as string[], roman: false, answer };
}

function headingTopic(value: string) {
  return value.replace(/\bquestions?\s*$/i, "").replace(/\s+/g, " ").trim();
}

function extractInlineMarks(question: RawQuestion) {
  const match = question.prompt.match(/[[(]\s*(\d{1,3})\s*(?:marks?|mks?|pts?|points?)\s*[\])]\s*$/i);
  if (!match) return;
  question.marks ??= match[1];
  question.prompt = question.prompt.slice(0, match.index).trim();
}

function linesToQuestions(lines: Line[]): RawQuestion[] {
  const questions: RawQuestion[] = [];
  let current: RawQuestion | undefined;
  let field: string = "prompt"; // "prompt", "option" or the RawQuestion field being written
  let section: string | undefined;
  let difficulty: string | undefined;
  let topic: string | undefined;
  let inAnswerKey = false;
  let questionListId: string | undefined;
  let pendingImages: string[] = []; // a picture placed above the unnumbered question it belongs to

  const finish = () => {
    if (current) {
      extractInlineMarks(current);
      // Numbering often restarts in each section, so name the question by its text too.
      const snippet = current.prompt.replace(/\s+/g, " ").trim();
      if (snippet) current.location = `${current.location} ("${snippet.length > 60 ? `${snippet.slice(0, 57)}…` : snippet}")`;
      else if (current.promptImages.length) current.location = `${current.location} (picture question)`;
      questions.push(current);
    }
    current = undefined;
  };
  const start = (number: number, text: string, line: Line) => {
    finish();
    current = emptyRawQuestion(`Question ${number}`);
    current.number = number;
    current.sectionType = section;
    current.difficulty = difficulty;
    current.topic = topic;
    current.promptImages.push(...pendingImages, ...line.images);
    current.warnings.push(...line.problems);
    pendingImages = [];
    const parsed = parseQuestionText(text);
    current.prompt = parsed.prompt;
    current.options = parsed.options.map((option) => ({ text: option, images: [] }));
    current.romanOptions = parsed.roman;
    field = parsed.options.length ? "option" : "prompt";
    if (parsed.answer !== undefined) { current.answer = parsed.answer; field = "answer"; }
  };
  const addOption = (text: string, line: Line) => {
    current!.options.push({ text, images: line.images });
    current!.warnings.push(...line.problems);
    field = "option";
  };
  const append = (target: string | undefined, text: string) => (target ? `${target}\n${text}` : text);
  const nextTextLine = (from: number) => lines.slice(from + 1).find((line) => line.text);
  const isAnswerLine = (text: string | undefined) => /^(?:correct\s+)?(?:answers?|ans)\s*[:.\-–=]/i.test(text ?? "");

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const text = line.text;
    if (!text && !line.images.length) {
      if (line.problems.length && current) current.warnings.push(...line.problems);
      continue;
    }

    if (answerKeyHeading.test(text)) { finish(); inAnswerKey = true; continue; }
    if (inAnswerKey) { applyAnswerKey(text, questions); continue; }

    if (!line.list && difficultyHeading.test(text)) {
      finish();
      const level = text.toLowerCase();
      difficulty = /easy|simple/.test(level) ? "easy" : /hard|difficult|challenging/.test(level) ? "hard" : "medium";
      continue;
    }
    const topicMatch = !line.list ? text.match(topicHeading) ?? text.match(numberedHeading) : null;
    if (topicMatch && topicMatch[1].split(/\s+/).filter((word) => /[A-Za-z]{3,}/.test(word)).length >= 1 && !/[?]/.test(text)) {
      finish();
      topic = headingTopic(topicMatch[1]);
      continue;
    }

    const heading = !line.list && !questionPattern.test(text) ? sectionType(text) : undefined;
    if (heading) { finish(); section = heading; continue; }

    // A picture on its own line: decide whether it belongs to the current question or starts the next one.
    if (!text) {
      const last = current?.options[current.options.length - 1];
      if (field === "option" && last && !last.text && !last.images.length) { last.images.push(...line.images); continue; }
      const next = nextTextLine(lineIndex);
      const nextIsOptions = next ? splitInlineOptions(next.text, current?.options.length ?? 0)?.before === "" : false;
      const nextStartsQuestion = Boolean(next) && !next!.list && !nextIsOptions && questionLike.test(next!.text) &&
        !fieldPatterns.some(([, pattern]) => pattern.test(next!.text));
      const answered = Boolean(current?.answer || current?.rubricPoints) || (current?.options.length ?? 0) > 0;
      const startsNext = !current || (isAnswerLine(next?.text) ? answered : nextStartsQuestion && (answered || current.prompt.includes("?")));
      if (startsNext) {
        finish();
        pendingImages.push(...line.images);
        continue;
      }
      if (current && field === "option") current.promptImages.push(...line.images);
      else if (current && field === "explanation") current.explanation = append(current.explanation, line.images.map((src) => `![](${src})`).join("\n"));
      else if (current) current.promptImages.push(...line.images);
      continue;
    }

    const fieldMatch = (current || pendingImages.length) && fieldPatterns.find(([, pattern]) => pattern.test(text));
    if (fieldMatch) {
      const [name, pattern] = fieldMatch;
      const value = text.match(pattern)?.[1]?.trim() ?? "";
      // "Answer: A" under a picture: the picture is the whole question.
      if (name === "answer" && (pendingImages.length || (line.images.length && current?.answer))) {
        start((current?.number ?? questions[questions.length - 1]?.number ?? 0) + 1, "", line);
      } else if (current && line.images.length) {
        if (name === "explanation") current.explanation = append(current.explanation, line.images.map((src) => `![](${src})`).join("\n"));
        else current.promptImages.push(...line.images);
      }
      if (!current) continue;
      field = name as keyof RawQuestion;
      (current as Record<string, unknown>)[name] = value;
      continue;
    }

    const capturingText = field !== "prompt" && field !== "option";
    const expectedNumber = (current?.number ?? questions[questions.length - 1]?.number ?? 0) + 1;

    // Word auto-numbered list item at the question level. A different numbered list inside a
    // model answer or explanation is part of that text, not a new question.
    if (line.list?.kind === "number" && line.list.level === 0 && (!capturingText || line.list.listId === questionListId)) {
      questionListId = line.list.listId;
      start(line.list.value > (current?.number ?? 0) ? line.list.value : expectedNumber, text, line);
      continue;
    }

    const typed = text.match(questionWordPattern) ?? text.match(questionPattern);
    if (typed && !line.list) {
      const number = Number(typed[1]);
      const looksLikeQuestion = /\?|\b(?:answers?|ans)\s*[:\-–]/i.test(typed[2]);
      if (number === expectedNumber || !current || (!capturingText && number > current.number!) || looksLikeQuestion) {
        start(number, typed[2].trim(), line);
        continue;
      }
    }

    if (pendingImages.length) { start(expectedNumber, text, line); continue; }
    if (!current) continue; // instructions before the first question

    // An unnumbered question straight after a question that already has its answer or marking points.
    if (field === "prompt" && (current.answer || current.rubricPoints) && !line.list && questionLike.test(text)) {
      start(expectedNumber, text, line);
      continue;
    }

    const canTakeOptions = field === "prompt" || field === "option";
    if (canTakeOptions && (line.list?.kind === "letter" || (line.list && line.list.level > 0) || (line.list?.kind === "bullet" && current.prompt))) {
      addOption(text.replace(/^\(?[A-H]\s*[.)]\s+/i, ""), line);
      continue;
    }
    if (canTakeOptions) {
      const split = splitInlineOptions(text, current.options.length);
      if (split && !split.before) {
        current.romanOptions ||= split.roman;
        split.options.forEach((option, index) => addOption(option, index === split.options.length - 1 ? line : { ...line, images: [], problems: [] }));
        continue;
      }
      const option = text.match(optionPattern) ?? text.match(lowerOptionPattern);
      if (option && option[1].toUpperCase().charCodeAt(0) - 65 === current.options.length) {
        addOption(option[2].trim(), line);
        continue;
      }
    }

    // "IV. 2.671 cm is the most precise because ...": an unlabelled answer naming one of the options.
    const label = text.match(/^\(?(VIII|VII|VI|IV|V|III|II|I|[A-H])\s*[.)]\s+\S/);
    if (field === "option" && label && !current.answer) {
      const index = current.romanOptions ? romanNumerals.indexOf(label[1]) : label[1].charCodeAt(0) - 65;
      if (index >= 0 && index < current.options.length - (current.romanOptions ? 0 : 1)) {
        current.answer = text;
        field = "answer";
        continue;
      }
    }

    // Marking-scheme lines ("1 mark: ...", "✅ ...") become rubric points.
    const point = text.match(markingPoint);
    if (point) {
      current.rubricPoints = `${current.rubricPoints ?? ""}${point[1].trim()}\n`;
      continue;
    }
    if (/^this\s+answer\s*:?$/i.test(text)) continue;

    // Plain text after a finished question with no options is its (unlabelled) model answer.
    if (field === "prompt" && !current.options.length && current.prompt.includes("?") && !current.answer) {
      current.answer = text;
      current.promptImages.push(...line.images);
      field = "answer";
      continue;
    }

    // Continuation of whatever was last being written.
    current.warnings.push(...line.problems);
    if (field === "option") {
      const last = current.options[current.options.length - 1];
      last.text = last.text ? `${last.text} ${text}`.trim() : text;
      last.images.push(...line.images);
      continue;
    }
    if (field === "prompt") {
      current.prompt = append(current.prompt, text);
      current.promptImages.push(...line.images);
      continue;
    }
    const value = (current as Record<string, unknown>)[field];
    (current as Record<string, unknown>)[field] = append(typeof value === "string" ? value : undefined, text);
    if (line.images.length) current.promptImages.push(...line.images);
  }
  finish();
  return questions;
}

function applyAnswerKey(text: string, questions: RawQuestion[]) {
  const byNumber = new Map(questions.map((question) => [question.number, question]));
  const theory = text.match(/^(\d{1,3})\s*[.):\-–]\s*(.+)$/);
  const theoryQuestion = theory ? byNumber.get(Number(theory[1])) : undefined;
  if (theoryQuestion && !theoryQuestion.options.length) {
    theoryQuestion.answer ||= theory![2].trim();
    return;
  }
  for (const match of text.matchAll(/(\d{1,3})\s*[.):\-–]?\s*([A-H](?:\s*(?:,|&|and|\s)\s*[A-H])*)(?![A-Za-z])/g)) {
    const question = byNumber.get(Number(match[1]));
    if (question && !question.answer) question.answer = match[2].replace(/\s*(?:&|and)\s*/gi, ", ").replace(/\s+/g, " ").trim();
  }
}

export async function readDocxQuestions(zip: JSZip) {
  const documentPath = "word/document.xml";
  const document = await readZipXml(zip, documentPath);
  const body = child(document, "body");
  if (!body) throw new Error("This Word document has no readable content.");

  const context: Context = {
    zip,
    rels: await readRelationships(zip, documentPath),
    numbering: new Numbering(await readZipXml(zip, "word/numbering.xml"), await readZipXml(zip, "word/styles.xml")),
    tableQuestions: [],
    tableCount: 0,
  };
  const lines: Line[] = [];
  await bodyLines(body, context, lines);
  return [...context.tableQuestions, ...linesToQuestions(lines)];
}
