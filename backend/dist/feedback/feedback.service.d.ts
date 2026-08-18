import { Model } from "mongoose";
import { CreateFeedbackDto } from "./dto";
import { FeedbackDocument } from "./feedback.schema";
export declare class FeedbackService {
    private readonly feedbackModel;
    constructor(feedbackModel: Model<FeedbackDocument>);
    create(studentId: string, input: CreateFeedbackDto): Promise<{
        id: string;
        studentId: string;
        rating: number;
        message: string;
        status: import("./feedback.schema").FeedbackStatus;
        createdAt: string;
    }>;
    list(): Promise<{
        id: string;
        studentId: string;
        rating: number;
        message: string;
        status: import("./feedback.schema").FeedbackStatus;
        createdAt: string;
    }[]>;
    markReviewed(id: string): Promise<{
        id: string;
        studentId: string;
        rating: number;
        message: string;
        status: import("./feedback.schema").FeedbackStatus;
        createdAt: string;
    }>;
    private publicFeedback;
}
