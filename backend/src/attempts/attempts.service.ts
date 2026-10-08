import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { QuestionsService } from "../questions/questions.service";
import type { QuestionDocument } from "../questions/question.schema";
import type { AnswerDocument } from "./answer.schema";
import { randomUUID } from "node:crypto";
import { ContentService } from "../content/content.service";
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
  private readonly logger = new Logger(AttemptsService.name);

  constructor(
    @InjectModel(Attempt.name) private readonly attemptModel: Model<AttemptDocument>,
    private readonly questions: QuestionsService,
    private readonly aiMarker: AiMarkerService,
    private readonly content: ContentService
  ) {}

  async start(studentId: string, quizId: string) {
    const context = await this.content.findPublishedQuiz(quizId);
    const quizQuestions = await this.questions.forQuiz(quizId);
    if (!quizQuestions.length) throw new BadRequestException("This quiz has no questions yet.");
    const attempt = await this.attemptModel.create({
      studentId: new Types.ObjectId(studentId),
      courseId: context.courseId,
      quizId,
      questionSnapshots: quizQuestions.map((question) => question.toObject()),
      questionCount: quizQuestions.length,
      status: "active",
      startedAt: new Date(),
      score: 0,
      totalMarks: quizQuestions.reduce((sum, question) => sum + question.marks, 0),
      percent: 0,
    });

    return {
      attempt: this.publicAttempt(attempt),
      questions: quizQuestions.map((question) => this.questions.publicPrompt(question)),
    };
  }

  async submit(attemptId: string, studentId: string, answers: SubmitAnswerDto[]) {
    const attempt = await this.findOwnedAttempt(attemptId, studentId);
    if (attempt.status !== "active") throw new ConflictException("This attempt has already been submitted.");
    const snapshots = attempt.questionSnapshots;
    if (!snapshots?.length) {
      throw new ConflictException("This attempt predates secure quiz grading. Please start a new test.");
    }
    const expectedIds = new Set(snapshots.map((question) => question._id.toString()));
    const submitted = new Map<string, string>();
    for (const answer of answers) {
      if (submitted.has(answer.questionId)) throw new BadRequestException("Each question can only be answered once.");
      if (!expectedIds.has(answer.questionId)) throw new BadRequestException("This question does not belong to your attempt.");
      submitted.set(answer.questionId, answer.answer);
    }

    const submissionToken = randomUUID();
    const claimed = await this.attemptModel.findOneAndUpdate({
      _id: attempt._id, studentId: attempt.studentId, status: "active",
      $or: [
        { submissionToken: { $exists: false } },
        { submissionStartedAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) } },
      ],
    }, { $set: { submissionToken, submissionStartedAt: new Date() } }, { new: true }).exec();
    if (!claimed) throw new ConflictException("This attempt is already being submitted or has been completed.");

    try {
      const markedAnswers = await Promise.all(snapshots.map((question) =>
        this.markAnswer(attempt.id, question, submitted.get(question._id.toString()) ?? "")));
      const score = markedAnswers.reduce((sum, answer) => sum + answer.awarded, 0);
      const totalMarks = snapshots.reduce((sum, question) => sum + question.marks, 0);
      const percent = Math.round((score / totalMarks) * 100);
      const aiSummary = await this.aiMarker.reviewCompletedTest(
        {
          score, totalMarks, percent,
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

      // Store scores and every marked answer together, including on standalone MongoDB.
      const completed = await this.attemptModel.findOneAndUpdate({
        _id: attempt._id, studentId: attempt.studentId, status: "active", submissionToken,
      }, {
        $set: {
          status: "completed", submittedAt: new Date(), score, totalMarks, percent, aiSummary,
          answeredCount: markedAnswers.filter((answer) => answer.answer.length > 0).length,
          gradedAnswers: markedAnswers.map((answer) => this.persistedAnswer(answer)),
        },
        $unset: { submissionToken: 1, submissionStartedAt: 1 },
      }, { new: true, runValidators: true }).select("+questionSnapshots +gradedAnswers").exec();
      if (!completed) throw new ConflictException("The submission changed. Please retry to retrieve your result.");
      return this.publicResult(completed);
    } catch (error) {
      try {
        await this.attemptModel.updateOne({ _id: attempt._id, status: "active", submissionToken }, {
          $unset: { submissionToken: 1, submissionStartedAt: 1 },
        }).exec();
      } catch {
        this.logger.warn("Could not release a failed submission. Its lock will expire after ten minutes.");
      }
      throw error;
    }
  }

  async result(attemptId: string, studentId: string) {
    const attempt = await this.findOwnedAttempt(attemptId, studentId);
    if (attempt.status !== "completed" || !attempt.gradedAnswers || !attempt.questionSnapshots?.length) {
      throw new ConflictException("A completed result is not available yet.");
    }
    return this.publicResult(attempt);
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
    if (!Types.ObjectId.isValid(attemptId)) throw new BadRequestException("Invalid attempt ID.");
    const attempt = await this.attemptModel.findById(attemptId).select("+questionSnapshots +gradedAnswers").exec();
    if (!attempt) throw new NotFoundException("Attempt not found.");
    if (attempt.studentId.toString() !== studentId) throw new ForbiddenException("You cannot submit this attempt.");
    return attempt;
  }

  private async markAnswer(attemptId: string, question: QuestionDocument, answer: string) {
    const response = answer.trim();

    if (!response) {
      return this.answerRecord(attemptId, question, response, 0, false, "No response was submitted.");
    }

    if (question.type === "objective") {
      const correct = this.objectiveAnswersMatch(response, question.answer, question.options ?? []);
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

  private objectiveAnswersMatch(response: string, modelAnswer: string, options: string[]) {
    const expectedValues = this.answerCandidates(modelAnswer, options);
    const responseValues = this.answerCandidates(response, options);

    return responseValues.some((value) => expectedValues.includes(value));
  }

  private answerCandidates(value: string, options: string[]) {
    const raw = value.trim();
    const candidates = new Set<string>([this.normalizeAnswer(raw)]);
    const letterIndex = this.answerLetterIndex(raw);

    if (letterIndex !== null) {
      candidates.add(this.normalizeAnswer(String.fromCharCode(65 + letterIndex)));
      if (options[letterIndex]) candidates.add(this.normalizeAnswer(options[letterIndex]));
    }

    const optionIndex = options.findIndex((option) => this.normalizeAnswer(option) === this.normalizeAnswer(raw));
    if (optionIndex >= 0) candidates.add(this.normalizeAnswer(String.fromCharCode(65 + optionIndex)));

    return Array.from(candidates).filter(Boolean);
  }

  private answerLetterIndex(value: string) {
    const match = value.trim().match(/^(?:option\s*)?([A-E])[).:-]?$/i);
    if (!match) return null;
    return match[1].toUpperCase().charCodeAt(0) - 65;
  }

  private normalizeAnswer(value: string) {
    const superscriptToAscii: Record<string, string> = {
      "⁰": "^0",
      "¹": "^1",
      "²": "^2",
      "³": "^3",
      "⁴": "^4",
      "⁵": "^5",
      "⁶": "^6",
      "⁷": "^7",
      "⁸": "^8",
      "⁹": "^9",
      "⁻": "^-",
      "⁺": "^+",
    };
    const subscriptToAscii: Record<string, string> = {
      "₀": "_0",
      "₁": "_1",
      "₂": "_2",
      "₃": "_3",
      "₄": "_4",
      "₅": "_5",
      "₆": "_6",
      "₇": "_7",
      "₈": "_8",
      "₉": "_9",
      "₋": "_-",
      "₊": "_+",
    };

    return value
      .toLowerCase()
      .replace(/\$+/g, "")
      .replace(/\\mathrm\{([^{}]+)\}/g, "$1")
      .replace(/\^\{([^{}]+)\}/g, "^$1")
      .replace(/_\{([^{}]+)\}/g, "_$1")
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, (character) => superscriptToAscii[character] ?? character)
      .replace(/[₀₁₂₃₄₅₆₇₈₉₋₊]/g, (character) => subscriptToAscii[character] ?? character)
      .replace(/\s+/g, "")
      .replace(/[.,;:]/g, "")
      .trim();
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
      quizId: attempt.quizId,
      courseId: attempt.courseId,
      questionCount: attempt.questionCount,
      answeredCount: attempt.answeredCount,
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

  private publicResult(attempt: AttemptDocument) {
    return {
      attempt: this.publicAttempt(attempt),
      answers: (attempt.gradedAnswers ?? []).map((answer) => this.publicAnswer(answer)),
      questions: (attempt.questionSnapshots ?? []).map((question) => this.questions.publicQuestion(question)),
    };
  }

  private persistedAnswer(answer: ReturnType<typeof this.answerRecord>) {
    return {
      _id: new Types.ObjectId(),
      attemptId: answer.attemptId,
      questionId: answer.questionId,
      answer: answer.answer,
      awarded: answer.awarded,
      correct: answer.correct,
      aiFeedback: answer.aiFeedback,
      createdAt: new Date(),
      updatedAt: new Date(),
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
