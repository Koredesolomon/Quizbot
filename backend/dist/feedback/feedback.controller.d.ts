import type { JwtUser } from "../common/jwt-user.type";
import { CreateFeedbackDto } from "./dto";
import { FeedbackService } from "./feedback.service";
export declare class FeedbackController {
    private readonly feedback;
    constructor(feedback: FeedbackService);
    create(user: JwtUser, body: CreateFeedbackDto): import("../store.service").FeedbackRecord;
}
