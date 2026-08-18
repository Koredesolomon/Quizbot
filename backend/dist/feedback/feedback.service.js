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
exports.FeedbackService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const feedback_schema_1 = require("./feedback.schema");
let FeedbackService = class FeedbackService {
    feedbackModel;
    constructor(feedbackModel) {
        this.feedbackModel = feedbackModel;
    }
    async create(studentId, input) {
        const feedback = await this.feedbackModel.create({
            studentId: new mongoose_2.Types.ObjectId(studentId),
            rating: input.rating,
            message: input.message,
            status: "new",
        });
        return this.publicFeedback(feedback);
    }
    async list() {
        const feedback = await this.feedbackModel.find().sort({ createdAt: -1 }).exec();
        return feedback.map((item) => this.publicFeedback(item));
    }
    async markReviewed(id) {
        const feedback = await this.feedbackModel.findByIdAndUpdate(id, { status: "reviewed" }, { new: true }).exec();
        if (!feedback)
            throw new common_1.NotFoundException("Feedback not found.");
        return this.publicFeedback(feedback);
    }
    publicFeedback(feedback) {
        return {
            id: feedback.id,
            studentId: feedback.studentId.toString(),
            rating: feedback.rating,
            message: feedback.message,
            status: feedback.status,
            createdAt: feedback.createdAt.toISOString(),
        };
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(feedback_schema_1.Feedback.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map