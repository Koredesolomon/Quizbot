import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateFeedbackDto } from "./dto";
import { Feedback, FeedbackDocument } from "./feedback.schema";

@Injectable()
export class FeedbackService {
  constructor(@InjectModel(Feedback.name) private readonly feedbackModel: Model<FeedbackDocument>) {}

  async create(studentId: string, input: CreateFeedbackDto) {
    const feedback = await this.feedbackModel.create({
      studentId: new Types.ObjectId(studentId),
      rating: input.rating,
      message: input.message,
      status: "new",
    });

    return this.publicFeedback(feedback);
  }

  async list() {
    const feedback = await this.feedbackModel.find().sort({ createdAt: -1 }).exec();
    return feedback.map((item) => this.publicFeedback(item));
  }

  async markReviewed(id: string) {
    const feedback = await this.feedbackModel.findByIdAndUpdate(id, { status: "reviewed" }, { new: true }).exec();
    if (!feedback) throw new NotFoundException("Feedback not found.");

    return this.publicFeedback(feedback);
  }

  private publicFeedback(feedback: FeedbackDocument) {
    return {
      id: feedback.id,
      studentId: feedback.studentId.toString(),
      rating: feedback.rating,
      message: feedback.message,
      status: feedback.status,
      createdAt: feedback.createdAt.toISOString(),
    };
  }
}
