import * as api from "./api";
import type { MarkedQuestion } from "@/types/platform";

export type PollOptions = { intervalMs?: number; timeoutMs?: number };

export async function submitSavedAttempt(attemptId: string, answers: Record<string, string>, token: string, poll: PollOptions = {}) {
  let response: api.SubmitAttemptResponse;
  try {
    response = await api.submitAttempt(attemptId, answers, token);
  } catch (error) {
    // A saved result can outlive a lost HTTP response. Recover it without grading again.
    try {
      response = await api.getAttemptResult(attemptId, token);
    } catch {
      throw error;
    }
  }

  return response.attempt.status === "grading" ? waitForResult(attemptId, token, poll) : response;
}

/** Fetches a saved result after a page reload, waiting for marking that is still running. */
export async function waitForSavedResult(attemptId: string, token: string, poll: PollOptions = {}) {
  const response = await api.getAttemptResult(attemptId, token);
  return response.attempt.status === "grading" ? waitForResult(attemptId, token, poll) : response;
}

/** Marking on a slow server finishes in the background; poll until the saved result is ready. */
async function waitForResult(attemptId: string, token: string, { intervalMs = 3000, timeoutMs = 35 * 60 * 1000 }: PollOptions) {
  const deadline = Date.now() + timeoutMs;
  let failures = 0;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    try {
      const result = await api.getAttemptResult(attemptId, token);
      if (result.attempt.status !== "grading") return result;
      failures = 0;
    } catch (error) {
      // Tolerate a dropped connection, but not a result that has stopped being available.
      if (++failures >= 5) throw error;
    }
  }
  throw new Error("Marking is taking longer than expected. Your answers are saved; open the attempt again in a few minutes.");
}

export function markedAttemptQuestions(response: api.SubmitAttemptResponse): MarkedQuestion[] {
  if (response.attempt.status !== "completed" || !response.questions.length) {
    throw new Error("A saved completed result is not available. Please retry your submission.");
  }
  const answers = new Map(response.answers.map((answer) => [answer.questionId, answer]));
  return response.questions.map((question) => {
    const marked = answers.get(question.id);
    if (!marked) throw new Error("The saved result is incomplete. Please retry your submission.");
    return { ...question, userAnswer: marked.answer, awarded: marked.awarded, correct: marked.correct, aiFeedback: marked.aiFeedback, feedbackSource: marked.feedbackSource };
  });
}
