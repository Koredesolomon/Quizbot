import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import type { UserRole } from "../common/user-role.type";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService
  ) {}

  @Post("register-admin")
  registerAdmin(@Body() body: RegisterDto) {
    return this.auth.register({ ...body, role: "admin" });
  }

  @Post("register-student")
  registerStudent(@Body() body: RegisterDto) {
    return this.auth.register({ ...body, role: "student" });
  }

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  @Get("google/:role")
  googleLogin(@Param("role") role: UserRole, @Res() response: Response) {
    const frontendUrl = this.config.get<string>("FRONTEND_ORIGIN") ?? "http://localhost:3000";
    if (!this.isGoogleRole(role)) {
      return response.redirect(this.googleRedirect(frontendUrl, "student", { error: "Invalid Google login role." }));
    }

    try {
      return response.redirect(this.auth.getGoogleAuthorizationUrl(role));
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Google login is not configured.";
      return response.redirect(this.googleRedirect(frontendUrl, role, { error: message }));
    }
  }

  @Get("google/:role/callback")
  async googleCallback(
    @Param("role") role: UserRole,
    @Query("code") code: string | undefined,
    @Query("error") error: string | undefined,
    @Res() response: Response
  ) {
    const frontendUrl = this.config.get<string>("FRONTEND_ORIGIN") ?? "http://localhost:3000";
    if (!this.isGoogleRole(role)) {
      return response.redirect(this.googleRedirect(frontendUrl, "student", { error: "Invalid Google login role." }));
    }

    if (error || !code) {
      return response.redirect(this.googleRedirect(frontendUrl, role, { error: error ?? "missing_code" }));
    }

    try {
      const result = await this.auth.loginGoogle(code, role);
      return response.redirect(
        this.googleRedirect(frontendUrl, role, {
          accessToken: result.accessToken,
          id: result.user.id,
          email: result.user.email,
          name: result.user.fullName,
          avatarUrl: result.user.avatarUrl ?? "",
          authProvider: result.user.authProvider,
          createdAt: result.user.createdAt,
        })
      );
    } catch (callbackError) {
      const message = callbackError instanceof Error ? callbackError.message : "Google login failed.";
      return response.redirect(this.googleRedirect(frontendUrl, role, { error: message }));
    }
  }

  private googleRedirect(frontendUrl: string, role: UserRole, params: Record<string, string>) {
    const hash = new URLSearchParams({ authGoogle: "1", role, ...params });
    return `${frontendUrl}/#${hash.toString()}`;
  }

  private isGoogleRole(role: string): role is UserRole {
    return role === "admin" || role === "student";
  }
}
