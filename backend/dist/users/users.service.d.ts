import { StoreService, UserRecord, UserRole } from "../store.service";
export declare class UsersService {
    private readonly store;
    constructor(store: StoreService);
    create(input: {
        fullName: string;
        email: string;
        passwordHash?: string;
        authProvider?: "password" | "google";
        role: UserRole;
    }): UserRecord;
    findOrCreateGoogleAdmin(input: {
        fullName: string;
        email: string;
    }): UserRecord;
    findByEmail(email: string): UserRecord | undefined;
    findById(id: string): UserRecord | undefined;
    publicUser(user: UserRecord): {
        id: string;
        fullName: string;
        email: string;
        role: UserRole;
        createdAt: string;
    };
}
