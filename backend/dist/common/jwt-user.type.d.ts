import type { UserRole } from "./user-role.type";
export type JwtUser = {
    sub: string;
    email: string;
    role: UserRole;
};
