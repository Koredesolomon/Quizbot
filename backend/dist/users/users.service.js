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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./user.schema");
let UsersService = class UsersService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async create(input) {
        const email = input.email.toLowerCase();
        const username = this.normalizeUsername(input.username);
        const existing = await this.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException("Email is already registered.");
        }
        if (username && (await this.findByUsername(username))) {
            throw new common_1.ConflictException("Username is already taken.");
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
    async createOrAttachPasswordUser(input) {
        const email = input.email.toLowerCase();
        const username = this.normalizeUsername(input.username);
        const existing = await this.findByEmail(email);
        if (existing) {
            if (existing.passwordHash) {
                throw new common_1.ConflictException("Email is already registered.");
            }
            if (username) {
                const usernameOwner = await this.findByUsername(username);
                if (usernameOwner && usernameOwner.id !== existing.id) {
                    throw new common_1.ConflictException("Username is already taken.");
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
    async upsertPasswordAdmin(input) {
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
    async findOrCreateGoogleAdmin(input) {
        return this.findOrCreateGoogleUser({ ...input, role: "admin" });
    }
    async findOrCreateGoogleUser(input) {
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
    findByEmail(email) {
        return this.userModel.findOne({ email: email.toLowerCase() }).exec();
    }
    findByUsername(username) {
        return this.userModel.findOne({ username: this.normalizeUsername(username) }).exec();
    }
    findByEmailOrUsername(identifier) {
        const normalized = identifier.trim().toLowerCase();
        return this.userModel
            .findOne({
            $or: [{ email: normalized }, { username: normalized }],
        })
            .exec();
    }
    findById(id) {
        return this.userModel.findById(id).exec();
    }
    async setPasswordResetToken(id, tokenHash, expiresAt) {
        return this.userModel
            .findByIdAndUpdate(id, {
            passwordResetTokenHash: tokenHash,
            passwordResetExpiresAt: expiresAt,
        }, { new: true })
            .exec();
    }
    findByValidPasswordResetToken(tokenHash) {
        return this.userModel
            .findOne({
            passwordResetTokenHash: tokenHash,
            passwordResetExpiresAt: { $gt: new Date() },
        })
            .exec();
    }
    async updatePasswordAndClearReset(id, passwordHash) {
        return this.userModel
            .findByIdAndUpdate(id, {
            passwordHash,
            authProvider: "password",
            $unset: {
                passwordResetTokenHash: "",
                passwordResetExpiresAt: "",
            },
        }, { new: true })
            .exec();
    }
    async updateProfile(id, input) {
        const user = await this.userModel.findById(id).exec();
        if (!user)
            return null;
        if ("avatarUrl" in input) {
            user.avatarUrl = input.avatarUrl?.trim() || undefined;
        }
        return user.save();
    }
    async registerCourse(id, courseCode) {
        const normalizedCourse = courseCode.trim().toUpperCase();
        if (!normalizedCourse)
            return null;
        return this.userModel
            .findByIdAndUpdate(id, {
            $addToSet: {
                registeredCourses: normalizedCourse,
            },
        }, { new: true })
            .exec();
    }
    publicUser(user) {
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
    normalizeUsername(username) {
        return username?.trim().toLowerCase() || undefined;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map