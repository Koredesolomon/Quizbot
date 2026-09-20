import { OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { UserRole } from "../common/user-role.type";
import { MailService } from "../mail/mail.service";
import { UsersService } from "../users/users.service";
type ProfileImageUpload = {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
};
export declare class AuthService implements OnModuleInit {
    private readonly users;
    private readonly jwt;
    private readonly config;
    private readonly mail;
    private readonly logger;
    constructor(users: UsersService, jwt: JwtService, config: ConfigService, mail: MailService);
    onModuleInit(): Promise<void>;
    register(input: {
        fullName: string;
        email: string;
        username?: string;
        password: string;
        role: UserRole;
    }): Promise<{
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
    login(input: {
        identifier: string;
        password: string;
    }): Promise<{
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
    private isConfiguredAdminEmail;
    private repairConfiguredAdminPasswordLogin;
    requestPasswordReset(input: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    resetPassword(input: {
        token: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
    updateProfile(userId: string, input: {
        avatarUrl?: string | null;
    }): Promise<{
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
    registerCourse(userId: string, input: {
        courseCode: string;
    }): Promise<{
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
    updateProfileAvatar(userId: string, file: ProfileImageUpload | undefined): Promise<{
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
    removeProfileAvatar(userId: string): Promise<{
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
    getGoogleAuthorizationUrl(role: UserRole): string;
    getGoogleAdminAuthorizationUrl(): string;
    loginGoogle(code: string, role: UserRole): Promise<{
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
    private sendWelcomeEmail;
    private sendPasswordResetEmail;
    loginGoogleAdmin(code: string): Promise<{
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
    private authResponse;
    private googleRedirectUri;
    private assertGoogleAdminAllowed;
    private requiredConfig;
    private profileImageExtension;
    private profileImageDirectory;
    private publicApiBaseUrl;
    private deleteUploadedProfileImage;
    private uploadedProfileImageFileName;
    private passwordResetTokenHash;
    private bootstrapConfiguredAdmin;
}
export {};
