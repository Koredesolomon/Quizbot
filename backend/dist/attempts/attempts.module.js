"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttemptsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const questions_module_1 = require("../questions/questions.module");
const answer_schema_1 = require("./answer.schema");
const attempt_schema_1 = require("./attempt.schema");
const attempts_controller_1 = require("./attempts.controller");
const attempts_service_1 = require("./attempts.service");
const ai_marker_service_1 = require("./ai-marker.service");
let AttemptsModule = class AttemptsModule {
};
exports.AttemptsModule = AttemptsModule;
exports.AttemptsModule = AttemptsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            questions_module_1.QuestionsModule,
            mongoose_1.MongooseModule.forFeature([
                { name: attempt_schema_1.Attempt.name, schema: attempt_schema_1.AttemptSchema },
                { name: answer_schema_1.Answer.name, schema: answer_schema_1.AnswerSchema },
            ]),
        ],
        controllers: [attempts_controller_1.AttemptsController],
        providers: [attempts_service_1.AttemptsService, ai_marker_service_1.AiMarkerService],
        exports: [attempts_service_1.AttemptsService],
    })
], AttemptsModule);
//# sourceMappingURL=attempts.module.js.map