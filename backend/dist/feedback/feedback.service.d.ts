import { FeedbackRecord, StoreService } from "../store.service";
import { CreateFeedbackDto } from "./dto";
export declare class FeedbackService {
    private readonly store;
    constructor(store: StoreService);
    create(studentId: string, input: CreateFeedbackDto): FeedbackRecord;
    list(): FeedbackRecord[];
    markReviewed(id: string): FeedbackRecord;
}
