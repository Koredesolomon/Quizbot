import { AnswerRecord, AttemptRecord, StoreService } from "../store.service";
import { QuestionsService } from "../questions/questions.service";
import { SubmitAnswerDto } from "./dto";
export declare class AttemptsService {
    private readonly store;
    private readonly questions;
    constructor(store: StoreService, questions: QuestionsService);
    start(studentId: string): AttemptRecord;
    submit(attemptId: string, studentId: string, answers: SubmitAnswerDto[]): {
        attempt: AttemptRecord;
        answers: AnswerRecord[];
    };
    myAttempts(studentId: string): AttemptRecord[];
    allAttempts(): AttemptRecord[];
    private findOwnedAttempt;
    private markAnswer;
    private answerRecord;
}
