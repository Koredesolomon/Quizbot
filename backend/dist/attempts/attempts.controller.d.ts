import type { JwtUser } from "../common/jwt-user.type";
import { AttemptsService } from "./attempts.service";
import { SubmitAttemptDto } from "./dto";
export declare class AttemptsController {
    private readonly attempts;
    constructor(attempts: AttemptsService);
    start(user: JwtUser): import("../store.service").AttemptRecord;
    submit(id: string, body: SubmitAttemptDto, user: JwtUser): {
        attempt: import("../store.service").AttemptRecord;
        answers: import("../store.service").AnswerRecord[];
    };
    mine(user: JwtUser): import("../store.service").AttemptRecord[];
}
