import type { QuizQuestion } from "@/types/platform";

// Marking runs one request at a time on a small server: about this long per written answer, plus the final review.
const secondsPerWrittenAnswer = 10;
const secondsPerChoiceAnswer = 3; // only wrong or partly right choices get an AI explanation
const secondsForReview = 8;
// The final review reads every question, answered or not, and a small model reads slowly.
const secondsPerQuestionInReview = 2.5;

export type MarkingEstimate = {
  /** Answers the AI has to read: written answers, tables and choice explanations. */
  writtenAnswers: number;
  lowSeconds: number;
  highSeconds: number;
};

export function estimateMarking(questions: Pick<QuizQuestion, "id" | "type" | "answerBox">[], answers: Record<string, string>): MarkingEstimate {
  let writtenAnswers = 0;
  let choiceAnswers = 0;
  for (const question of questions) {
    if (!answers[question.id]?.trim()) continue;
    if (question.type === "theory" || question.answerBox) writtenAnswers++;
    else choiceAnswers++;
  }

  const seconds = secondsForReview + questions.length * secondsPerQuestionInReview
    + writtenAnswers * secondsPerWrittenAnswer + choiceAnswers * secondsPerChoiceAnswer;
  return { writtenAnswers, lowSeconds: Math.round(seconds * 0.7), highSeconds: Math.round(seconds * 1.6) };
}

function duration({ lowSeconds, highSeconds }: MarkingEstimate) {
  if (highSeconds <= 45) return "under a minute";
  const low = Math.max(1, Math.round(lowSeconds / 60));
  const high = Math.max(low, Math.ceil(highSeconds / 60));
  if (low === high) return `about ${low} minute${low === 1 ? "" : "s"}`;
  return `about ${low} to ${high} minutes`;
}

/** What to tell the student while their answers are marked, based on what they wrote and how long marking has taken. */
export function markingMessage(estimate: MarkingEstimate, elapsedSeconds: number) {
  if (elapsedSeconds > estimate.highSeconds) {
    return "Still marking. This is taking longer than usual, but your answers are saved and nothing is lost.";
  }
  if (!estimate.writtenAnswers) {
    return `Checking your answers and writing your review. This should take ${duration(estimate)}.`;
  }
  const count = estimate.writtenAnswers;
  return `Reading your ${count} written answer${count === 1 ? "" : "s"} one by one, then writing your review. This should take ${duration(estimate)}.`;
}
