import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { UserRole } from "../store.service";
import { UsersService } from "../users/users.service";
export declare class AuthService {
    private readonly users;
    private readonly jwt;
    private readonly config;
    constructor(users: UsersService, jwt: JwtService, config: ConfigService);
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
            role: UserRole;
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
            role: UserRole;
            createdAt: string;
        };
    }>;
    getGoogleAdminAuthorizationUrl(): string;
    loginGoogleAdmin(code: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            role: UserRole;
            createdAt: string;
        };
    }>;
    private authResponse;
    private googleRedirectUri;
    private assertGoogleAdminAllowed;
    private requiredConfig;
}
