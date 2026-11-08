import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

// 1. Dữ liệu thô nội bộ từ bảng PostgreSQL public.auth_sessions
interface DbAuthSessionsRow {
  id: string;
  user_id: string;
  refresh_token_hash: string | null;
  user_agent: string | null;
  ip_address: string | null;
  is_revoked: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// 2. Entity chuẩn Domain xuất ra ngoài: Ẩn refresh_token_hash (OWASP Rule 15) và dùng camelCase (Rule 16)
export interface AuthSession {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  isRevoked: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// 3. Kiểu dữ liệu nội bộ khi cần đối soát Refresh Token lúc xoay vòng token (Token Rotation)
export interface AuthSessionWithHash extends AuthSession {
  refreshTokenHash: string | null;
}

@Injectable()
export class AuthSessionsRepository {
  constructor(private readonly supabase: SupabaseService) { }

  // Chuyển dòng DB (snake_case) -> Object Domain (camelCase, ẩn token hash)
  private mapToSession(row: DbAuthSessionsRow): AuthSession {
    return {
      id: row.id,
      userId: row.user_id,
      userAgent: row.user_agent,
      ipAddress: row.ip_address,
      isRevoked: row.is_revoked,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // 1. Tạo session mới (Chỉ select 'id' để tối ưu hiệu năng)
  async create(
    userId: string,
    refreshTokenHash: string,
    expiresInMs: number,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    const expiresAt = new Date(Date.now() + expiresInMs).toISOString();

    const { data, error } = await this.supabase.client
      .from('auth_sessions')
      .insert({
        user_id: userId,
        refresh_token_hash: refreshTokenHash,
        user_agent: userAgent,
        ip_address: ipAddress,
        is_revoked: false,
        expires_at: expiresAt,
      })
      .select('id')
      .single<{ id: string }>();

    if (error || !data) {
      console.error('CRITICAL: FAILED_TO_CREATE_SESSION', error);
      throw new Error('SESSION_CREATION_FAILED');
    }
    return data.id;
  }

  // 2. Tìm session theo refreshTokenHash (đối soát Refresh Token & phát hiện Token Reuse)
  async findSessionByTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSessionWithHash | null> {
    const { data, error } = await this.supabase.client
      .from('auth_sessions')
      .select('*')
      .eq('refresh_token_hash', refreshTokenHash)
      .maybeSingle<DbAuthSessionsRow>();

    if (error || !data) {
      return null;
    }

    return {
      ...this.mapToSession(data),
      refreshTokenHash: data.refresh_token_hash,
    };
  }

  // 3. Lấy danh sách session đang hoạt động của user (ĐÃ ẨN TOKEN HASH, an toàn cho Client)
  async findActiveSessionsByUser(userId: string): Promise<AuthSession[]> {
    const { data, error } = await this.supabase.client
      .from('auth_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('CRITICAL: FAILED_TO_FETCH_ACTIVE_SESSIONS', error);
      throw new Error('FETCH_ACTIVE_SESSIONS_FAILED');
    }

    return (data || []).map((row) => this.mapToSession(row as DbAuthSessionsRow));
  }

  // 4. Thu hồi 1 session (Đăng xuất khỏi thiết bị)
  async revoke(sessionId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('auth_sessions')
      .update({ is_revoked: true })
      .eq('id', sessionId);

    if (error) {
      console.error('CRITICAL: FAILED_TO_REVOKE_SESSION', error);
      throw new Error('REVOKE_SESSION_FAILED');
    }
  }

  // 5. Thu hồi tất cả session của user (Đổi mật khẩu / Khẩn cấp)
  async revokeAllForUser(userId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('auth_sessions')
      .update({ is_revoked: true })
      .eq('user_id', userId)
      .eq('is_revoked', false);

    if (error) {
      console.error('CRITICAL: FAILED_TO_REVOKE_ALL_SESSIONS', error);
      throw new Error('REVOKE_ALL_SESSIONS_FAILED');
    }
  }
}