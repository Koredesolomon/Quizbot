"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const mail_service_1 = require("../mail/mail.service");
const users_service_1 = require("../users/users.service");
let AuthService = AuthService_1 = class AuthService {
    users;
    jwt;
    config;
    mail;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(users, jwt, config, mail) {
        this.users = users;
        this.jwt = jwt;
        this.config = config;
        this.mail = mail;
    }
    async onModuleInit() {
        await this.bootstrapConfiguredAdmin();
    }
    async register(input) {
        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await this.users.createOrAttachPasswordUser({
            fullName: input.fullName,
            email: input.email,
            username: input.username,
            passwordHash,
            role: input.role,
        });
        await this.sendWelcomeEmail(user);
        return this.authResponse(user);
    }
    async login(input) {
        const user = await this.users.findByEmailOrUsername(input.identifier);
        if (!user) {
            throw new common_1.UnauthorizedException("Invalid email, username, or password.");
        }
        if (!user.passwordHash) {
            const repairedAdmin = await this.repairConfiguredAdminPasswordLogin(user, input.password);
            if (repairedAdmin) {
                return this.authResponse(repairedAdmin);
            }
            throw new common_1.UnauthorizedException("This account uses Google sign-in. Create a password account with this email first, or continue with Google.");
        }
        if (!(await bcrypt.compare(input.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException("Invalid email, username, or password.");
        }
        return this.authResponse(user);
    }
    async repairConfiguredAdminPasswordLogin(user, password) {
        const email = this.config.get("ADMIN_EMAIL")?.trim().toLowerCase();
        const adminPassword = this.config.get("ADMIN_PASSWORD")?.trim();
        const fullName = this.config.get("ADMIN_NAME")?.trim() || user.fullName || "STEM-JUPEB Admin";
        if (!email || !adminPassword || user.email.toLowerCase() !== email) {
            return null;
        }
        if (password !== adminPassword) {
            return null;
        }
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        return this.users.upsertPasswordAdmin({ fullName, email, passwordHash });
    }
    async requestPasswordReset(input) {
        const user = await this.users.findByEmail(input.email);
        if (!user) {
            throw new common_1.NotFoundException("Email does not exist.");
        }
        const token = (0, node_crypto_1.randomBytes)(32).toString("base64url");
        const tokenHash = this.passwordResetTokenHash(token);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.users.setPasswordResetToken(user.id, tokenHash, expiresAt);
        await this.sendPasswordResetEmail(user, token, expiresAt);
        return {
            message: "A password reset link has been sent.",
        };
    }
    async resetPassword(input) {
        const tokenHash = this.passwordResetTokenHash(input.token);
        const user = await this.users.findByValidPasswordResetToken(tokenHash);
        if (!user) {
            throw new common_1.BadRequestException("Reset link is invalid or expired.");
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        await this.users.updatePasswordAndClearReset(user.id, passwordHash);
        return {
            message: "Password updated. You can now sign in.",
        };
    }
    async updateProfile(userId, input) {
        const user = await this.users.updateProfile(userId, input);
        if (!user) {
            throw new common_1.NotFoundException("User account was not found.");
        }
        return {
            user: this.users.publicUser(user),
        };
    }
    async registerCourse(userId, input) {
        if (input.courseCode.trim().toUpperCase() !== "PHS 001") {
            throw new common_1.BadRequestException("This course is not available for registration yet.");
        }
        const user = await this.users.registerCourse(userId, input.courseCode);
        if (!user) {
            throw new common_1.NotFoundException("User account was not found.");
        }
        return {
            user: this.users.publicUser(user),
        };
    }
    async updateProfileAvatar(userId, file) {
        if (!file) {
            throw new common_1.BadRequestException("Choose an image to upload.");
        }
        const extension = this.profileImageExtension(file.mimetype);
        const user = await this.users.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException("User account was not found.");
        }
        const uploadsDirectory = this.profileImageDirectory();
        await (0, promises_1.mkdir)(uploadsDirectory, { recursive: true });
        const fileName = `${userId}-${Date.now()}${extension}`;
        await (0, promises_1.writeFile)((0, node_path_1.join)(uploadsDirectory, fileName), file.buffer);
        const previousAvatarUrl = user.avatarUrl;
        user.avatarUrl = `${this.publicApiBaseUrl()}/uploads/profile-images/${fileName}`;
        await user.save();
        await this.deleteUploadedProfileImage(previousAvatarUrl);
        return {
            user: this.users.publicUser(user),
        };
    }
    async removeProfileAvatar(userId) {
        const user = await this.users.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException("User account was not found.");
        }
        const previousAvatarUrl = user.avatarUrl;
        user.avatarUrl = undefined;
        await user.save();
        await this.deleteUploadedProfileImage(previousAvatarUrl);
        return {
            user: this.users.publicUser(user),
        };
    }
    getGoogleAuthorizationUrl(role) {
        const clientId = this.requiredConfig("GOOGLE_CLIENT_ID");
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: this.googleRedirectUri(role),
            response_type: "code",
            scope: "openid email profile",
            prompt: "select_account",
            state: role,
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
    getGoogleAdminAuthorizationUrl() {
        return this.getGoogleAuthorizationUrl("admin");
    }
    async loginGoogle(code, role) {
        const clientId = this.requiredConfig("GOOGLE_CLIENT_ID");
        const clientSecret = this.requiredConfig("GOOGLE_CLIENT_SECRET");
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: this.googleRedirectUri(role),
                grant_type: "authorization_code",
            }),
        });
        const tokens = (await tokenResponse.json());
        if (!tokenResponse.ok || !tokens.id_token) {
            throw new common_1.UnauthorizedException(tokens.error_description ?? "Google login failed.");
        }
        const profileResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`);
        const profile = (await profileResponse.json());
        if (!profileResponse.ok || profile.aud !== clientId || !profile.email) {
            throw new common_1.UnauthorizedException(profile.error_description ?? "Google profile could not be verified.");
        }
        if (profile.email_verified !== true && profile.email_verified !== "true") {
            throw new common_1.UnauthorizedException("Google email address is not verified.");
        }
        const email = profile.email.toLowerCase();
        if (role === "admin") {
            this.assertGoogleAdminAllowed(email, profile.hd);
        }
        const existingUser = await this.users.findByEmail(email);
        if (existingUser && existingUser.role !== role && role === "student") {
            throw new common_1.UnauthorizedException("Use the admin Google sign-in for this account.");
        }
        const user = await this.users.findOrCreateGoogleUser({
            fullName: profile.name ?? email,
            email,
            avatarUrl: profile.picture,
            role,
        });
        if (!existingUser) {
            await this.sendWelcomeEmail(user);
        }
        return this.authResponse(user);
    }
    async sendWelcomeEmail(user) {
        try {
            await this.mail.sendWelcomeEmail({
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Welcome email could not be sent to ${user.email}: ${message}`);
        }
    }
    async sendPasswordResetEmail(user, token, expiresAt) {
        try {
            await this.mail.sendPasswordResetEmail({
                fullName: user.fullName,
                email: user.email,
                token,
                expiresAt,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Password reset email could not be sent to ${user.email}: ${message}`);
        }
    }
    async loginGoogleAdmin(code) {
        return this.loginGoogle(code, "admin");
    }
    authResponse(user) {
        const token = this.jwt.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            accessToken: token,
            user: this.users.publicUser(user),
        };
    }
    googleRedirectUri(role) {
        const configuredRedirectUri = this.config.get(role === "admin" ? "GOOGLE_ADMIN_REDIRECT_URI" : "GOOGLE_STUDENT_REDIRECT_URI");
        if (configuredRedirectUri)
            return configuredRedirectUri;
        return (this.config.get("GOOGLE_REDIRECT_URI") ??
            `${this.config.get("API_BASE_URL") ?? "http://localhost:4000"}/auth/google/${role}/callback`);
    }
    assertGoogleAdminAllowed(email, hostedDomain) {
        const allowedEmails = (this.config.get("GOOGLE_ADMIN_EMAILS") ?? "")
            .split(",")
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean);
        const allowedDomains = (this.config.get("GOOGLE_ADMIN_DOMAINS") ?? "")
            .split(",")
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean);
        const emailDomain = email.split("@")[1];
        if (allowedEmails.includes(email))
            return;
        if (emailDomain && allowedDomains.includes(emailDomain))
            return;
        if (hostedDomain && allowedDomains.includes(hostedDomain.toLowerCase()))
            return;
        throw new common_1.UnauthorizedException("This Google account is not allowed to access the admin dashboard.");
    }
    requiredConfig(key) {
        const value = this.config.get(key);
        if (!value) {
            throw new common_1.UnauthorizedException(`${key} is not configured.`);
        }
        return value;
    }
    profileImageExtension(mimetype) {
        const extensions = {
            "image/gif": ".gif",
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        };
        const extension = extensions[mimetype];
        if (!extension) {
            throw new common_1.BadRequestException("Upload a PNG, JPG, WEBP, or GIF image.");
        }
        return extension;
    }
    profileImageDirectory() {
        return (0, node_path_1.join)(process.cwd(), "uploads", "profile-images");
    }
    publicApiBaseUrl() {
        return (this.config.get("API_PUBLIC_URL") ??
            this.config.get("API_BASE_URL") ??
            `http://localhost:${this.config.get("PORT") ?? 4000}`).replace(/\/$/, "");
    }
    async deleteUploadedProfileImage(avatarUrl) {
        const fileName = this.uploadedProfileImageFileName(avatarUrl);
        if (!fileName)
            return;
        try {
            await (0, promises_1.unlink)((0, node_path_1.join)(this.profileImageDirectory(), fileName));
        }
        catch {
        }
    }
    uploadedProfileImageFileName(avatarUrl) {
        const marker = "/uploads/profile-images/";
        const markerIndex = avatarUrl?.indexOf(marker) ?? -1;
        if (markerIndex === -1 || !avatarUrl)
            return null;
        const fileName = decodeURIComponent(avatarUrl.slice(markerIndex + marker.length).split(/[?#]/)[0] ?? "");
        if (!fileName || fileName.includes("/") || fileName.includes("\\"))
            return null;
        return fileName;
    }
    passwordResetTokenHash(token) {
        return (0, node_crypto_1.createHash)("sha256").update(token).digest("hex");
    }
    async bootstrapConfiguredAdmin() {
        const email = this.config.get("ADMIN_EMAIL")?.trim().toLowerCase();
        const password = this.config.get("ADMIN_PASSWORD")?.trim();
        const fullName = this.config.get("ADMIN_NAME")?.trim() || "STEM-JUPEB Admin";
        if (!email && !password)
            return;
        if (!email || !password) {
            console.warn("ADMIN_EMAIL and ADMIN_PASSWORD must both be set to seed the admin account.");
            return;
        }
        const passwordHash = await bcrypt.hash(password, 10);
        await this.users.upsertPasswordAdmin({ fullName, email, passwordHash });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map