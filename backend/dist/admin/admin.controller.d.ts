import { AttemptsService } from "../attempts/attempts.service";
import { FeedbackService } from "../feedback/feedback.service";
import { QuestionsService } from "../questions/questions.service";
export declare class AdminController {
    private readonly attempts;
    private readonly feedback;
    private readonly questions;
    constructor(attempts: AttemptsService, feedback: FeedbackService, questions: QuestionsService);
    attemptsList(): import("../store.service").AttemptRecord[];
    feedbackList(): import("../store.service").FeedbackRecord[];
    markFeedbackReviewed(id: string): import("../store.service").FeedbackRecord;
    analytics(): {
        questions: number;
        totalMarks: number;
        attempts: number;
        activeStudents: number;
        completedAttempts: number;
        averageScore: number;
        unreadFeedback: number;
        watchlist: import("../store.service").AttemptRecord[];
    };
}
