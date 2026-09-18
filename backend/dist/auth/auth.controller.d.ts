import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import type { JwtUser } from "../common/jwt-user.type";
import type { UserRole } from "../common/user-role.type";
import { AuthService } from "./auth.service";
import { ForgotPasswordDto, LoginDto, RegisterCourseDto, RegisterDto, ResetPasswordDto, UpdateProfileDto } from "./dto";
type UploadedProfileImage = {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
};
export declare class AuthController {
    private readonly auth;
    private readonly config;
    constructor(auth: AuthService, config: ConfigService);
    registerAdmin(body: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            username: string | undefined;
            avatarUrl: string | undefined;
            role: UserRole;
            authProvider: import("../users/user.schema").AuthProvider;
            registeredCourses: string[];
            createdAt: string;
        };
    }>;
    registerStudent(body: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            username: string | undefined;
            avatarUrl: string | undefined;
            role: UserRole;
            authProvider: import("../users/user.schema").AuthProvider;
            registeredCourses: string[];
            createdAt: string;
        };
    }>;
    login(body: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            username: string | undefined;
            avatarUrl: string | undefined;
            role: UserRole;
            authProvider: import("../users/user.schema").AuthProvider;
            registeredCourses: string[];
            createdAt: string;
        };
    }>;
    forgotPassword(body: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(body: ResetPasswordDto): Promise<{
        message: string;
    }>;
    updateProfile(user: JwtUser, body: UpdateProfileDto): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string;
            username: string | undefined;
            avatarUrl: string | undefined;
            role: UserRole;
            authProvider: import("../users/user.schema").AuthProvider;
            registeredCourses: string[];
            createdAt: string;
        };
    }>;
    registerCourse(user: JwtUser, body: RegisterCourseDto): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string;
            username: string | undefined;
            avatarUrl: string | undefined;
            role: UserRole;
            authProvider: import("../users/user.schema").AuthProvider;
            registeredCourses: string[];
            createdAt: string;
        };
    }>;
    uploadProfileAvatar(user: JwtUser, file: UploadedProfileImage | undefined): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string;
            username: string | undefined;
            avatarUrl: string | undefined;
            role: UserRole;
            authProvider: import("../users/user.schema").AuthProvider;
            registeredCourses: string[];
            createdAt: string;
        };
    }>;
    removeProfileAvatar(user: JwtUser): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string;
            username: string | undefined;
            avatarUrl: string | undefined;
            role: UserRole;
            authProvider: import("../users/user.schema").AuthProvider;
            registeredCourses: string[];
            createdAt: string;
        };
    }>;
    googleLogin(role: UserRole, response: Response): void;
    googleCallback(role: UserRole, code: string | undefined, error: string | undefined, response: Response): Promise<void>;
    private googleRedirect;
    private isGoogleRole;
}
export {};
