export declare class RegisterDto {
    fullName: string;
    email: string;
    username?: string;
    password: string;
}
export declare class LoginDto {
    identifier?: string;
    email?: string;
    password: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    password: string;
}
export declare class RegisterWithRoleDto extends RegisterDto {
    role: "admin" | "student";
}
export declare class UpdateProfileDto {
    avatarUrl?: string | null;
}
export declare class RegisterCourseDto {
    courseCode: string;
}
