import type { JwtUser } from "../common/jwt-user.type";
import { AttemptsService } from "./attempts.service";
import { SubmitAttemptDto } from "./dto";
export declare class AttemptsController {
    private readonly attempts;
    constructor(attempts: AttemptsService);
    start(user: JwtUser): Promise<{
        id: string;
        studentId: string;
        studentName: string | undefined;
        studentEmail: string | undefined;
        status: import("./attempt.schema").AttemptStatus;
        startedAt: string;
        submittedAt: string | undefined;
        score: number;
        totalMarks: number;
        percent: number;
        aiSummary: string | undefined;
        createdAt: string;
    }>;
    submit(id: string, body: SubmitAttemptDto, user: JwtUser): Promise<{
        attempt: {
            id: string;
            studentId: string;
            studentName: string | undefined;
            studentEmail: string | undefined;
            status: import("./attempt.schema").AttemptStatus;
            startedAt: string;
            submittedAt: string | undefined;
            score: number;
            totalMarks: number;
            percent: number;
            aiSummary: string | undefined;
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
    mine(user: JwtUser): Promise<{
        id: string;
        studentId: string;
        studentName: string | undefined;
        studentEmail: string | undefined;
        status: import("./attempt.schema").AttemptStatus;
        startedAt: string;
        submittedAt: string | undefined;
        score: number;
        totalMarks: number;
        percent: number;
        aiSummary: string | undefined;
        createdAt: string;
    }[]>;
}
