import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
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
            role: import("../store.service").UserRole;
            createdAt: string;
        };
    }>;
    registerStudent(body: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            role: import("../store.service").UserRole;
            createdAt: string;
        };
    }>;
    login(body: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            role: import("../store.service").UserRole;
            createdAt: string;
        };
    }>;
    googleAdminLogin(response: Response): void;
    googleAdminCallback(code: string | undefined, error: string | undefined, response: Response): Promise<void>;
    private googleAdminRedirect;
}
