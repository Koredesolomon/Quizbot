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
exports.FeedbackService = void 0;
const common_1 = require("@nestjs/common");
const store_service_1 = require("../store.service");
let FeedbackService = class FeedbackService {
    store;
    constructor(store) {
        this.store = store;
    }
    create(studentId, input) {
        const feedback = {
            id: crypto.randomUUID(),
            studentId,
            rating: input.rating,
            message: input.message,
            status: "new",
            createdAt: new Date().toISOString(),
        };
        this.store.feedback.push(feedback);
        return feedback;
    }
    list() {
        return this.store.feedback;
    }
    markReviewed(id) {
        const feedback = this.store.feedback.find((item) => item.id === id);
        if (!feedback)
            throw new common_1.NotFoundException("Feedback not found.");
        feedback.status = "reviewed";
        return feedback;
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map