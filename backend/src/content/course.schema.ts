import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type CourseDocument = HydratedDocument<Course>;

@Schema({ _id: true, timestamps: true })
export class CourseQuiz {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: 10, min: 1 })
  timeLimitMinutes: number;

  @Prop({ default: 1, min: 1 })
  attemptsAllowed: number;

  @Prop({ default: 50, min: 0, max: 100 })
  passingPercent: number;
}

@Schema({ _id: true, timestamps: true })
export class CourseTopic {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [CourseQuiz], default: [] })
  quizzes: CourseQuiz[];
}

@Schema({ _id: true, timestamps: true })
export class CourseModule {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [CourseTopic], default: [] })
  topics: CourseTopic[];
}

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  code: string;

  @Prop({ default: "Physics", trim: true })
  subject: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ enum: ["draft", "published"], default: "draft" })
  status: "draft" | "published";

  @Prop({ type: [CourseModule], default: [] })
  modules: CourseModule[];

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
