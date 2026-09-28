import { ConflictException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { UserRole } from "../common/user-role.type";
import { User, UserDocument } from "./user.schema";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async create(input: {
    fullName: string;
    email: string;
    username?: string;
    passwordHash?: string;
    avatarUrl?: string;
    authProvider?: "password" | "google";
    role: UserRole;
  }) {
    const email = input.email.toLowerCase();
    const username = this.normalizeUsername(input.username);
    const existing = await this.findByEmail(email);

    if (existing) {
      throw new ConflictException("Email is already registered.");
    }

    if (username && (await this.findByUsername(username))) {
      throw new ConflictException("Username is already taken.");
    }

    return this.userModel.create({
      fullName: input.fullName,
      email,
      username,
      passwordHash: input.passwordHash,
      avatarUrl: input.avatarUrl,
      authProvider: input.authProvider ?? "password",
      role: input.role,
    });
  }

  async createOrAttachPasswordUser(input: {
    fullName: string;
    email: string;
    username?: string;
    passwordHash: string;
    role: UserRole;
  }) {
    const email = input.email.toLowerCase();
    const username = this.normalizeUsername(input.username);
    const existing = await this.findByEmail(email);

    if (existing) {
      if (existing.passwordHash) {
        throw new ConflictException("Email is already registered.");
      }

      if (username) {
        const usernameOwner = await this.findByUsername(username);
        if (usernameOwner && usernameOwner.id !== existing.id) {
          throw new ConflictException("Username is already taken.");
        }
        existing.username = username;
      }

      existing.fullName = input.fullName || existing.fullName;
      existing.passwordHash = input.passwordHash;
      existing.role = input.role === "admin" ? "admin" : existing.role;
      existing.authProvider = "password";
      return existing.save();
    }

    return this.create({
      fullName: input.fullName,
      email,
      username,
      passwordHash: input.passwordHash,
      authProvider: "password",
      role: input.role,
    });
  }

  async upsertPasswordAdmin(input: { fullName: string; email: string; passwordHash: string }) {
    const email = input.email.toLowerCase();
    const existing = await this.findByEmail(email);

    if (existing) {
      existing.fullName = input.fullName || existing.fullName;
      existing.passwordHash = input.passwordHash;
      existing.authProvider = "password";
      existing.role = "admin";
      return existing.save();
    }

    return this.create({
      fullName: input.fullName,
      email,
      passwordHash: input.passwordHash,
      authProvider: "password",
      role: "admin",
    });
  }

  async findOrCreateGoogleAdmin(input: { fullName: string; email: string }) {
    return this.findOrCreateGoogleUser({ ...input, role: "admin" });
  }

  async findOrCreateGoogleUser(input: { fullName: string; email: string; avatarUrl?: string; role: UserRole }) {
    const email = input.email.toLowerCase();
    const existing = await this.findByEmail(email);

    if (existing) {
      existing.fullName = input.fullName || existing.fullName;
      existing.avatarUrl = input.avatarUrl || existing.avatarUrl;
      existing.authProvider = "google";
      existing.role = input.role === "admin" ? "admin" : existing.role;
      return existing.save();
    }

    return this.create({
      fullName: input.fullName,
      email,
      avatarUrl: input.avatarUrl,
      authProvider: "google",
      role: input.role,
    });
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findByUsername(username: string) {
    return this.userModel.findOne({ username: this.normalizeUsername(username) }).exec();
  }

  findByEmailOrUsername(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    return this.userModel
      .findOne({
        $or: [{ email: normalized }, { username: normalized }],
      })
      .exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async setPasswordResetToken(id: string, tokenHash: string, expiresAt: Date) {
    return this.userModel
      .findByIdAndUpdate(
        id,
        {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
        { new: true }
      )
      .exec();
  }

  findByValidPasswordResetToken(tokenHash: string) {
    return this.userModel
      .findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
      })
      .exec();
  }

  async updatePasswordAndClearReset(id: string, passwordHash: string) {
    return this.userModel
      .findByIdAndUpdate(
        id,
        {
          passwordHash,
          authProvider: "password",
          $unset: {
            passwordResetTokenHash: "",
            passwordResetExpiresAt: "",
          },
        },
        { new: true }
      )
      .exec();
  }

  async updateProfile(id: string, input: { avatarUrl?: string | null }) {
    const user = await this.userModel.findById(id).exec();
    if (!user) return null;

    if ("avatarUrl" in input) {
      user.avatarUrl = input.avatarUrl?.trim() || undefined;
    }

    return user.save();
  }

  async registerCourse(id: string, courseCode: string) {
    const normalizedCourse = courseCode.trim().toUpperCase();
    if (!normalizedCourse) return null;

    return this.userModel
      .findByIdAndUpdate(
        id,
        {
          $addToSet: {
            registeredCourses: normalizedCourse,
          },
        },
        { new: true }
      )
      .exec();
  }

  publicUser(user: UserDocument) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      authProvider: user.authProvider,
      registeredCourses: user.registeredCourses ?? [],
      createdAt: user.createdAt.toISOString(),
    };
  }

  private normalizeUsername(username?: string) {
    return username?.trim().toLowerCase() || undefined;
  }
}
