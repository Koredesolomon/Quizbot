import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import type { UserRole } from "../common/user-role.type";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";
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
            avatarUrl: string | undefined;
            role: UserRole;
            authProvider: import("../users/user.schema").AuthProvider;
            createdAt: string;
        };
    }>;
    registerStudent(body: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            avatarUrl: string | undefined;
            role: UserRole;
            authProvider: import("../users/user.schema").AuthProvider;
            createdAt: string;
        };
    }>;
    login(body: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            avatarUrl: string | undefined;
            role: UserRole;
            authProvider: import("../users/user.schema").AuthProvider;
            createdAt: string;
        };
    }>;
    googleLogin(role: UserRole, response: Response): void;
    googleCallback(role: UserRole, code: string | undefined, error: string | undefined, response: Response): Promise<void>;
    private googleRedirect;
    private isGoogleRole;
}
