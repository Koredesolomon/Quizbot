export declare class RegisterDto {
    fullName: string;
    email: string;
    password: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RegisterWithRoleDto extends RegisterDto {
    role: "admin" | "student";
}
