"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttemptsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const questions_service_1 = require("../questions/questions.service");
const answer_schema_1 = require("./answer.schema");
const attempt_schema_1 = require("./attempt.schema");
let AttemptsService = class AttemptsService {
    attemptModel;
    answerModel;
    questions;
    constructor(attemptModel, answerModel, questions) {
        this.attemptModel = attemptModel;
        this.answerModel = answerModel;
        this.questions = questions;
    }
    async start(studentId) {
        const attempt = await this.attemptModel.create({
            studentId: new mongoose_2.Types.ObjectId(studentId),
            status: "active",
            startedAt: new Date(),
            score: 0,
            totalMarks: await this.questions.totalMarks(),
            percent: 0,
        });
        return this.publicAttempt(attempt);
    }
    async submit(attemptId, studentId, answers) {
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
    async myAttempts(studentId) {
        const attempts = await this.attemptModel.find({ studentId: new mongoose_2.Types.ObjectId(studentId) }).sort({ createdAt: -1 }).exec();
        return attempts.map((attempt) => this.publicAttempt(attempt));
    }
    async allAttempts() {
        const attempts = await this.attemptModel.find().sort({ createdAt: -1 }).exec();
        return attempts.map((attempt) => this.publicAttempt(attempt));
    }
    async findOwnedAttempt(attemptId, studentId) {
        const attempt = await this.attemptModel.findById(attemptId).exec();
        if (!attempt)
            throw new common_1.NotFoundException("Attempt not found.");
        if (attempt.studentId.toString() !== studentId)
            throw new common_1.ForbiddenException("You cannot submit this attempt.");
        return attempt;
    }
    async markAnswer(attemptId, answer) {
        const question = await this.questions.findById(answer.questionId);
        const response = answer.answer.trim();
        if (!response) {
            return this.answerRecord(attemptId, question, response, 0, false, "No response was submitted.");
        }
        if (question.type === "objective") {
            const correct = response === question.answer;
            return this.answerRecord(attemptId, question, response, correct ? question.marks : 0, correct, correct ? "Correct response." : "Incorrect response. Review the model answer.");
        }
        const normalized = response.toLowerCase();
        const keywordHits = question.keywords?.filter((keyword) => normalized.includes(keyword.toLowerCase())).length ?? 0;
        const ratio = keywordHits / (question.keywords?.length || 1);
        const awarded = Math.min(question.marks, Math.round(ratio * question.marks));
        return this.answerRecord(attemptId, question, response, awarded, awarded >= Math.ceil(question.marks * 0.7), awarded === question.marks
            ? "Excellent response."
            : awarded > 0
                ? "Partially correct response."
                : "The response missed the expected concepts.");
    }
    answerRecord(attemptId, question, answer, awarded, correct, aiFeedback) {
        return {
            attemptId: new mongoose_2.Types.ObjectId(attemptId),
            questionId: question._id,
            answer,
            awarded,
            correct,
            aiFeedback,
        };
    }
    publicAttempt(attempt) {
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
    publicAnswer(answer) {
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
};
exports.AttemptsService = AttemptsService;
exports.AttemptsService = AttemptsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(attempt_schema_1.Attempt.name)),
    __param(1, (0, mongoose_1.InjectModel)(answer_schema_1.Answer.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        questions_service_1.QuestionsService])
], AttemptsService);
//# sourceMappingURL=attempts.service.js.map