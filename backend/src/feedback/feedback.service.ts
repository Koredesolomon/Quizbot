import { Injectable, NotFoundException } from "@nestjs/common";
import { FeedbackRecord, StoreService } from "../store.service";
import { CreateFeedbackDto } from "./dto";

@Injectable()
export class FeedbackService {
  constructor(private readonly store: StoreService) {}

  create(studentId: string, input: CreateFeedbackDto) {
    const feedback: FeedbackRecord = {
      id: crypto.randomUUID(),
      studentId,
      rating: input.rating,
      message: input.message,
      status: "new",
      createdAt: new Date().toISOString(),
    };

    this.store.feedback.push(feedback);
    return feedback;
  }

  list() {
    return this.store.feedback;
  }

  markReviewed(id: string) {
    const feedback = this.store.feedback.find((item) => item.id === id);
    if (!feedback) throw new NotFoundException("Feedback not found.");

    feedback.status = "reviewed";
    return feedback;
  }
}
