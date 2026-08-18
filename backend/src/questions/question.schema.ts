import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type QuestionType = "objective" | "theory";
export type QuestionDocument = HydratedDocument<Question>;

@Schema({ timestamps: true })
export class Question {
  @Prop({ enum: ["objective", "theory"], required: true })
  type: QuestionType;

  @Prop({ required: true, trim: true })
  topic: string;

  @Prop({ required: true, trim: true })
  prompt: string;

  @Prop({ type: [String], default: undefined })
  options?: string[];

  @Prop({ required: true, trim: true })
  answer: string;

  @Prop({ required: true, trim: true })
  explanation: string;

  @Prop({ required: true, min: 1 })
  marks: number;

  @Prop({ type: [String], default: undefined })
  keywords?: string[];

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
