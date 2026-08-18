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
exports.QuestionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const question_schema_1 = require("./question.schema");
let QuestionsService = class QuestionsService {
    questionModel;
    constructor(questionModel) {
        this.questionModel = questionModel;
    }
    async list() {
        const questions = await this.questionModel.find().sort({ createdAt: -1 }).exec();
        return questions.map((question) => this.publicQuestion(question));
    }
    async create(input, adminId) {
        this.validateQuestion(input);
        const question = await this.questionModel.create({
            ...input,
            createdBy: new mongoose_2.Types.ObjectId(adminId),
        });
        return this.publicQuestion(question);
    }
    async import(questions, adminId) {
        return Promise.all(questions.map((question) => this.create(question, adminId)));
    }
    async findById(id) {
        const question = await this.questionModel.findById(id).exec();
        if (!question)
            throw new common_1.NotFoundException("Question not found.");
        return question;
    }
    async totalMarks() {
        const result = await this.questionModel.aggregate([
            { $group: { _id: null, total: { $sum: "$marks" } } },
        ]);
        return result[0]?.total ?? 0;
    }
    validateQuestion(input) {
        if (input.type === "objective" && (!input.options || input.options.length < 2)) {
            throw new common_1.BadRequestException("Objective questions need at least two options.");
        }
    }
    publicQuestion(question) {
        return {
            id: question.id,
            type: question.type,
            topic: question.topic,
            prompt: question.prompt,
            options: question.options,
            answer: question.answer,
            explanation: question.explanation,
            marks: question.marks,
            keywords: question.keywords,
            createdBy: question.createdBy.toString(),
            createdAt: question.createdAt.toISOString(),
        };
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(question_schema_1.Question.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map