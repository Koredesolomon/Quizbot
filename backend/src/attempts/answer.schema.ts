import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type AnswerDocument = HydratedDocument<Answer>;
export type PartResult = {
  label: string;
  answer: string;
  marks: number;
  awarded: number;
  correct: boolean;
  aiFeedback: string;
  feedbackSource: "ai" | "keyword" | "auto";
};

@Schema({ timestamps: true })
export class Answer {
  @Prop({ type: Types.ObjectId, ref: "Attempt", required: true })
  attemptId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Question", required: true })
  questionId: Types.ObjectId;

  @Prop({ default: "" })
  answer: string;

  @Prop({ default: 0 })
  awarded: number;

  @Prop({ default: false })
  correct: boolean;

  @Prop({ required: true })
  aiFeedback: string;

  @Prop({ enum: ["ai", "keyword", "auto"], default: "auto" })
  feedbackSource: "ai" | "keyword" | "auto";

  @Prop({ type: [Object], default: undefined })
  partResults?: PartResult[];

  createdAt: Date;
  updatedAt: Date;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);
