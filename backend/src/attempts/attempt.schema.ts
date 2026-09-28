import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type AttemptStatus = "active" | "completed";
export type AttemptDocument = HydratedDocument<Attempt>;

@Schema({ timestamps: true })
export class Attempt {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  studentId: Types.ObjectId;

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
