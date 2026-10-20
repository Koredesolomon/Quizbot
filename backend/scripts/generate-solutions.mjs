// Drafts worked solutions for numeric/expression questions with the local model, overnight.
// A draft is kept only when its final answer matches the stored answer (checked in code); the rest are
// marked needs_review and keep no draft, so unverified text is never shown to students.
//
//   npm run build && node scripts/generate-solutions.mjs [--limit 50] [--dry-run]
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
try { process.loadEnvFile(resolve(root, ".env")); } catch { /* environment may already be set */ }
const mongoose = require("mongoose");
const { QuestionSchema } = require(resolve(root, "dist/questions/question.schema.js"));
const { checkFinalAnswer } = require(resolve(root, "dist/grading/final-answer.js"));

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitIndex = args.indexOf("--limit");
const limit = limitIndex >= 0 ? Number(args[limitIndex + 1]) : Infinity;
const baseUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
const model = process.env.OLLAMA_MODEL || "qwen3:4b";

async function draft(question) {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15 * 60 * 1000),
    body: JSON.stringify({
      model, stream: false, think: true, options: { temperature: 0.2 },
      messages: [
        { role: "system", content: "You write short, correct worked solutions for exam questions. Show each step with its formula and units. The last line must be exactly: FINAL ANSWER: <answer>" },
        { role: "user", content: `Question: ${question.prompt}\nThe correct final answer is ${question.answer}. Write the worked solution that reaches it.` },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
  return String((await response.json()).message?.content ?? "").trim();
}

await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/quiz-bot");
const Question = mongoose.model("Question", QuestionSchema);
const pending = await Question.find({
  type: "theory", answerType: { $in: ["numeric", "expression"] }, solutionStatus: { $ne: "verified" },
}).limit(Number.isFinite(limit) ? limit : 0).exec();
console.log(`${pending.length} question(s) to process with ${model}${dryRun ? " (dry run)" : ""}.`);

let verified = 0;
let review = 0;
for (const [index, question] of pending.entries()) {
  let text = "";
  try { text = await draft(question); } catch (error) { console.warn(`  ! ${question.id}: ${error.message}`); }
  const finalLine = text.split("\n").reverse().find((line) => /FINAL ANSWER\s*:/i.test(line)) ?? "";
  const ok = checkFinalAnswer(question.answerType, finalLine.replace(/.*FINAL ANSWER\s*:/i, ""), question.answer)?.correct === true;
  ok ? verified++ : review++;
  console.log(`[${index + 1}/${pending.length}] ${question.id} ${ok ? "verified" : "needs_review"}`);
  if (dryRun) continue;
  await Question.updateOne({ _id: question._id }, ok
    ? { $set: { referenceSolution: text.split("\n").filter((line) => !/FINAL ANSWER\s*:/i.test(line)).join("\n").trim() || text, solutionStatus: "verified" } }
    : { $set: { solutionStatus: "needs_review" } });
}
console.log(`Done: ${verified} verified, ${review} need review. Spot-check 10-20 verified solutions by hand.`);
await mongoose.disconnect();
