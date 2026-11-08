export type Role = 'user' | 'admin';

export interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    roles: Role[];
    metadata?: Record<string, unknown>;
    createdAt?: string;
    updatedAt?: string;
}

// Dùng nội bộ khi cần lấy cả passwordHash để so sánh lúc Login
export interface UserWithPassword extends User {
    passwordHash: string | null;
}