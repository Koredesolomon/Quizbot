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
        const existing = await this.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException("Email is already registered.");
        }
        return this.userModel.create({
            fullName: input.fullName,
            email,
            passwordHash: input.passwordHash,
            authProvider: input.authProvider ?? "password",
            role: input.role,
        });
    }
    async findOrCreateGoogleAdmin(input) {
        const email = input.email.toLowerCase();
        const existing = await this.findByEmail(email);
        if (existing) {
            existing.fullName = input.fullName || existing.fullName;
            existing.authProvider = "google";
            existing.role = "admin";
            return existing.save();
        }
        return this.create({
            fullName: input.fullName,
            email,
            authProvider: "google",
            role: "admin",
        });
    }
    findByEmail(email) {
        return this.userModel.findOne({ email: email.toLowerCase() }).exec();
    }
    findById(id) {
        return this.userModel.findById(id).exec();
    }
    publicUser(user) {
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map