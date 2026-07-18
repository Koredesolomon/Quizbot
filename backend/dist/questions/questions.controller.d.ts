import type { JwtUser } from "../common/jwt-user.type";
import { CreateQuestionDto, ImportQuestionsDto } from "./dto";
import { QuestionsService } from "./questions.service";
export declare class QuestionsController {
    private readonly questions;
    constructor(questions: QuestionsService);
    list(): import("../store.service").QuestionRecord[];
    create(body: CreateQuestionDto, user: JwtUser): import("../store.service").QuestionRecord;
    import(body: ImportQuestionsDto, user: JwtUser): import("../store.service").QuestionRecord[];
}
