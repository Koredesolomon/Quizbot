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
    passwordHash?: string;
    avatarUrl?: string;
    authProvider?: "password" | "google";
    role: UserRole;
  }) {
    const email = input.email.toLowerCase();
    const existing = await this.findByEmail(email);

    if (existing) {
      throw new ConflictException("Email is already registered.");
    }

    return this.userModel.create({
      fullName: input.fullName,
      email,
      passwordHash: input.passwordHash,
      avatarUrl: input.avatarUrl,
      authProvider: input.authProvider ?? "password",
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
      existing.role = input.role;
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

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  publicUser(user: UserDocument) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      authProvider: user.authProvider,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
