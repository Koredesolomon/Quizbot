import { Model, Types } from "mongoose";
import { CreateQuestionDto } from "./dto";
import { Question, QuestionDocument } from "./question.schema";
export declare class QuestionsService {
    private readonly questionModel;
    constructor(questionModel: Model<QuestionDocument>);
    list(): Promise<{
        id: string;
        type: import("./question.schema").QuestionType;
        topic: string;
        prompt: string;
        options: string[] | undefined;
        answer: string;
        explanation: string;
        marks: number;
        keywords: string[] | undefined;
        createdBy: string;
        createdAt: string;
    }[]>;
    create(input: CreateQuestionDto, adminId: string): Promise<{
        id: string;
        type: import("./question.schema").QuestionType;
        topic: string;
        prompt: string;
        options: string[] | undefined;
        answer: string;
        explanation: string;
        marks: number;
        keywords: string[] | undefined;
        createdBy: string;
        createdAt: string;
    }>;
    import(questions: CreateQuestionDto[], adminId: string): Promise<{
        id: string;
        type: import("./question.schema").QuestionType;
        topic: string;
        prompt: string;
        options: string[] | undefined;
        answer: string;
        explanation: string;
        marks: number;
        keywords: string[] | undefined;
        createdBy: string;
        createdAt: string;
    }[]>;
    findById(id: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Question, {}, import("mongoose").DefaultSchemaOptions> & Question & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, Question, {}, import("mongoose").DefaultSchemaOptions> & Question & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    totalMarks(): Promise<number>;
    private validateQuestion;
    publicQuestion(question: QuestionDocument): {
        id: string;
        type: import("./question.schema").QuestionType;
        topic: string;
        prompt: string;
        options: string[] | undefined;
        answer: string;
        explanation: string;
        marks: number;
        keywords: string[] | undefined;
        createdBy: string;
        createdAt: string;
    };
}
