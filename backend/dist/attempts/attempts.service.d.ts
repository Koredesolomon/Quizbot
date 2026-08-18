import { Model } from "mongoose";
import { QuestionsService } from "../questions/questions.service";
import { AnswerDocument } from "./answer.schema";
import { AttemptDocument } from "./attempt.schema";
import { SubmitAnswerDto } from "./dto";
export declare class AttemptsService {
    private readonly attemptModel;
    private readonly answerModel;
    private readonly questions;
    constructor(attemptModel: Model<AttemptDocument>, answerModel: Model<AnswerDocument>, questions: QuestionsService);
    start(studentId: string): Promise<{
        id: string;
        studentId: string;
        status: import("./attempt.schema").AttemptStatus;
        startedAt: string;
        submittedAt: string | undefined;
        score: number;
        totalMarks: number;
        percent: number;
        createdAt: string;
    }>;
    submit(attemptId: string, studentId: string, answers: SubmitAnswerDto[]): Promise<{
        attempt: {
            id: string;
            studentId: string;
            status: import("./attempt.schema").AttemptStatus;
            startedAt: string;
            submittedAt: string | undefined;
            score: number;
            totalMarks: number;
            percent: number;
            createdAt: string;
        };
        answers: {
            id: string;
            attemptId: string;
            questionId: string;
            answer: string;
            awarded: number;
            correct: boolean;
            aiFeedback: string;
            createdAt: string;
        }[];
    }>;
    myAttempts(studentId: string): Promise<{
        id: string;
        studentId: string;
        status: import("./attempt.schema").AttemptStatus;
        startedAt: string;
        submittedAt: string | undefined;
        score: number;
        totalMarks: number;
        percent: number;
        createdAt: string;
    }[]>;
    allAttempts(): Promise<{
        id: string;
        studentId: string;
        status: import("./attempt.schema").AttemptStatus;
        startedAt: string;
        submittedAt: string | undefined;
        score: number;
        totalMarks: number;
        percent: number;
        createdAt: string;
    }[]>;
    private findOwnedAttempt;
    private markAnswer;
    private answerRecord;
    private publicAttempt;
    private publicAnswer;
}
