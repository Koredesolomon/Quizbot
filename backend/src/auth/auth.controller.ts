import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { CurrentUser } from "../common/current-user.decorator";
import type { JwtUser } from "../common/jwt-user.type";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import type { UserRole } from "../common/user-role.type";
import { AuthService } from "./auth.service";
import { ForgotPasswordDto, LoginDto, RegisterCourseDto, RegisterDto, ResetPasswordDto, UpdateProfileDto } from "./dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

type UploadedProfileImage = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
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
    const identifier = body.identifier ?? body.email;

    if (!identifier) {
      throw new BadRequestException("Enter your email address or username.");
    }

    return this.auth.login({ identifier, password: body.password });
  }

  @Post("forgot-password")
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.auth.requestPasswordReset(body);
  }

  @Post("reset-password")
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me/profile")
  updateProfile(@CurrentUser() user: JwtUser, @Body() body: UpdateProfileDto) {
    return this.auth.updateProfile(user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post("me/courses")
  registerCourse(@CurrentUser() user: JwtUser, @Body() body: RegisterCourseDto) {
    return this.auth.registerCourse(user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("avatar", { limits: { fileSize: 2 * 1024 * 1024 } }))
  @Post("me/profile/avatar")
  uploadProfileAvatar(@CurrentUser() user: JwtUser, @UploadedFile() file: UploadedProfileImage | undefined) {
    return this.auth.updateProfileAvatar(user.sub, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("me/profile/avatar")
  removeProfileAvatar(@CurrentUser() user: JwtUser) {
    return this.auth.removeProfileAvatar(user.sub);
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
          username: result.user.username ?? "",
          name: result.user.fullName,
          avatarUrl: result.user.avatarUrl ?? "",
          authProvider: result.user.authProvider,
          createdAt: result.user.createdAt,
          userRole: result.user.role,
          registeredCourses: result.user.registeredCourses.join(","),
        })
      );
    } catch (callbackError) {
      const message = callbackError instanceof Error ? callbackError.message : "Google login failed.";
      return response.redirect(this.googleRedirect(frontendUrl, role, { error: message }));
    }
  }

  private googleRedirect(frontendUrl: string, role: UserRole, params: Record<string, string>) {
    const hash = new URLSearchParams({ authGoogle: "1", role, ...params });
    const path = role === "admin" ? "/admin" : "/";
    return `${frontendUrl}${path}#${hash.toString()}`;
  }

  private isGoogleRole(role: string): role is UserRole {
    return role === "admin" || role === "student";
  }
}
