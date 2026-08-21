import type { JwtUser } from "../common/jwt-user.type";
import { CreateFeedbackDto } from "./dto";
import { FeedbackService } from "./feedback.service";
export declare class FeedbackController {
    private readonly feedback;
    constructor(feedback: FeedbackService);
    create(user: JwtUser, body: CreateFeedbackDto): Promise<{
        id: string;
        studentId: string;
        studentName: string | undefined;
        studentEmail: string | undefined;
        rating: number;
        message: string;
        status: import("./feedback.schema").FeedbackStatus;
        createdAt: string;
    }>;
}
