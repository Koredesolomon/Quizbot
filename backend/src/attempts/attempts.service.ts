import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { QuestionsService } from "../questions/questions.service";
import type { QuestionDocument } from "../questions/question.schema";
import { Answer, AnswerDocument } from "./answer.schema";
import { Attempt, AttemptDocument } from "./attempt.schema";
import { SubmitAnswerDto } from "./dto";

@Injectable()
export class AttemptsService {
  constructor(
    @InjectModel(Attempt.name) private readonly attemptModel: Model<AttemptDocument>,
    @InjectModel(Answer.name) private readonly answerModel: Model<AnswerDocument>,
    private readonly questions: QuestionsService
  ) {}

  async start(studentId: string) {
    const attempt = await this.attemptModel.create({
      studentId: new Types.ObjectId(studentId),
      status: "active",
      startedAt: new Date(),
      score: 0,
      totalMarks: await this.questions.totalMarks(),
      percent: 0,
    });

    return this.publicAttempt(attempt);
  }

  async submit(attemptId: string, studentId: string, answers: SubmitAnswerDto[]) {
    const attempt = await this.findOwnedAttempt(attemptId, studentId);
    const markedAnswers = await Promise.all(answers.map((answer) => this.markAnswer(attempt.id, answer)));
    const score = markedAnswers.reduce((sum, answer) => sum + answer.awarded, 0);
    const totalMarks = await this.questions.totalMarks();

    await this.answerModel.deleteMany({ attemptId: attempt._id }).exec();
    const savedAnswers = await this.answerModel.insertMany(markedAnswers);

    attempt.status = "completed";
    attempt.submittedAt = new Date();
    attempt.score = score;
    attempt.totalMarks = totalMarks;
    attempt.percent = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
    await attempt.save();

    return {
      attempt: this.publicAttempt(attempt),
      answers: savedAnswers.map((answer) => this.publicAnswer(answer)),
    };
  }

  async myAttempts(studentId: string) {
    const attempts = await this.attemptModel.find({ studentId: new Types.ObjectId(studentId) }).sort({ createdAt: -1 }).exec();
    return attempts.map((attempt) => this.publicAttempt(attempt));
  }

  async allAttempts() {
    const attempts = await this.attemptModel.find().sort({ createdAt: -1 }).exec();
    return attempts.map((attempt) => this.publicAttempt(attempt));
  }

  private async findOwnedAttempt(attemptId: string, studentId: string) {
    const attempt = await this.attemptModel.findById(attemptId).exec();
    if (!attempt) throw new NotFoundException("Attempt not found.");
    if (attempt.studentId.toString() !== studentId) throw new ForbiddenException("You cannot submit this attempt.");
    return attempt;
  }

  private async markAnswer(attemptId: string, answer: SubmitAnswerDto) {
    const question = await this.questions.findById(answer.questionId);
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
    question: QuestionDocument,
    answer: string,
    awarded: number,
    correct: boolean,
    aiFeedback: string
  ) {
    return {
      attemptId: new Types.ObjectId(attemptId),
      questionId: question._id,
      answer,
      awarded,
      correct,
      aiFeedback,
    };
  }

  private publicAttempt(attempt: AttemptDocument) {
    return {
      id: attempt.id,
      studentId: attempt.studentId.toString(),
      status: attempt.status,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString(),
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percent: attempt.percent,
      createdAt: attempt.createdAt.toISOString(),
    };
  }

  private publicAnswer(answer: AnswerDocument) {
    return {
      id: answer.id,
      attemptId: answer.attemptId.toString(),
      questionId: answer.questionId.toString(),
      answer: answer.answer,
      awarded: answer.awarded,
      correct: answer.correct,
      aiFeedback: answer.aiFeedback,
      createdAt: answer.createdAt.toISOString(),
    };
  }
}
