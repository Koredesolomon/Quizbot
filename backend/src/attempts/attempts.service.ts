import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AnswerRecord, AttemptRecord, QuestionRecord, StoreService } from "../store.service";
import { QuestionsService } from "../questions/questions.service";
import { SubmitAnswerDto } from "./dto";

@Injectable()
export class AttemptsService {
  constructor(
    private readonly store: StoreService,
    private readonly questions: QuestionsService
  ) {}

  start(studentId: string) {
    const attempt: AttemptRecord = {
      id: crypto.randomUUID(),
      studentId,
      status: "active",
      startedAt: new Date().toISOString(),
      score: 0,
      totalMarks: this.questions.totalMarks(),
      percent: 0,
    };

    this.store.attempts.push(attempt);
    return attempt;
  }

  submit(attemptId: string, studentId: string, answers: SubmitAnswerDto[]) {
    const attempt = this.findOwnedAttempt(attemptId, studentId);
    const markedAnswers = answers.map((answer) => this.markAnswer(attempt.id, answer));
    const score = markedAnswers.reduce((sum, answer) => sum + answer.awarded, 0);
    const totalMarks = this.questions.totalMarks();

    this.store.answers = this.store.answers.filter((answer) => answer.attemptId !== attempt.id);
    this.store.answers.push(...markedAnswers);

    attempt.status = "completed";
    attempt.submittedAt = new Date().toISOString();
    attempt.score = score;
    attempt.totalMarks = totalMarks;
    attempt.percent = totalMarks ? Math.round((score / totalMarks) * 100) : 0;

    return {
      attempt,
      answers: markedAnswers,
    };
  }

  myAttempts(studentId: string) {
    return this.store.attempts.filter((attempt) => attempt.studentId === studentId);
  }

  allAttempts() {
    return this.store.attempts;
  }

  private findOwnedAttempt(attemptId: string, studentId: string) {
    const attempt = this.store.attempts.find((item) => item.id === attemptId);
    if (!attempt) throw new NotFoundException("Attempt not found.");
    if (attempt.studentId !== studentId) throw new ForbiddenException("You cannot submit this attempt.");
    return attempt;
  }

  private markAnswer(attemptId: string, answer: SubmitAnswerDto): AnswerRecord {
    const question = this.questions.findById(answer.questionId);
    const response = answer.answer.trim();

    if (!response) {
      return this.answerRecord(attemptId, question, response, 0, false, "No response was submitted.");
    }

    if (question.type === "objective") {
      const correct = response === question.answer;
      return this.answerRecord(
        attemptId,
        question,
        response,
        correct ? question.marks : 0,
        correct,
        correct ? "Correct response." : "Incorrect response. Review the model answer."
      );
    }

    const normalized = response.toLowerCase();
    const keywordHits = question.keywords?.filter((keyword) => normalized.includes(keyword.toLowerCase())).length ?? 0;
    const ratio = keywordHits / (question.keywords?.length || 1);
    const awarded = Math.min(question.marks, Math.round(ratio * question.marks));

    return this.answerRecord(
      attemptId,
      question,
      response,
      awarded,
      awarded >= Math.ceil(question.marks * 0.7),
      awarded === question.marks
        ? "Excellent response."
        : awarded > 0
          ? "Partially correct response."
          : "The response missed the expected concepts."
    );
  }

  private answerRecord(
    attemptId: string,
    question: QuestionRecord,
    answer: string,
    awarded: number,
    correct: boolean,
    aiFeedback: string
  ): AnswerRecord {
    return {
      id: crypto.randomUUID(),
      attemptId,
      questionId: question.id,
      answer,
      awarded,
      correct,
      aiFeedback,
    };
  }
}
