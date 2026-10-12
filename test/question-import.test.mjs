import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire, Module } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const JSZip = require('jszip');
const XLSX = require('xlsx');
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cache = new Map();

// Run the real TypeScript import pipeline, resolving the project's "@/..." alias.
function loadSource(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.require = (name) => {
    if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
    const base = name.startsWith('@/') ? resolve(projectRoot, 'src', name.slice(2)) : resolve(dirname(filename), name);
    return loadSource(existsSync(`${base}.ts`) ? `${base}.ts` : `${base}.tsx`);
  };
  cache.set(filename, loaded);
  loaded._compile(compiled, filename);
  return loaded.exports;
}

const { parseQuestionImportFile } = loadSource(resolve(projectRoot, 'src/lib/question-import.ts'));
const answers = loadSource(resolve(projectRoot, 'src/lib/question-answers.ts'));
const template = loadSource(resolve(projectRoot, 'src/lib/question-template.ts'));

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';

const esc = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const run = (text) => `<w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
const picture = (rid) => `<w:r><w:drawing><wp:inline><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="${rid}"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
const para = (content, numbering) => `<w:p>${numbering ? `<w:pPr><w:numPr><w:ilvl w:val="${numbering.level}"/><w:numId w:val="${numbering.id}"/></w:numPr></w:pPr>` : ''}${content}</w:p>`;
const p = (text, numbering) => para(run(text), numbering);

async function docx(body, { numbering, media = {} } = {}) {
  const zip = new JSZip();
  zip.file('word/document.xml', `<?xml version="1.0"?><w:document ${W}><w:body>${body}</w:body></w:document>`);
  const rels = Object.keys(media).map((name, index) =>
    `<Relationship Id="rIdImg${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${name}"/>`);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`);
  for (const [name, data] of Object.entries(media)) zip.file(`word/media/${name}`, data);
  if (numbering) zip.file('word/numbering.xml', `<?xml version="1.0"?><w:numbering ${W}>${numbering}</w:numbering>`);
  return new File([await zip.generateAsync({ type: 'uint8array' })], 'paper.docx');
}

test('Word papers with typed numbering yield objective, MCQ and theory questions with pictures and equations', async () => {
  const fraction = '<m:oMath><m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f><m:r><m:t>m</m:t></m:r><m:sSup><m:e><m:r><m:t>v</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:oMath>';
  const file = await docx([
    p('SECTION A: OBJECTIVE'),
    p('Answer all questions.'),
    para(run('1. What is the SI unit of mass?') + picture('rIdImg1')),
    p('A. Newton'), p('B. Kilogram'), p('C. Joule'), p('D. Watt'),
    p('Answer: B'),
    p('Explanation: Mass is measured in kilograms.'),
    p('2. Which of these are vector quantities?'),
    p('A. Speed   B. Velocity   C. Force   D. Mass'),
    p('Answer: B, C'),
    para(run('3. The kinetic energy of a body is ') + fraction + run('. What is v when E = 8 J and m = 4 kg?')),
    p('(a) 1 m/s'), p('(b) 2 m/s'), p('(c) 4 m/s'),
    p('Ans: (b)'),
    p('SECTION B: THEORY'),
    p('4. State two uses of dimensional analysis. [4 marks]'),
    p('Answer: It checks the consistency of equations.'),
    p('It helps derive relationships between quantities.'),
  ].join(''), { media: { 'image1.png': png } });

  const result = await parseQuestionImportFile(file, { defaultSubject: 'Physics' });
  assert.deepEqual(result.skipped, []);
  assert.deepEqual(result.questions.map((question) => question.type), ['objective', 'multiple', 'objective', 'theory']);

  const [mass, vectors, energy, theory] = result.questions;
  assert.equal(mass.prompt, 'What is the SI unit of mass?');
  assert.match(mass.imageUrl, /^data:image\/png;base64,/);
  assert.deepEqual(mass.options, ['Newton', 'Kilogram', 'Joule', 'Watt']);
  assert.equal(mass.answer, 'Kilogram');
  assert.equal(mass.explanation, 'Mass is measured in kilograms.');

  assert.deepEqual(vectors.options, ['Speed', 'Velocity', 'Force', 'Mass']);
  assert.equal(vectors.answer, 'B, C');

  assert.match(energy.prompt, /\$\\frac\{1\}\{2\}mv\^2\$/);
  assert.equal(energy.answer, '2 m/s');

  assert.equal(theory.marks, 4);
  assert.equal(theory.prompt, 'State two uses of dimensional analysis.');
  assert.equal(theory.answer, 'It checks the consistency of equations.\nIt helps derive relationships between quantities.');
});

test('Word auto-numbered lists, option pictures and an answer key at the end are read accurately', async () => {
  const numbering = `
    <w:abstractNum w:abstractNumId="0">
      <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/></w:lvl>
      <w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="upperLetter"/></w:lvl>
    </w:abstractNum>
    <w:num w:numId="5"><w:abstractNumId w:val="0"/></w:num>`;
  const question = { id: 5, level: 0 };
  const option = { id: 5, level: 1 };
  const file = await docx([
    p('Which graph shows uniform acceleration?', question),
    para(run('Graph one') + picture('rIdImg1'), option),
    para(run('Graph two') + picture('rIdImg2'), option),
    p('Which are SI base units?', question),
    p('Metre', option), p('Newton', option), p('Kelvin', option), p('Joule', option),
    p('Answer Key'),
    p('1. B   2. A, C'),
  ].join(''), { numbering, media: { 'image1.png': png, 'image2.png': png } });

  const { questions, skipped } = await parseQuestionImportFile(file);
  assert.deepEqual(skipped, []);
  assert.equal(questions.length, 2);
  assert.equal(questions[0].type, 'objective');
  assert.equal(questions[0].options.length, 2);
  assert.match(questions[0].options[1], /^Graph two\n!\[\]\(data:image\/png;base64,/);
  assert.equal(questions[0].answer, questions[0].options[1]);
  assert.equal(questions[1].type, 'multiple');
  assert.deepEqual(questions[1].options, ['Metre', 'Newton', 'Kelvin', 'Joule']);
  assert.equal(questions[1].answer, 'A, C');
});

test('Word question tables and explicit types are honoured; problems are reported, not hidden', async () => {
  const cell = (text) => `<w:tc>${p(text)}</w:tc>`;
  const row = (...cells) => `<w:tr>${cells.map(cell).join('')}</w:tr>`;
  const file = await docx([
    `<w:tbl>${row('Type', 'Question', 'Option A', 'Option B', 'Option C', 'Answer')}${row('MCQ', 'Pick the scalars', 'Mass', 'Force', 'Time', 'A, C')}${row('Objective', 'Unit of time?', 'Second', 'Metre', '', 'A')}</w:tbl>`,
    p('1. Define power.'),
    p('2. Which is heavier?'), p('A. 1 kg of iron'), p('B. 1 kg of feathers'),
    para('<w:r><w:object/></w:r>'),
    p('Answer: C'),
  ].join(''));

  const { questions, skipped, warnings } = await parseQuestionImportFile(file);
  assert.deepEqual(questions.map((question) => [question.type, question.answer]), [['multiple', 'A, C'], ['objective', 'Second']]);
  assert.deepEqual(skipped.map((issue) => issue.location), ['Question 1 ("Define power.")', 'Question 2 ("Which is heavier?")']);
  assert.match(skipped[0].message, /No model answer/);
  assert.match(skipped[1].message, /does not match any option/);
  assert.ok(warnings.some((issue) => /MathType/.test(issue.message)));
});

test('teacher-style Word papers: inline options and answers, picture questions, marking points and headings', async () => {
  const list = (text) => p(text, { id: 7, level: 0 });
  const numbering = '<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/></w:lvl></w:abstractNum><w:num w:numId="7"><w:abstractNumId w:val="0"/></w:num>';
  const file = await docx([
    p('PHS 001: MECHANICS'),
    p('1.1 Fundamental Quantities Questions'),
    p('EASY'),
    list('Which of the following is NOT a fundamental quantity? A. Mass B. Temperature C. Volume  D. Length'),
    list('List the three basic quantities that you know? Mass, Length, Time'),
    para(picture('rIdImg1')),
    p('What is the length of the pencil as measured by the ruler?  5.5 cm'),
    para(picture('rIdImg1')),
    p('What would be your choice of instrument? Give a reason for your answer.'),
    p('1 mark: Correct instrument (micrometer screw gauge).'),
    p('1 mark: Correct reason (e.g., it is more precise).'),
    list('Which of the following measurements is the most precise? Explain your answer.'),
    p('I. 3 cm II. 2.6 cm III. 2.67 cm IV. 2.671 cm'),
    p('IV.  2.671 cm is the most precise because it has the most decimal places.'),
    p('MODERATE'),
    list('Which is an SI base unit? A current B gram C kelvin D volt Answer: A'),
    list('What is the average mass of a man? A. 7Kg B.70Kg C.700Kg D. 7000Kg'),
    para(picture('rIdImg1')),
    p('Answer: C'),
  ].join(''), { numbering, media: { 'image1.png': png } });

  const { questions, needsAnswer, skipped, warnings } = await parseQuestionImportFile(file);
  assert.deepEqual(skipped, []);
  const summary = questions.map((question) => [question.type, question.prompt.slice(0, 24), question.answer.slice(0, 24), question.difficulty]);
  assert.deepEqual(summary, [
    ['theory', 'List the three basic quan', 'Mass, Length, Time', 'easy'],
    ['theory', 'What is the length of th', '5.5 cm', 'easy'],
    ['theory', 'What would be your choic', 'Correct instrument (micr', 'easy'],
    ['objective', 'Which of the following m', '2.671 cm', 'easy'],
    ['objective', 'Which is an SI base unit', 'current', 'medium'],
    ['objective', 'Answer the question show', 'C', 'medium'],
  ].map(([type, prompt, answer, difficulty]) => [type, prompt.slice(0, 24), answer.slice(0, 24), difficulty]));
  assert.ok(questions.every((question) => question.topic === 'Fundamental Quantities'));
  assert.match(questions[1].imageUrl, /^data:image\/png/);
  assert.deepEqual(questions[2].rubricPoints, ['Correct instrument (micrometer screw gauge).', 'Correct reason (e.g., it is more precise).']);
  assert.deepEqual(questions[3].options, ['3 cm', '2.6 cm', '2.67 cm', '2.671 cm']);
  assert.match(questions[3].explanation, /most decimal places/);
  assert.equal(questions[3].answerBox, true);
  assert.equal(questions[4].answerBox, undefined);
  assert.deepEqual(questions[4].options, ['current', 'gram', 'kelvin', 'volt']);
  assert.deepEqual(questions[5].options, ['A', 'B', 'C', 'D']);
  assert.ok(warnings.some((issue) => /inside the picture/.test(issue.message)));

  // Questions whose file has no answer are kept so the admin can choose it in the review.
  assert.deepEqual(needsAnswer.map(({ location, question }) => [location.slice(0, 13), question.options]), [
    ['Question 1 ("', ['Mass', 'Temperature', 'Volume', 'Length']],
    ['Question 5 ("', ['7Kg', '70Kg', '700Kg', '7000Kg']],
  ]);
});

test('Excel uploads keep pictures anchored to question and option cells and explain skipped rows', async () => {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Physics quiz upload'],
    ['type', 'question', 'optionA', 'optionB', 'optionC', 'answer', 'explanation', 'marks'],
    ['objective', 'Identify the ammeter symbol.', 'Circle', 'Circle with A', 'Square', 'B', 'Ammeters show an A.', 2],
    ['', 'Which are forces?', 'Weight', 'Mass', 'Friction', 'A and C', '', ''],
    ['theory', 'Explain inertia.', '', '', '', 'Resistance to change in motion.', '', 'five'],
    ['objective', 'Broken row', 'One', 'Two', '', 'E', '', ''],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Questions');
  const zip = await JSZip.loadAsync(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  const sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('string');
  zip.file('xl/worksheets/sheet1.xml', sheetXml.replace('</worksheet>', '<drawing r:id="rIdDraw" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></worksheet>'));
  zip.file('xl/worksheets/_rels/sheet1.xml.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdDraw" Type="drawing" Target="../drawings/drawing1.xml"/></Relationships>');
  const anchor = (row, col, rid) => `<xdr:twoCellAnchor><xdr:from><xdr:col>${col}</xdr:col><xdr:row>${row}</xdr:row></xdr:from><xdr:pic><xdr:blipFill><a:blip r:embed="${rid}"/></xdr:blipFill></xdr:pic></xdr:twoCellAnchor>`;
  zip.file('xl/drawings/drawing1.xml', `<?xml version="1.0"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${anchor(2, 1, 'rIdA')}${anchor(2, 3, 'rIdB')}${anchor(3, 4, 'rIdC')}</xdr:wsDr>`);
  zip.file('xl/drawings/_rels/drawing1.xml.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdA" Type="image" Target="../media/image1.png"/><Relationship Id="rIdB" Type="image" Target="../media/image2.png"/><Relationship Id="rIdC" Type="image" Target="../media/image3.emf"/></Relationships>');
  zip.file('xl/media/image1.png', png);
  zip.file('xl/media/image2.png', png);
  zip.file('xl/media/image3.emf', Buffer.from('emf'));
  const file = new File([await zip.generateAsync({ type: 'uint8array' })], 'quiz.xlsx');

  const { questions, skipped, warnings } = await parseQuestionImportFile(file);
  assert.deepEqual(questions.map((question) => question.type), ['objective', 'multiple', 'theory']);
  assert.match(questions[0].imageUrl, /^data:image\/png/);
  assert.match(questions[0].options[1], /^Circle with A\n!\[\]\(data:image\/png/);
  assert.equal(questions[0].answer, questions[0].options[1]);
  assert.equal(questions[0].marks, 2);
  assert.equal(questions[1].answer, 'A, C');
  assert.equal(questions[2].marks, 2); // invalid "five" falls back to the theory default
  assert.deepEqual(skipped, [{ location: 'Row 6', message: 'The answer "E" does not match any option (A–B).' }]);
  assert.ok(warnings.some((issue) => issue.location === 'Row 4' && /EMF/.test(issue.message)));
  assert.ok(warnings.some((issue) => issue.location === 'Row 5' && /five/.test(issue.message)));
});

test('CSV uploads keep values as typed text and detect question types', async () => {
  const csv = 'question,options,answer,type\n"Half of one is?","1/2|1/4|2",A,\n"Select primary colours","Red|Green|Blue|Yellow","A,C,D",mcq\n';
  const { questions, skipped } = await parseQuestionImportFile(new File([csv], 'quiz.csv'));
  assert.deepEqual(skipped, []);
  assert.deepEqual(questions[0].options, ['1/2', '1/4', '2']);
  assert.equal(questions[0].answer, '1/2');
  assert.equal(questions[1].type, 'multiple');
  assert.equal(questions[1].answer, 'A, C, D');

  const boxed = await parseQuestionImportFile(new File(['question,options,answer,answerBox\n"Pick one","x|y",A,yes\n"Pick again","x|y",B,\n'], 'boxed.csv'));
  assert.deepEqual(boxed.questions.map((question) => question.answerBox), [true, undefined]);
});

test('the downloadable Word and Excel templates import cleanly with every question type, picture and equation', async () => {
  const images = Object.fromEntries(Object.entries(template.templateImages).map(([key, { file }]) =>
    [key, new Uint8Array(readFileSync(resolve(projectRoot, 'public/question-templates', file)))]));
  const expected = [
    ['objective', 'Volume', false], ['objective', '4.5 cm', false], ['objective', 'convex', false], ['objective', '2 m/s', false],
    ['objective', '2.671 cm', true], ['multiple', 'A, C', false], ['multiple', 'B, C', true],
    ['theory', 'It checks whether an equation', false], ['theory', '6.50 mm + 0.43 mm = 6.93 mm', false],
  ];
  const summarise = (questions) => questions.map((question) => [
    question.type, question.answer.includes('![](') ? 'convex' : question.answer.split('\n')[0].slice(0, expected.find(([, answer]) => question.answer.startsWith(answer))?.[1].length ?? 40),
    Boolean(question.answerBox),
  ]);

  const word = await parseQuestionImportFile(new File([await template.buildWordTemplate('Physics', images)], 'template.docx'));
  assert.deepEqual([word.skipped, word.needsAnswer, word.warnings], [[], [], []]);
  assert.deepEqual(summarise(word.questions), expected);
  assert.ok(word.questions.every((question) => question.topic === 'Measurement and Units' && question.difficulty === 'easy'));
  assert.match(word.questions[1].imageUrl, /^data:image\/png/);
  assert.ok(word.questions[2].options.every((option) => /^!\[\]\(data:image\/png/.test(option)));
  assert.match(word.questions[3].prompt, /\$E_k ?= ?\\frac\{1\}\{2\}mv\^2\$/);
  assert.match(word.questions[8].imageUrl, /^data:image\/png/);
  assert.deepEqual(word.questions.map((question) => question.marks), [1, 1, 1, 1, 3, 1, 3, 4, 2]);

  const excelFile = await template.buildExcelTemplate('Physics', images);
  const contentTypes = await (await JSZip.loadAsync(excelFile)).file('[Content_Types].xml').async('string');
  assert.equal(contentTypes.match(/Extension="png"/g).length, 1, 'Excel rejects duplicate content-type declarations');
  const excel = await parseQuestionImportFile(new File([excelFile], 'template.xlsx'));
  assert.deepEqual(excel.questions.map((question) => question.marks), [1, 1, 1, 1, 3, 1, 3, 4, 2]);
  assert.deepEqual([excel.skipped, excel.needsAnswer, excel.warnings], [[], [], []]);
  assert.deepEqual(summarise(excel.questions), expected);
  assert.match(excel.questions[1].imageUrl, /^data:image\/png/);
  assert.ok(excel.questions[2].options.every((option) => /^!\[\]\(data:image\/png/.test(option)));
  assert.match(excel.questions[8].imageUrl, /^data:image\/png/);
});

test('legacy .doc and unsupported files get clear instructions', async () => {
  await assert.rejects(parseQuestionImportFile(new File(['x'], 'old.doc')), /Save As/);
  await assert.rejects(parseQuestionImportFile(new File(['x'], 'notes.pdf')), /Word \(\.docx\), Excel/);
});

test('answer keys resolve letters, option text and compact forms without dropping parts', () => {
  const options = ['Newton', 'Kilogram', 'Second', 'Metre'];
  assert.deepEqual(answers.resolveAnswerIndices('ACD', options), [0, 2, 3]);
  assert.deepEqual(answers.resolveAnswerIndices('b. kilogram', options), [1]);
  assert.deepEqual(answers.resolveAnswerIndices('Newton and Metre', options), [0, 3]);
  assert.equal(answers.resolveAnswerIndices('A, Z', options), null);
  assert.equal(answers.parseQuestionType('Multiple Choice'), 'multiple');
  assert.equal(answers.parseQuestionType('Single answer'), 'objective');
  assert.equal(answers.parseQuestionType('Essay'), 'theory');
  assert.equal(answers.toggleSelectedLetter('A, C', 1, 4), 'A, B, C');
  assert.equal(answers.toggleSelectedLetter('A, C', 0, 4), 'C');
});
