'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, type AuthUser } from '../stores/useAuthStore';

// Sử dụng Next.js BFF API route cùng domain, tránh hoàn toàn lỗi localhost, CORS trên production
const AUTH_API_BASE = '/api/auth';

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác.',
  EMAIL_ALREADY_EXISTS: 'Email này đã được đăng ký tài khoản. Bạn có thể đăng nhập ngay.',
  EMAIL_NOT_VERIFIED: 'Tài khoản chưa được kích hoạt email. Vui lòng kiểm tra hộp thư đến của bạn.',
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  TOKEN_INVALID: 'Phiên xác thực không hợp lệ.',
  UNAUTHORIZED: 'Bạn cần đăng nhập để thực hiện thao tác này.',
  USER_NOT_FOUND: 'Không tìm thấy thông tin tài khoản.',
  ACCOUNT_LOCKED: 'Tài khoản tạm thời bị khóa vì bảo mật. Vui lòng thử lại sau.',
  CANNOT_CONNECT_TO_AUTH_SERVER: 'Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra biến môi trường hoặc liên hệ quản trị.',
  INTERNAL_SERVER_ERROR: 'Lỗi hệ thống máy chủ. Vui lòng thử lại sau giây lát.',
  NETWORK_ERROR: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.',
};

export function getAuthErrorMessage(code?: string | string[]): string {
  if (!code) return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
  const normalizedCode = Array.isArray(code) ? code[0] : code;
  return AUTH_ERROR_MESSAGES[normalizedCode] || `Lỗi: ${normalizedCode}`;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
}

// Hàm parse JSON phòng thủ (Defensive JSON Parsing) tuyệt đối không crash nếu nhận về HTML
async function safeJsonParse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    console.error('Phản hồi không phải JSON:', text.slice(0, 150));
    throw new Error('CANNOT_CONNECT_TO_AUTH_SERVER');
  }
  return res.json();
}

// 1. Hook lấy thông tin người dùng hiện tại (Session check)
export function useCurrentUser() {
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<AuthUser | null> => {
      try {
        const res = await fetch(`${AUTH_API_BASE}/me`, {
          method: 'GET',
        });

        if (!res.ok) {
          clearUser();
          return null;
        }

        const data = await safeJsonParse(res);
        const user: AuthUser = {
          ...data.user,
          emailVerified:
            data.user.emailVerified ?? data.user.email_verified ?? true,
        };
        setUser(user);
        return user;
      } catch {
        clearUser();
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// 2. Hook Đăng nhập
export function useSignIn() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (credentials: SignInCredentials) => {
      const res = await fetch(`${AUTH_API_BASE}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await safeJsonParse(res);
      if (!res.ok) {
        throw new Error(data.message || 'LOGIN_FAILED');
      }

      return data as { code: string; user: AuthUser };
    },
    onSuccess: (data) => {
      const authUser: AuthUser = {
        ...data.user,
        emailVerified:
          data.user.emailVerified ?? true,
      };
      setUser(authUser);
      queryClient.setQueryData(['auth', 'me'], authUser);
    },
  });
}

// 3. Hook Đăng ký
export function useSignUp() {
  return useMutation({
    mutationFn: async (credentials: SignUpCredentials) => {
      const res = await fetch(`${AUTH_API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await safeJsonParse(res);
      if (!res.ok) {
        throw new Error(data.message || 'SIGNUP_FAILED');
      }

      return data;
    },
  });
}

// 4. Hook Đăng xuất
export function useSignOut() {
  const queryClient = useQueryClient();
  const clearUser = useAuthStore((state) => state.clearUser);

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${AUTH_API_BASE}/logout`, {
        method: 'POST',
      });
      return res.ok;
    },
    onSuccess: () => {
      clearUser();
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}
