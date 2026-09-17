import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { UserRole } from "../common/user-role.type";
import { MailService } from "../mail/mail.service";
import type { UserDocument } from "../users/user.schema";
import { UsersService } from "../users/users.service";

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleProfileResponse = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  hd?: string;
  error?: string;
  error_description?: string;
};

type ProfileImageUpload = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService
  ) {}

  async onModuleInit() {
    await this.bootstrapConfiguredAdmin();
  }

  async register(input: { fullName: string; email: string; password: string; role: UserRole }) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.users.createOrAttachPasswordUser({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: input.role,
    });
    await this.sendWelcomeEmail(user);

    return this.authResponse(user);
  }

  async login(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException("This account uses Google sign-in. Create a password account with this email first, or continue with Google.");
    }

    if (!(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    return this.authResponse(user);
  }

  async updateProfile(userId: string, input: { avatarUrl?: string | null }) {
    const user = await this.users.updateProfile(userId, input);
    if (!user) {
      throw new NotFoundException("User account was not found.");
    }

    return {
      user: this.users.publicUser(user),
    };
  }

  async updateProfileAvatar(userId: string, file: ProfileImageUpload | undefined) {
    if (!file) {
      throw new BadRequestException("Choose an image to upload.");
    }

    const extension = this.profileImageExtension(file.mimetype);
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException("User account was not found.");
    }

    const uploadsDirectory = this.profileImageDirectory();
    await mkdir(uploadsDirectory, { recursive: true });

    const fileName = `${userId}-${Date.now()}${extension}`;
    await writeFile(join(uploadsDirectory, fileName), file.buffer);

    const previousAvatarUrl = user.avatarUrl;
    user.avatarUrl = `${this.publicApiBaseUrl()}/uploads/profile-images/${fileName}`;
    await user.save();
    await this.deleteUploadedProfileImage(previousAvatarUrl);

    return {
      user: this.users.publicUser(user),
    };
  }

  async removeProfileAvatar(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException("User account was not found.");
    }

    const previousAvatarUrl = user.avatarUrl;
    user.avatarUrl = undefined;
    await user.save();
    await this.deleteUploadedProfileImage(previousAvatarUrl);

    return {
      user: this.users.publicUser(user),
    };
  }

  getGoogleAuthorizationUrl(role: UserRole) {
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

  async loginGoogle(code: string, role: UserRole) {
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
    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

    if (!tokenResponse.ok || !tokens.id_token) {
      throw new UnauthorizedException(tokens.error_description ?? "Google login failed.");
    }

    const profileResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`
    );
    const profile = (await profileResponse.json()) as GoogleProfileResponse;

    if (!profileResponse.ok || profile.aud !== clientId || !profile.email) {
      throw new UnauthorizedException(profile.error_description ?? "Google profile could not be verified.");
    }

    if (profile.email_verified !== true && profile.email_verified !== "true") {
      throw new UnauthorizedException("Google email address is not verified.");
    }

    const email = profile.email.toLowerCase();
    if (role === "admin") {
      this.assertGoogleAdminAllowed(email, profile.hd);
    }

    const existingUser = await this.users.findByEmail(email);
    if (existingUser && existingUser.role !== role && role === "student") {
      throw new UnauthorizedException("Use the admin Google sign-in for this account.");
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

  private async sendWelcomeEmail(user: UserDocument) {
    try {
      await this.mail.sendWelcomeEmail({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Welcome email could not be sent to ${user.email}: ${message}`);
    }
  }

  async loginGoogleAdmin(code: string) {
    return this.loginGoogle(code, "admin");
  }

  private authResponse(user: UserDocument) {
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

  private googleRedirectUri(role: UserRole) {
    const configuredRedirectUri = this.config.get<string>(
      role === "admin" ? "GOOGLE_ADMIN_REDIRECT_URI" : "GOOGLE_STUDENT_REDIRECT_URI"
    );

    if (configuredRedirectUri) return configuredRedirectUri;

    return (
      this.config.get<string>("GOOGLE_REDIRECT_URI") ??
      `${this.config.get<string>("API_BASE_URL") ?? "http://localhost:4000"}/auth/google/${role}/callback`
    );
  }

  private assertGoogleAdminAllowed(email: string, hostedDomain?: string) {
    const allowedEmails = (this.config.get<string>("GOOGLE_ADMIN_EMAILS") ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const allowedDomains = (this.config.get<string>("GOOGLE_ADMIN_DOMAINS") ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const emailDomain = email.split("@")[1];

    if (allowedEmails.includes(email)) return;
    if (emailDomain && allowedDomains.includes(emailDomain)) return;
    if (hostedDomain && allowedDomains.includes(hostedDomain.toLowerCase())) return;

    throw new UnauthorizedException("This Google account is not allowed to access the admin dashboard.");
  }

  private requiredConfig(key: string) {
    const value = this.config.get<string>(key);

    if (!value) {
      throw new UnauthorizedException(`${key} is not configured.`);
    }

    return value;
  }

  private profileImageExtension(mimetype: string) {
    const extensions: Record<string, string> = {
      "image/gif": ".gif",
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    const extension = extensions[mimetype];

    if (!extension) {
      throw new BadRequestException("Upload a PNG, JPG, WEBP, or GIF image.");
    }

    return extension;
  }

  private profileImageDirectory() {
    return join(process.cwd(), "uploads", "profile-images");
  }

  private publicApiBaseUrl() {
    return (
      this.config.get<string>("API_PUBLIC_URL") ??
      this.config.get<string>("API_BASE_URL") ??
      `http://localhost:${this.config.get<number>("PORT") ?? 4000}`
    ).replace(/\/$/, "");
  }

  private async deleteUploadedProfileImage(avatarUrl?: string) {
    const fileName = this.uploadedProfileImageFileName(avatarUrl);
    if (!fileName) return;

    try {
      await unlink(join(this.profileImageDirectory(), fileName));
    } catch {
      // The database profile has already been updated; a missing old file should not block the request.
    }
  }

  private uploadedProfileImageFileName(avatarUrl?: string) {
    const marker = "/uploads/profile-images/";
    const markerIndex = avatarUrl?.indexOf(marker) ?? -1;
    if (markerIndex === -1 || !avatarUrl) return null;

    const fileName = decodeURIComponent(avatarUrl.slice(markerIndex + marker.length).split(/[?#]/)[0] ?? "");
    if (!fileName || fileName.includes("/") || fileName.includes("\\")) return null;

    return fileName;
  }

  private async bootstrapConfiguredAdmin() {
    const email = this.config.get<string>("ADMIN_EMAIL")?.trim().toLowerCase();
    const password = this.config.get<string>("ADMIN_PASSWORD")?.trim();
    const fullName = this.config.get<string>("ADMIN_NAME")?.trim() || "STEM-JUPEB Admin";

    if (!email && !password) return;

    if (!email || !password) {
      console.warn("ADMIN_EMAIL and ADMIN_PASSWORD must both be set to seed the admin account.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.users.upsertPasswordAdmin({ fullName, email, passwordHash });
  }
}
