import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "@nestjs/mapped-types";

export class CreateQuestionDto {
  @IsIn(["objective", "multiple", "theory"])
  type: "objective" | "multiple" | "theory";

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  moduleId?: string;

  @IsOptional()
  @IsString()
  subtopicId?: string;

  @IsOptional()
  @IsString()
  quizId?: string;

  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsBoolean()
  answerBox?: boolean;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsIn(["numeric", "expression", "text"])
  answerType?: "numeric" | "expression" | "text";

  @IsOptional()
  @IsString()
  referenceSolution?: string;

  @IsOptional()
  @IsIn(["pending", "verified", "needs_review"])
  solutionStatus?: "pending" | "verified" | "needs_review";

  @IsInt()
  @Min(1)
  marks: number;

  @IsOptional()
  @IsIn(["easy", "medium", "hard"])
  difficulty?: "easy" | "medium" | "hard";

  @IsOptional()
  @IsString()
  learningObjective?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rubricPoints?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  commonMistakes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}

export class ImportQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
