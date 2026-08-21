import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { QuestionsService } from "../questions/questions.service";
import type { QuestionDocument } from "../questions/question.schema";
import { Answer, AnswerDocument } from "./answer.schema";
import { Attempt, AttemptDocument } from "./attempt.schema";
import { AiMarkerService } from "./ai-marker.service";
import { SubmitAnswerDto } from "./dto";

type PopulatedStudent = {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
};

@Injectable()
export class AttemptsService {
  constructor(
    @InjectModel(Attempt.name) private readonly attemptModel: Model<AttemptDocument>,
    @InjectModel(Answer.name) private readonly answerModel: Model<AnswerDocument>,
    private readonly questions: QuestionsService,
    private readonly aiMarker: AiMarkerService
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
    const percent = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
    const aiSummary = await this.aiMarker.reviewCompletedTest(
      {
        score,
        totalMarks,
        percent,
        answers: markedAnswers.map((answer) => ({
          topic: answer.question.topic,
          prompt: answer.question.prompt,
          modelAnswer: answer.question.answer,
          explanation: answer.question.explanation,
          difficulty: answer.question.difficulty,
          learningObjective: answer.question.learningObjective,
          rubricPoints: answer.question.rubricPoints ?? [],
          commonMistakes: answer.question.commonMistakes ?? [],
          studentAnswer: answer.answer,
          awarded: answer.awarded,
          marks: answer.question.marks,
          correct: answer.correct,
        })),
      },
      this.fallbackTestSummary(score, totalMarks, percent, markedAnswers)
    );

    await this.answerModel.deleteMany({ attemptId: attempt._id }).exec();
    const savedAnswers = await this.answerModel.insertMany(markedAnswers.map((answer) => this.persistedAnswer(answer)));

    attempt.status = "completed";
    attempt.submittedAt = new Date();
    attempt.score = score;
    attempt.totalMarks = totalMarks;
    attempt.percent = percent;
    attempt.aiSummary = aiSummary;
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
    const attempts = await this.attemptModel.find().populate("studentId", "fullName email").sort({ createdAt: -1 }).exec();
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

    const fallback = this.keywordReview(question, response);
    const review = await this.aiMarker.reviewTheoryAnswer(question, response, fallback);

    return this.answerRecord(attemptId, question, response, review.awarded, review.correct, review.aiFeedback);
  }

  private keywordReview(question: QuestionDocument, response: string) {
    const normalized = response.toLowerCase();
    const keywordHits = question.keywords?.filter((keyword) => normalized.includes(keyword.toLowerCase())).length ?? 0;
    const ratio = keywordHits / (question.keywords?.length || 1);
    const awarded = Math.min(question.marks, Math.round(ratio * question.marks));

    return {
      awarded,
      correct: awarded >= Math.ceil(question.marks * 0.7),
      aiFeedback:
        awarded === question.marks
          ? "Excellent response."
          : awarded > 0
            ? "Partially correct response."
            : "The response missed the expected concepts.",
    };
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
      question,
      answer,
      awarded,
      correct,
      aiFeedback,
    };
  }

  private publicAttempt(attempt: AttemptDocument) {
    const student = this.populatedStudent(attempt.studentId);

    return {
      id: attempt.id,
      studentId: student?._id.toString() ?? attempt.studentId.toString(),
      studentName: student?.fullName,
      studentEmail: student?.email,
      status: attempt.status,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString(),
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percent: attempt.percent,
      aiSummary: attempt.aiSummary,
      createdAt: attempt.createdAt.toISOString(),
    };
  }

  private populatedStudent(studentId: Types.ObjectId | PopulatedStudent) {
    return "fullName" in studentId ? studentId : null;
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

  private persistedAnswer(answer: ReturnType<typeof this.answerRecord>) {
    return {
      attemptId: answer.attemptId,
      questionId: answer.questionId,
      answer: answer.answer,
      awarded: answer.awarded,
      correct: answer.correct,
      aiFeedback: answer.aiFeedback,
    };
  }

  private fallbackTestSummary(
    score: number,
    totalMarks: number,
    percent: number,
    answers: Array<{ question: QuestionDocument; awarded: number; correct: boolean }>
  ) {
    const weakTopics = Array.from(
      new Set(answers.filter((answer) => !answer.correct).map((answer) => answer.question.topic))
    );

    if (percent >= 70) {
      return `You scored ${score}/${totalMarks} (${percent}%). Good work. Review the missed questions carefully and practise ${weakTopics.join(", ") || "the weaker topics"} to strengthen your accuracy.`;
    }

    return `You scored ${score}/${totalMarks} (${percent}%). Keep building. Focus first on ${weakTopics.join(", ") || "the topics you missed"}, then retry similar questions after reviewing the model explanations.`;
  }
}
