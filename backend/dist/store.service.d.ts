export type UserRole = "admin" | "student";
export type UserRecord = {
    id: string;
    fullName: string;
    email: string;
    passwordHash?: string;
    authProvider?: "password" | "google";
    role: UserRole;
    createdAt: string;
};
export type QuestionRecord = {
    id: string;
    type: "objective" | "theory";
    topic: string;
    prompt: string;
    options?: string[];
    answer: string;
    explanation: string;
    marks: number;
    keywords?: string[];
    createdBy: string;
    createdAt: string;
};
export type AttemptRecord = {
    id: string;
    studentId: string;
    status: "active" | "completed";
    startedAt: string;
    submittedAt?: string;
    score: number;
    totalMarks: number;
    percent: number;
};
export type AnswerRecord = {
    id: string;
    attemptId: string;
    questionId: string;
    answer: string;
    awarded: number;
    correct: boolean;
    aiFeedback: string;
};
export type FeedbackRecord = {
    id: string;
    studentId: string;
    rating: number;
    message: string;
    status: "new" | "reviewed";
    createdAt: string;
};
export declare class StoreService {
    users: UserRecord[];
    questions: QuestionRecord[];
    attempts: AttemptRecord[];
    answers: AnswerRecord[];
    feedback: FeedbackRecord[];
}
