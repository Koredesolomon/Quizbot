import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
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

  @Get("google/admin")
  googleAdminLogin(@Res() response: Response) {
    return response.redirect(this.auth.getGoogleAdminAuthorizationUrl());
  }

  @Get("google/admin/callback")
  async googleAdminCallback(
    @Query("code") code: string | undefined,
    @Query("error") error: string | undefined,
    @Res() response: Response
  ) {
    const frontendUrl = this.config.get<string>("FRONTEND_ORIGIN") ?? "http://localhost:3000";

    if (error || !code) {
      return response.redirect(this.googleAdminRedirect(frontendUrl, { error: error ?? "missing_code" }));
    }

    try {
      const result = await this.auth.loginGoogleAdmin(code);
      return response.redirect(
        this.googleAdminRedirect(frontendUrl, {
          accessToken: result.accessToken,
          email: result.user.email,
          name: result.user.fullName,
        })
      );
    } catch (callbackError) {
      const message = callbackError instanceof Error ? callbackError.message : "Google login failed.";
      return response.redirect(this.googleAdminRedirect(frontendUrl, { error: message }));
    }
  }

  private googleAdminRedirect(frontendUrl: string, params: Record<string, string>) {
    const hash = new URLSearchParams({ adminGoogle: "1", ...params });
    return `${frontendUrl}/#${hash.toString()}`;
  }
}
