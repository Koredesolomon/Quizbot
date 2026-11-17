import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

/** objective: one correct option · multiple: MCQ with one or more correct options · theory: written answer */
export type QuestionType = "objective" | "multiple" | "theory";
/** How a written answer's final result is checked in code: a number, an algebraic expression, or free text. */
export type AnswerType = "numeric" | "expression" | "text";
export type SolutionStatus = "pending" | "verified" | "needs_review";
export type AnswerTable = import("../grading/answer-table").AnswerTable;
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type QuestionDocument = HydratedDocument<Question>;
export type QuestionPart = {
  label: string;
  prompt: string;
  answer: string;
  marks: number;
  explanation?: string;
  answerType?: AnswerType;
  answerTable?: AnswerTable;
  keywords?: string[];
  rubricPoints?: string[];
  commonMistakes?: string[];
  referenceSolution?: string;
};

@Schema({ timestamps: true })
export class Question {
  @Prop({ enum: ["objective", "multiple", "theory"], required: true })
  type: QuestionType;

  @Prop({ default: "Physics", trim: true })
  subject: string;

  @Prop({ trim: true })
  courseId?: string;

  @Prop({ trim: true })
  moduleId?: string;

  @Prop({ trim: true })
  subtopicId?: string;

  @Prop({ trim: true })
  quizId?: string;

  @Prop({ required: true, trim: true })
  topic: string;

  @Prop({ required: true, trim: true })
  prompt: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [String], default: undefined })
  options?: string[];

  /** Objective/MCQ only: students also explain their choice in an answer box. */
  @Prop()
  answerBox?: boolean;

  @Prop({ required: true, trim: true })
  answer: string;

  @Prop({ default: "", trim: true })
  explanation: string;

  /** Theory only. numeric and expression answers are checked by code; the AI only explains the verdict. */
  @Prop({ enum: ["numeric", "expression", "text"] })
  answerType?: AnswerType;

  /** Theory only: a table the student fills in. With correct cells, the cells are marked exactly by code; otherwise the AI marks the table with the written answer. */
  @Prop({ type: Object })
  answerTable?: AnswerTable;

  /** Theory subquestions, each with its own answer key and mark allocation. */
  @Prop({ type: [Object], default: undefined })
  parts?: QuestionPart[];

  /** Worked solution the AI explains against and students see after submitting. */
  @Prop({ trim: true })
  referenceSolution?: string;

  @Prop({ enum: ["pending", "verified", "needs_review"] })
  solutionStatus?: SolutionStatus;

  @Prop({ required: true, min: 1 })
  marks: number;

  @Prop({ enum: ["easy", "medium", "hard"], default: "medium" })
  difficulty: QuestionDifficulty;

  @Prop({ trim: true })
  learningObjective?: string;

  @Prop({ type: [String], default: undefined })
  rubricPoints?: string[];

  @Prop({ type: [String], default: undefined })
  commonMistakes?: string[];

  @Prop({ type: [String], default: undefined })
  keywords?: string[];

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
