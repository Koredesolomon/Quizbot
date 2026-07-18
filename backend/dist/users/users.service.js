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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const store_service_1 = require("../store.service");
let UsersService = class UsersService {
    store;
    constructor(store) {
        this.store = store;
    }
    create(input) {
        const email = input.email.toLowerCase();
        const existing = this.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException("Email is already registered.");
        }
        const user = {
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
    findOrCreateGoogleAdmin(input) {
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
    findByEmail(email) {
        return this.store.users.find((user) => user.email === email.toLowerCase());
    }
    findById(id) {
        return this.store.users.find((user) => user.id === id);
    }
    publicUser(user) {
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], UsersService);
//# sourceMappingURL=users.service.js.map