import type { JwtUser } from "../common/jwt-user.type";
import { CreateQuestionDto, ImportQuestionsDto } from "./dto";
import { QuestionsService } from "./questions.service";
export declare class QuestionsController {
    private readonly questions;
    constructor(questions: QuestionsService);
    list(): Promise<{
        id: string;
        type: import("./question.schema").QuestionType;
        topic: string;
        prompt: string;
        options: string[] | undefined;
        answer: string;
        explanation: string;
        marks: number;
        difficulty: import("./question.schema").QuestionDifficulty;
        learningObjective: string | undefined;
        rubricPoints: string[] | undefined;
        commonMistakes: string[] | undefined;
        keywords: string[] | undefined;
        createdBy: string;
        createdAt: string;
    }[]>;
    create(body: CreateQuestionDto, user: JwtUser): Promise<{
        id: string;
        type: import("./question.schema").QuestionType;
        topic: string;
        prompt: string;
        options: string[] | undefined;
        answer: string;
        explanation: string;
        marks: number;
        difficulty: import("./question.schema").QuestionDifficulty;
        learningObjective: string | undefined;
        rubricPoints: string[] | undefined;
        commonMistakes: string[] | undefined;
        keywords: string[] | undefined;
        createdBy: string;
        createdAt: string;
    }>;
    import(body: ImportQuestionsDto, user: JwtUser): Promise<{
        id: string;
        type: import("./question.schema").QuestionType;
        topic: string;
        prompt: string;
        options: string[] | undefined;
        answer: string;
        explanation: string;
        marks: number;
        difficulty: import("./question.schema").QuestionDifficulty;
        learningObjective: string | undefined;
        rubricPoints: string[] | undefined;
        commonMistakes: string[] | undefined;
        keywords: string[] | undefined;
        createdBy: string;
        createdAt: string;
    }[]>;
}
