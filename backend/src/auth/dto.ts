import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,24}$/, {
    message: "Username must be 3-24 characters and can only contain letters, numbers, and underscores.",
  })
  username?: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  identifier?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterWithRoleDto extends RegisterDto {
  @IsIn(["admin", "student"])
  role: "admin" | "student";
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  avatarUrl?: string | null;
}

export class RegisterCourseDto {
  @IsString()
  @IsNotEmpty()
  courseCode: string;
}
