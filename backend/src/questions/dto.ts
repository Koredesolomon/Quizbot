import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min, registerDecorator, ValidateNested, type ValidationOptions } from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "@nestjs/mapped-types";

/** A list of rows, each a list of text cells. (`IsString({ each: true })` would test each whole row as one string.) */
function IsStringGrid(options?: ValidationOptions) {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: "isStringGrid",
      target: target.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) => Array.isArray(value) && value.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === "string")),
        defaultMessage: () => "solution must be a table of text cells",
      },
    });
}

export class AnswerTableDto {
  @IsOptional()
  @IsString()
  corner?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  columns: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  rows: string[];

  @IsOptional()
  @IsStringGrid()
  solution?: string[][];

  @IsOptional()
  @IsInt()
  @Min(1)
  tableMarks?: number;
}

export class QuestionPartDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsInt()
  @Min(1)
  marks: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsIn(["numeric", "expression", "text"])
  answerType?: "numeric" | "expression" | "text";

  @IsOptional()
  @ValidateNested()
  @Type(() => AnswerTableDto)
  answerTable?: AnswerTableDto;

  @IsOptional()
  @IsString()
  referenceSolution?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rubricPoints?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  commonMistakes?: string[];
}

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
  @ValidateNested()
  @Type(() => AnswerTableDto)
  answerTable?: AnswerTableDto | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => QuestionPartDto)
  parts?: QuestionPartDto[];

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
