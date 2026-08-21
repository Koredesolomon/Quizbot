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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
let AuthController = class AuthController {
    auth;
    config;
    constructor(auth, config) {
        this.auth = auth;
        this.config = config;
    }
    registerAdmin(body) {
        return this.auth.register({ ...body, role: "admin" });
    }
    registerStudent(body) {
        return this.auth.register({ ...body, role: "student" });
    }
    login(body) {
        return this.auth.login(body);
    }
    googleLogin(role, response) {
        const frontendUrl = this.config.get("FRONTEND_ORIGIN") ?? "http://localhost:3000";
        if (!this.isGoogleRole(role)) {
            return response.redirect(this.googleRedirect(frontendUrl, "student", { error: "Invalid Google login role." }));
        }
        try {
            return response.redirect(this.auth.getGoogleAuthorizationUrl(role));
        }
        catch (loginError) {
            const message = loginError instanceof Error ? loginError.message : "Google login is not configured.";
            return response.redirect(this.googleRedirect(frontendUrl, role, { error: message }));
        }
    }
    async googleCallback(role, code, error, response) {
        const frontendUrl = this.config.get("FRONTEND_ORIGIN") ?? "http://localhost:3000";
        if (!this.isGoogleRole(role)) {
            return response.redirect(this.googleRedirect(frontendUrl, "student", { error: "Invalid Google login role." }));
        }
        if (error || !code) {
            return response.redirect(this.googleRedirect(frontendUrl, role, { error: error ?? "missing_code" }));
        }
        try {
            const result = await this.auth.loginGoogle(code, role);
            return response.redirect(this.googleRedirect(frontendUrl, role, {
                accessToken: result.accessToken,
                id: result.user.id,
                email: result.user.email,
                name: result.user.fullName,
                avatarUrl: result.user.avatarUrl ?? "",
                authProvider: result.user.authProvider,
                createdAt: result.user.createdAt,
            }));
        }
        catch (callbackError) {
            const message = callbackError instanceof Error ? callbackError.message : "Google login failed.";
            return response.redirect(this.googleRedirect(frontendUrl, role, { error: message }));
        }
    }
    googleRedirect(frontendUrl, role, params) {
        const hash = new URLSearchParams({ authGoogle: "1", role, ...params });
        return `${frontendUrl}/#${hash.toString()}`;
    }
    isGoogleRole(role) {
        return role === "admin" || role === "student";
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("register-admin"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "registerAdmin", null);
__decorate([
    (0, common_1.Post)("register-student"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "registerStudent", null);
__decorate([
    (0, common_1.Post)("login"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)("google/:role"),
    __param(0, (0, common_1.Param)("role")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleLogin", null);
__decorate([
    (0, common_1.Get)("google/:role/callback"),
    __param(0, (0, common_1.Param)("role")),
    __param(1, (0, common_1.Query)("code")),
    __param(2, (0, common_1.Query)("error")),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map