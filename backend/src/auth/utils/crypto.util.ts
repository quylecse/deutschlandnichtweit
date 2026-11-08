import * as crypto from 'crypto';

/**
 * Băm một chuỗi token bằng thuật toán SHA-256 (dùng cho Refresh Token)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Sinh token ngẫu nhiên cho link xác thực email (32 bytes = 64 ký tự hex)
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Sinh token ngẫu nhiên cho Refresh Token (40 bytes = 80 ký tự hex)
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

