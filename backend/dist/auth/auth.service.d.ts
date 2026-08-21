import { OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { UserRole } from "../common/user-role.type";
import { UsersService } from "../users/users.service";
export declare class AuthService implements OnModuleInit {
    private readonly users;
    private readonly jwt;
    private readonly config;
    constructor(users: UsersService, jwt: JwtService, config: ConfigService);
    onModuleInit(): Promise<void>;
    register(input: {
        fullName: string;
        email: string;
        password: string;
        role: UserRole;
    }): Promise<{
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
    login(input: {
        email: string;
        password: string;
    }): Promise<{
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
    getGoogleAuthorizationUrl(role: UserRole): string;
    getGoogleAdminAuthorizationUrl(): string;
    loginGoogle(code: string, role: UserRole): Promise<{
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
    loginGoogleAdmin(code: string): Promise<{
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
    private authResponse;
    private googleRedirectUri;
    private assertGoogleAdminAllowed;
    private requiredConfig;
    private bootstrapConfiguredAdmin;
}
