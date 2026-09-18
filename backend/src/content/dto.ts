import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, Min } from "class-validator";

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(["draft", "published"])
  status?: "draft" | "published";
}

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  videoUrl?: string;

  @IsOptional()
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  materialUrl?: string;
}

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  timeLimitMinutes: number;

  @IsInt()
  @Min(1)
  attemptsAllowed: number;

  @IsInt()
  @Min(0)
  @Max(100)
  passingPercent: number;
}
