import type { UserRole } from "../store.service";
export type JwtUser = {
    sub: string;
    email: string;
    role: UserRole;
};
