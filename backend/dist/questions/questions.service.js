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
exports.QuestionsService = void 0;
const common_1 = require("@nestjs/common");
const store_service_1 = require("../store.service");
let QuestionsService = class QuestionsService {
    store;
    constructor(store) {
        this.store = store;
    }
    list() {
        return this.store.questions;
    }
    create(input, adminId) {
        this.validateQuestion(input);
        const question = {
            id: crypto.randomUUID(),
            ...input,
            createdBy: adminId,
            createdAt: new Date().toISOString(),
        };
        this.store.questions.push(question);
        return question;
    }
    import(questions, adminId) {
        return questions.map((question) => this.create(question, adminId));
    }
    findById(id) {
        const question = this.store.questions.find((item) => item.id === id);
        if (!question)
            throw new common_1.NotFoundException("Question not found.");
        return question;
    }
    totalMarks() {
        return this.store.questions.reduce((sum, question) => sum + question.marks, 0);
    }
    validateQuestion(input) {
        if (input.type === "objective" && (!input.options || input.options.length < 2)) {
            throw new common_1.BadRequestException("Objective questions need at least two options.");
        }
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map