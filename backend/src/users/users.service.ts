import { ConflictException, Injectable } from "@nestjs/common";
import { StoreService, UserRecord, UserRole } from "../store.service";

@Injectable()
export class UsersService {
  constructor(private readonly store: StoreService) {}

  create(input: {
    fullName: string;
    email: string;
    passwordHash?: string;
    authProvider?: "password" | "google";
    role: UserRole;
  }): UserRecord {
    const email = input.email.toLowerCase();
    const existing = this.findByEmail(email);

    if (existing) {
      throw new ConflictException("Email is already registered.");
    }

    const user: UserRecord = {
      id: crypto.randomUUID(),
      fullName: input.fullName,
      email,
      passwordHash: input.passwordHash,
      authProvider: input.authProvider ?? "password",
      role: input.role,
      createdAt: new Date().toISOString(),
    };

    this.store.users.push(user);
    return user;
  }

  findOrCreateGoogleAdmin(input: { fullName: string; email: string }): UserRecord {
    const email = input.email.toLowerCase();
    const existing = this.findByEmail(email);

    if (existing) {
      existing.fullName = input.fullName || existing.fullName;
      existing.authProvider = "google";
      existing.role = "admin";
      return existing;
    }

    return this.create({
      fullName: input.fullName,
      email,
      authProvider: "google",
      role: "admin",
    });
  }

  findByEmail(email: string) {
    return this.store.users.find((user) => user.email === email.toLowerCase());
  }

  findById(id: string) {
    return this.store.users.find((user) => user.id === id);
  }

  publicUser(user: UserRecord) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
