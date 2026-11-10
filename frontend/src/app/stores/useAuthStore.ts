import { create } from 'zustand';

export interface AuthUser {
    id: string;
    email: string;
    roles: ('user' | 'admin')[];
    emailVerified?: boolean;
}

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: AuthUser | null) => void;
    clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    setUser: (user) =>
        set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
        }),
    clearUser: () =>
        set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        }),
}));