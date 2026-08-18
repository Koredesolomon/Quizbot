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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const attempts_service_1 = require("../attempts/attempts.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const feedback_service_1 = require("../feedback/feedback.service");
const questions_service_1 = require("../questions/questions.service");
let AdminController = class AdminController {
    attempts;
    feedback;
    questions;
    constructor(attempts, feedback, questions) {
        this.attempts = attempts;
        this.feedback = feedback;
        this.questions = questions;
    }
    async attemptsList() {
        return this.attempts.allAttempts();
    }
    async feedbackList() {
        return this.feedback.list();
    }
    async markFeedbackReviewed(id) {
        return this.feedback.markReviewed(id);
    }
    async analytics() {
        const attempts = await this.attempts.allAttempts();
        const feedback = await this.feedback.list();
        const questions = await this.questions.list();
        const totalMarks = await this.questions.totalMarks();
        const completed = attempts.filter((attempt) => attempt.status === "completed");
        const averageScore = completed.length
            ? Math.round(completed.reduce((sum, attempt) => sum + attempt.percent, 0) / completed.length)
            : 0;
        return {
            questions: questions.length,
            totalMarks,
            attempts: attempts.length,
            activeStudents: attempts.filter((attempt) => attempt.status === "active").length,
            completedAttempts: completed.length,
            averageScore,
            unreadFeedback: feedback.filter((item) => item.status === "new").length,
            watchlist: completed.filter((attempt) => attempt.percent < 50),
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)("attempts"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "attemptsList", null);
__decorate([
    (0, common_1.Get)("feedback"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "feedbackList", null);
__decorate([
    (0, common_1.Patch)("feedback/:id/reviewed"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "markFeedbackReviewed", null);
__decorate([
    (0, common_1.Get)("analytics"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "analytics", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)("admin"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("admin"),
    __metadata("design:paramtypes", [attempts_service_1.AttemptsService,
        feedback_service_1.FeedbackService,
        questions_service_1.QuestionsService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map