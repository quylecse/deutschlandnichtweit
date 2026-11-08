import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthSession, AuthSessionsRepository } from './auth-sessions.repository.js';
import { REFRESH_TOKEN_TTL_MS } from './constants/auth.constants.js';

@Injectable()
export class AuthSessionsService {
    constructor(private readonly authSessionsRepo: AuthSessionsRepository) { }

    /**
     * Tạo phiên đăng nhập mới cho người dùng
     */
    async createSession(
        userId: string,
        refreshTokenHash: string,
        expiresInMs: number = REFRESH_TOKEN_TTL_MS,
        userAgent?: string,
        ipAddress?: string,
    ): Promise<string> {
        if (!userId) {
            throw new BadRequestException('USER_ID_REQUIRED');
        }
        if (!refreshTokenHash) {
            throw new BadRequestException('REFRESH_TOKEN_HASH_REQUIRED');
        }
        return await this.authSessionsRepo.create(
            userId,
            refreshTokenHash,
            expiresInMs,
            userAgent,
            ipAddress,
        );
    }

    /**
     * Thu hồi một phiên đăng nhập cụ thể (ví dụ user bấm Đăng xuất)
     */
    async revokeSession(sessionId: string): Promise<void> {
        if (!sessionId) {
            throw new BadRequestException('SESSION_ID_REQUIRED');
        }
        await this.authSessionsRepo.revoke(sessionId);
    }

    /**
     * Thu hồi tất cả phiên đăng nhập của user (dùng khi Đổi mật khẩu / Khẩn cấp)
     */
    async revokeAllSessions(userId: string): Promise<void> {
        if (!userId) {
            throw new BadRequestException('USER_ID_REQUIRED');
        }
        await this.authSessionsRepo.revokeAllForUser(userId);
    }

    /**
     * Lấy danh sách các phiên đang hoạt động của user (dùng hiển thị màn hình Thiết bị)
     */
    async getActiveSessions(userId: string): Promise<AuthSession[]> {
        if (!userId) {
            throw new BadRequestException('USER_ID_REQUIRED');
        }
        return await this.authSessionsRepo.findActiveSessionsByUser(userId);
    }

    /**
   * Tìm session theo mã hash của Refresh Token
   */
    async findSessionByTokenHash(refreshTokenHash: string) {
        if (!refreshTokenHash) {
            return null;
        }
        return await this.authSessionsRepo.findSessionByTokenHash(refreshTokenHash);
    }
}