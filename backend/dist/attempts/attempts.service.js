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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttemptsService = void 0;
const common_1 = require("@nestjs/common");
const store_service_1 = require("../store.service");
const questions_service_1 = require("../questions/questions.service");
let AttemptsService = class AttemptsService {
    store;
    questions;
    constructor(store, questions) {
        this.store = store;
        this.questions = questions;
    }
    start(studentId) {
        const attempt = {
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
    submit(attemptId, studentId, answers) {
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
    myAttempts(studentId) {
        return this.store.attempts.filter((attempt) => attempt.studentId === studentId);
    }
    allAttempts() {
        return this.store.attempts;
    }
    findOwnedAttempt(attemptId, studentId) {
        const attempt = this.store.attempts.find((item) => item.id === attemptId);
        if (!attempt)
            throw new common_1.NotFoundException("Attempt not found.");
        if (attempt.studentId !== studentId)
            throw new common_1.ForbiddenException("You cannot submit this attempt.");
        return attempt;
    }
    markAnswer(attemptId, answer) {
        const question = this.questions.findById(answer.questionId);
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
            id: crypto.randomUUID(),
            attemptId,
            questionId: question.id,
            answer,
            awarded,
            correct,
            aiFeedback,
        };
    }
};
exports.AttemptsService = AttemptsService;
exports.AttemptsService = AttemptsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService,
        questions_service_1.QuestionsService])
], AttemptsService);
//# sourceMappingURL=attempts.service.js.map