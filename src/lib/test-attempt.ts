import * as api from "./api";
import type { MarkedQuestion } from "@/types/platform";

export async function submitSavedAttempt(attemptId: string, answers: Record<string, string>, token: string) {
  try {
    return await api.submitAttempt(attemptId, answers, token);
  } catch (error) {
    // A saved result can outlive a lost HTTP response. Recover it without grading again.
    try {
      return await api.getAttemptResult(attemptId, token);
    } catch {
      throw error;
    }
  }
}

export function markedAttemptQuestions(response: api.SubmitAttemptResponse): MarkedQuestion[] {
  if (response.attempt.status !== "completed" || !response.questions.length) {
    throw new Error("A saved completed result is not available. Please retry your submission.");
  }
  const answers = new Map(response.answers.map((answer) => [answer.questionId, answer]));
  return response.questions.map((question) => {
    const marked = answers.get(question.id);
    if (!marked) throw new Error("The saved result is incomplete. Please retry your submission.");
    return { ...question, userAnswer: marked.answer, awarded: marked.awarded, correct: marked.correct, aiFeedback: marked.aiFeedback };
  });
}
