import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import type { UserRole } from "../common/user-role.type";
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
  hd?: string;
  error?: string;
  error_description?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(input: { fullName: string; email: string; password: string; role: UserRole }) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.users.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: input.role,
    });

    return this.authResponse(user);
  }

  async login(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email);

    if (!user || !user.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    return this.authResponse(user);
  }

  getGoogleAdminAuthorizationUrl() {
    const clientId = this.requiredConfig("GOOGLE_CLIENT_ID");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.googleRedirectUri(),
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      state: "admin",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async loginGoogleAdmin(code: string) {
    const clientId = this.requiredConfig("GOOGLE_CLIENT_ID");
    const clientSecret = this.requiredConfig("GOOGLE_CLIENT_SECRET");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: this.googleRedirectUri(),
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
    this.assertGoogleAdminAllowed(email, profile.hd);

    const user = await this.users.findOrCreateGoogleAdmin({
      fullName: profile.name ?? email,
      email,
    });

    return this.authResponse(user);
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

  private googleRedirectUri() {
    return (
      this.config.get<string>("GOOGLE_REDIRECT_URI") ??
      `${this.config.get<string>("API_BASE_URL") ?? "http://localhost:4000"}/auth/google/admin/callback`
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
}
