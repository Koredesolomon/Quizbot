import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { QuestionSchema, type QuestionDocument } from "../questions/question.schema";
import { AnswerSchema, type AnswerDocument } from "./answer.schema";

export type AttemptStatus = "active" | "completed";
export type AttemptDocument = HydratedDocument<Attempt>;

@Schema({ timestamps: true })
export class Attempt {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  studentId: Types.ObjectId;

  @Prop({ trim: true })
  quizId?: string;

  @Prop({ trim: true })
  courseId?: string;

  @Prop({ type: [QuestionSchema], select: false, default: undefined })
  questionSnapshots?: QuestionDocument[];

  @Prop({ type: [AnswerSchema], select: false, default: undefined })
  gradedAnswers?: AnswerDocument[];

  @Prop({ select: false })
  submissionToken?: string;

  @Prop({ select: false })
  submissionStartedAt?: Date;

  @Prop({ default: 0 })
  questionCount: number;

  @Prop({ default: 0 })
  answeredCount: number;

  @Prop({ enum: ["active", "completed"], default: "active" })
  status: AttemptStatus;

  @Prop({ required: true })
  startedAt: Date;

  @Prop()
  submittedAt?: Date;

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: 0 })
  totalMarks: number;

  @Prop({ default: 0 })
  percent: number;

  @Prop()
  aiSummary?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const AttemptSchema = SchemaFactory.createForClass(Attempt);
