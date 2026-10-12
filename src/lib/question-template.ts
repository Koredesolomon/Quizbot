import { asksForExplanation, defaultMarks } from "@/lib/question-answers";

// Sample papers offered to admins as upload templates. The on-screen guide, the Word template and the
// Excel template are all generated from `templateSections`, so they always show the same questions.

/** Diagrams in public/question-templates/, with the size they are shown at (CSS pixels). */
export const templateImages = {
  metreRule: { file: "metre-rule.png", width: 400, height: 130, label: "metre rule and pencil" },
  convexLens: { file: "convex-lens.png", width: 160, height: 150, label: "convex lens" },
  concaveLens: { file: "concave-lens.png", width: 160, height: 150, label: "concave lens" },
  micrometer: { file: "micrometer.png", width: 420, height: 170, label: "micrometer screw gauge" },
} as const;

export type TemplateImage = keyof typeof templateImages;
export type TemplateImageData = Record<TemplateImage, Uint8Array>;

type TemplateOption = string | { image: TemplateImage };

type TemplateQuestion = {
  /** "{equation}" marks where the question's Word equation goes. */
  text: string;
  equation?: { omml: string; latex: string };
  image?: TemplateImage;
  options?: TemplateOption[];
  answer: string[];
  marks?: number;
  explanation?: string;
  markingPoints?: string[];
};

type TemplateSection = { heading: string; type: "objective" | "mcq" | "theory"; questions: TemplateQuestion[] };

export const templateTopicHeading = "1.1 Measurement and Units";
export const templateDifficulty = "EASY";

const kineticEnergy = {
  latex: "E_k = \\frac{1}{2}mv^2",
  omml: "<m:oMath><m:sSub><m:e><m:r><m:t>E</m:t></m:r></m:e><m:sub><m:r><m:t>k</m:t></m:r></m:sub></m:sSub><m:r><m:t>=</m:t></m:r>" +
    "<m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f><m:r><m:t>m</m:t></m:r>" +
    "<m:sSup><m:e><m:r><m:t>v</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:oMath>",
};

export const templateSections: TemplateSection[] = [
  {
    heading: "SECTION A: OBJECTIVE",
    type: "objective",
    questions: [
      {
        text: "Which of the following is NOT a fundamental quantity?",
        options: ["Mass", "Temperature", "Volume", "Length"],
        answer: ["C"],
        explanation: "Volume is derived from length.",
      },
      {
        text: "The pencil is placed against the metre rule shown below. What is the length of the pencil?",
        image: "metreRule",
        options: ["4.0 cm", "4.5 cm", "5.0 cm", "5.5 cm"],
        answer: ["B"],
      },
      {
        text: "Which diagram shows a converging (convex) lens?",
        options: [{ image: "convexLens" }, { image: "concaveLens" }],
        answer: ["A"],
      },
      {
        text: "The kinetic energy of a body is {equation}. What is the speed of a 4 kg body with 8 J of kinetic energy?",
        equation: kineticEnergy,
        options: ["1 m/s", "2 m/s", "4 m/s", "8 m/s"],
        answer: ["B"],
      },
      {
        text: "Which of the following measurements is the most precise? Explain your answer.",
        options: ["3 cm", "2.6 cm", "2.67 cm", "2.671 cm"],
        answer: ["D"],
        explanation: "It has the most decimal places, so it is the most detailed reading.",
      },
    ],
  },
  {
    heading: "SECTION B: MCQ",
    type: "mcq",
    questions: [
      { text: "Which of these are SI base units?", options: ["Ampere", "Volt", "Kelvin", "Coulomb"], answer: ["A, C"] },
      {
        text: "Which of these are vector quantities? Give a reason for your answer.",
        options: ["Speed", "Velocity", "Force", "Mass"],
        answer: ["B, C"],
        explanation: "Velocity and force have both magnitude and direction.",
      },
    ],
  },
  {
    heading: "SECTION C: THEORY",
    type: "theory",
    questions: [
      {
        text: "State two uses of dimensional analysis.",
        answer: ["It checks whether an equation is dimensionally consistent.", "It helps derive relationships between physical quantities."],
        marks: 4,
        markingPoints: ["Mentions checking equations.", "Mentions deriving relationships."],
      },
      {
        text: "The micrometer screw gauge below measures the diameter of a wire. What is the reading? Show your working.",
        image: "micrometer",
        answer: ["6.50 mm + 0.43 mm = 6.93 mm"],
        markingPoints: ["Reads the sleeve scale correctly (6.50 mm).", "Adds the thimble reading (0.43 mm) to get 6.93 mm."],
      },
    ],
  },
];

export const templateTips = [
  "Use a heading (SECTION A: OBJECTIVE, SECTION B: MCQ, SECTION C: THEORY) above each group of questions so the type is never guessed.",
  "Number every question, including picture questions, and paste the picture (PNG or JPEG) straight under the question text.",
  "For picture options, put the picture on the option's line: \"A.\" followed by the picture.",
  "Put each option on its own line as A., B., C. … (all on one line also works).",
  "Label every answer with \"Answer:\". MCQ questions list every correct letter: Answer: A, C.",
  "Add \"Explain your answer\" (or \"Give a reason\") to an objective/MCQ question to give students an answer box under the options. Put the model reasoning on an \"Explanation:\" line.",
  "Marks: objective and MCQ questions are worth 1 mark, theory 2, and objective/MCQ with an explanation box 3. Write [4 marks] after a question to change it.",
  "Optional: Explanation: …, marking points as \"1 mark: …\", and EASY / MODERATE / HARD headings.",
  "Use Word's Insert → Equation for formulas (not MathType), and save as .docx.",
];

const letter = (index: number) => String.fromCharCode(65 + index);
const withMarks = (question: TemplateQuestion) => (question.marks ? `${question.text} [${question.marks} marks]` : question.text);

export type TemplateLine =
  | { kind: "topic" | "heading" | "question" | "answer" | "detail"; text: string }
  | { kind: "option"; text: string; image?: TemplateImage }
  | { kind: "picture"; image: TemplateImage };

/** The Word template as lines, numbered exactly as in the file (equations shown as LaTeX). */
export function templateLines(): TemplateLine[] {
  const lines: TemplateLine[] = [
    { text: templateTopicHeading, kind: "topic" },
    { text: templateDifficulty, kind: "heading" },
  ];
  let number = 0;
  for (const section of templateSections) {
    lines.push({ text: section.heading, kind: "heading" });
    for (const question of section.questions) {
      const text = withMarks(question).replace("{equation}", question.equation ? `$${question.equation.latex}$` : "");
      lines.push({ text: `${++number}. ${text}`, kind: "question" });
      if (question.image) lines.push({ kind: "picture", image: question.image });
      question.options?.forEach((option, index) => lines.push(typeof option === "string"
        ? { kind: "option", text: `${letter(index)}. ${option}` }
        : { kind: "option", text: `${letter(index)}.`, image: option.image }));
      question.answer.forEach((answer, index) => lines.push({ text: index === 0 ? `Answer: ${answer}` : answer, kind: "answer" }));
      if (question.explanation) lines.push({ text: `Explanation: ${question.explanation}`, kind: "detail" });
      question.markingPoints?.forEach((point) => lines.push({ text: `1 mark: ${point}`, kind: "detail" }));
    }
  }
  return lines;
}

/** Fetches the template diagrams from the app's public folder. */
export async function loadTemplateImages(): Promise<TemplateImageData> {
  const entries = await Promise.all((Object.keys(templateImages) as TemplateImage[]).map(async (key) => {
    const response = await fetch(`/question-templates/${templateImages[key].file}`);
    if (!response.ok) throw new Error(`Template picture ${templateImages[key].file} could not be loaded.`);
    return [key, new Uint8Array(await response.arrayBuffer())] as const;
  }));
  return Object.fromEntries(entries) as TemplateImageData;
}

const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const emu = (pixels: number) => Math.round(pixels * 9525);
const relationshipsXml = (items: string) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items}</Relationships>`;
const imageRelationship = (id: string, target: string) =>
  `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${target}"/>`;

function run(text: string, { bold = false, italic = false, size = 24, color = "" } = {}) {
  const properties = `${bold ? "<w:b/>" : ""}${italic ? "<w:i/>" : ""}${color ? `<w:color w:val="${color}"/>` : ""}<w:sz w:val="${size}"/>`;
  return `<w:r><w:rPr>${properties}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

function paragraph(content: string, spaceBefore = 0) {
  return `<w:p><w:pPr><w:spacing w:before="${spaceBefore}" w:after="80"/></w:pPr>${content}</w:p>`;
}

/** Builds the Word (.docx) upload template, with real pictures and a Word equation. */
export async function buildWordTemplate(subject: string, images: TemplateImageData) {
  const { default: Zip } = await import("jszip");
  const zip = new Zip();
  const rels: string[] = [];
  const pictureIds = new Map<TemplateImage, string>();
  let drawingId = 0;

  const picture = (image: TemplateImage, scale = 1) => {
    if (!pictureIds.has(image)) {
      const id = `rIdImage${pictureIds.size + 1}`;
      pictureIds.set(image, id);
      rels.push(imageRelationship(id, `media/${templateImages[image].file}`));
      zip.file(`word/media/${templateImages[image].file}`, images[image]);
    }
    const { width, height, label } = templateImages[image];
    const cx = emu(width * scale), cy = emu(height * scale);
    drawingId++;
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/>` +
      `<wp:docPr id="${drawingId}" name="Picture ${drawingId}" descr="${escapeXml(label)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
      `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>` +
      `<pic:nvPicPr><pic:cNvPr id="${drawingId}" name="${templateImages[image].file}"/><pic:cNvPicPr/></pic:nvPicPr>` +
      `<pic:blipFill><a:blip r:embed="${pictureIds.get(image)}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
      `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
      `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  };

  const note = (text: string) => paragraph(run(text, { italic: true, color: "5E7086", size: 20 }));
  const body: string[] = [
    paragraph(run(`${subject} question paper`, { bold: true, size: 32 })),
    paragraph(run("How to use this template — these instructions are ignored when you upload:", { italic: true, color: "5E7086" }), 120),
    ...templateTips.map((tip) => note(`• ${tip}`)),
    note("Replace the sample questions below with your own."),
    paragraph(run(templateTopicHeading, { bold: true, size: 28 }), 360),
    paragraph(run(templateDifficulty, { bold: true, size: 26, color: "06479B" }), 240),
  ];

  let number = 0;
  for (const section of templateSections) {
    body.push(paragraph(run(section.heading, { bold: true, size: 26, color: "06479B" }), 240));
    for (const question of section.questions) {
      const [before, after = ""] = withMarks(question).split("{equation}");
      body.push(paragraph(
        run(`${++number}. ${before}`, { bold: true }) + (question.equation ? question.equation.omml + run(after, { bold: true }) : ""),
        200
      ));
      if (question.image) body.push(paragraph(picture(question.image)));
      question.options?.forEach((option, index) => body.push(paragraph(typeof option === "string"
        ? run(`${letter(index)}. ${option}`)
        : run(`${letter(index)}. `) + picture(option.image, 0.7))));
      question.answer.forEach((answer, index) => body.push(paragraph(run(index === 0 ? `Answer: ${answer}` : answer, { color: "087C22" }))));
      if (question.explanation) body.push(paragraph(run(`Explanation: ${question.explanation}`)));
      question.markingPoints?.forEach((point) => body.push(paragraph(run(`1 mark: ${point}`))));
    }
  }

  const namespaces = [
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"',
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
    'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"',
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"',
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"',
  ].join(" ");
  zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file("_rels/.rels", relationshipsXml('<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'));
  zip.file("word/_rels/document.xml.rels", relationshipsXml(rels.join("")));
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${namespaces}><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`);
  return zip.generateAsync({ type: "arraybuffer" });
}

/** Builds the Excel (.xlsx) upload template: the same questions, one per row, with pictures in their cells. */
export async function buildExcelTemplate(subject: string, images: TemplateImageData, topic = "Measurement and Units") {
  const XLSX = await import("xlsx");
  const { default: Zip } = await import("jszip");
  const header = ["type", "subject", "topic", "question", "picture", "optionA", "optionB", "optionC", "optionD", "answer", "explanation", "marks", "difficulty", "answerBox", "rubricPoints"];
  const pictureColumn = header.indexOf("picture");
  const firstOptionColumn = header.indexOf("optionA");
  const rows: (string | number)[][] = [header];
  const placements: Array<{ row: number; col: number; image: TemplateImage; scale: number }> = [];
  const rowHeights: Array<{ hpt?: number }> = [{}];

  for (const section of templateSections) {
    for (const question of section.questions) {
      const row = rows.length;
      const options = (question.options ?? []).map((option, index) => {
        if (typeof option === "string") return option;
        placements.push({ row, col: firstOptionColumn + index, image: option.image, scale: 0.7 });
        return "";
      });
      if (question.image) placements.push({ row, col: pictureColumn, image: question.image, scale: 0.9 });
      const tallest = Math.max(0, ...placements.filter((placement) => placement.row === row)
        .map((placement) => templateImages[placement.image].height * placement.scale));
      rowHeights.push(tallest ? { hpt: Math.ceil((tallest + 10) * 0.75) } : {});
      rows.push([
        section.type, subject, topic, question.text.replace("{equation}", question.equation ? `$${question.equation.latex}$` : ""), "",
        ...[0, 1, 2, 3].map((index) => options[index] ?? ""),
        question.answer.join("\n"), question.explanation ?? "",
        question.marks ?? defaultMarks(section.type === "mcq" ? "multiple" : section.type, asksForExplanation.test(question.text)), templateDifficulty.toLowerCase(),
        asksForExplanation.test(question.text) && section.type !== "theory" ? "yes" : "", (question.markingPoints ?? []).join("; "),
      ]);
    }
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = header.map((name) => ({ wch: name === "question" ? 60 : name === "picture" ? 60 : name.startsWith("option") ? 18 : name === "explanation" || name === "rubricPoints" || name === "answer" ? 34 : 11 }));
  sheet["!rows"] = rowHeights;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Questions");
  const zip = await Zip.loadAsync(XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer);

  // Add the pictures as a drawing anchored to their cells.
  const used = Array.from(new Set(placements.map((placement) => placement.image)));
  used.forEach((image) => zip.file(`xl/media/${templateImages[image].file}`, images[image]));
  const anchors = placements.map((placement, index) => {
    const { width, height, label } = templateImages[placement.image];
    const cx = emu(width * placement.scale), cy = emu(height * placement.scale);
    const relId = `rIdImage${used.indexOf(placement.image) + 1}`;
    return `<xdr:oneCellAnchor><xdr:from><xdr:col>${placement.col}</xdr:col><xdr:colOff>${emu(4)}</xdr:colOff><xdr:row>${placement.row}</xdr:row><xdr:rowOff>${emu(4)}</xdr:rowOff></xdr:from>` +
      `<xdr:ext cx="${cx}" cy="${cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${index + 2}" name="Picture ${index + 1}" descr="${escapeXml(label)}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>` +
      `<xdr:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>` +
      `<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`;
  }).join("");
  zip.file("xl/drawings/drawing1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${anchors}</xdr:wsDr>`);
  zip.file("xl/drawings/_rels/drawing1.xml.rels", relationshipsXml(used.map((image, index) => imageRelationship(`rIdImage${index + 1}`, `../media/${templateImages[image].file}`)).join("")));
  zip.file("xl/worksheets/_rels/sheet1.xml.rels", relationshipsXml('<Relationship Id="rIdDrawing1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>'));

  const sheetXml = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
  const withNamespace = sheetXml.includes('xmlns:r="') ? sheetXml
    : sheetXml.replace("<worksheet ", '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ');
  zip.file("xl/worksheets/sheet1.xml", withNamespace.replace("</worksheet>", '<drawing r:id="rIdDrawing1"/></worksheet>'));
  const types = await zip.file("[Content_Types].xml")!.async("string");
  // Declare each part type once: Excel rejects duplicate declarations as a corrupt file.
  zip.file("[Content_Types].xml", (/Extension="png"/i.test(types) ? types : types.replace("<Default ", '<Default Extension="png" ContentType="image/png"/><Default '))
    .replace("</Types>", '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>'));
  return zip.generateAsync({ type: "arraybuffer" });
}

export function downloadFile(data: BlobPart, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
