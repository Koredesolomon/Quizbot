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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    users;
    jwt;
    config;
    constructor(users, jwt, config) {
        this.users = users;
        this.jwt = jwt;
        this.config = config;
    }
    async onModuleInit() {
        await this.bootstrapConfiguredAdmin();
    }
    async register(input) {
        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await this.users.create({
            fullName: input.fullName,
            email: input.email,
            passwordHash,
            role: input.role,
        });
        return this.authResponse(user);
    }
    async login(input) {
        const user = await this.users.findByEmail(input.email);
        if (!user || !user.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException("Invalid email or password.");
        }
        return this.authResponse(user);
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
        const user = await this.users.findOrCreateGoogleUser({
            fullName: profile.name ?? email,
            email,
            avatarUrl: profile.picture,
            role,
        });
        return this.authResponse(user);
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
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map