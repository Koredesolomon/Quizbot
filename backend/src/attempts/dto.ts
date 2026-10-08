import { ArrayMaxSize, ArrayUnique, IsArray, IsMongoId, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class StartAttemptDto {
  @IsMongoId()
  quizId: string;
}

export class SubmitAnswerDto {
  @IsMongoId()
  questionId: string;

  @IsString()
  answer: string;
}

export class SubmitAttemptDto {
  @IsArray()
  @ArrayMaxSize(1000)
  @ArrayUnique((answer: SubmitAnswerDto) => answer.questionId)
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];
}
