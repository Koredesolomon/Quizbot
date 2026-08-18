import { AttemptsService } from "../attempts/attempts.service";
import { FeedbackService } from "../feedback/feedback.service";
import { QuestionsService } from "../questions/questions.service";
export declare class AdminController {
    private readonly attempts;
    private readonly feedback;
    private readonly questions;
    constructor(attempts: AttemptsService, feedback: FeedbackService, questions: QuestionsService);
    attemptsList(): Promise<{
        id: string;
        studentId: string;
        status: import("../attempts/attempt.schema").AttemptStatus;
        startedAt: string;
        submittedAt: string | undefined;
        score: number;
        totalMarks: number;
        percent: number;
        createdAt: string;
    }[]>;
    feedbackList(): Promise<{
        id: string;
        studentId: string;
        rating: number;
        message: string;
        status: import("../feedback/feedback.schema").FeedbackStatus;
        createdAt: string;
    }[]>;
    markFeedbackReviewed(id: string): Promise<{
        id: string;
        studentId: string;
        rating: number;
        message: string;
        status: import("../feedback/feedback.schema").FeedbackStatus;
        createdAt: string;
    }>;
    analytics(): Promise<{
        questions: number;
        totalMarks: number;
        attempts: number;
        activeStudents: number;
        completedAttempts: number;
        averageScore: number;
        unreadFeedback: number;
        watchlist: {
            id: string;
            studentId: string;
            status: import("../attempts/attempt.schema").AttemptStatus;
            startedAt: string;
            submittedAt: string | undefined;
            score: number;
            totalMarks: number;
            percent: number;
            createdAt: string;
        }[];
    }>;
}
