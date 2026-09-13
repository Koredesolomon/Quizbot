import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
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
