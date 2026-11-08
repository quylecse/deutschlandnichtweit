import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { Role, User, UserWithPassword } from './types/user.interface.js';

// Kiểu dữ liệu thô trả về từ bảng public.users trong PostgreSQL
interface DbUserRow {
  id: string;
  email: string;
  password_hash: string | null;
  email_verified: boolean;
  roles: Role[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly supabase: SupabaseService) { }

  // Chuyển dòng DB (snake_case) -> Object User (camelCase, ẩn password_hash)
  private mapToUser(row: DbUserRow): User {
    return {
      id: row.id,
      email: row.email,
      emailVerified: row.email_verified,
      roles: row.roles,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  // 1. Tạo user mới (Database tự sinh UUID qua gen_random_uuid())
  async create(email: string, passwordHash: string | null = null): Promise<User> {
    const emailVerified = false;
    const roles = 'user';

    const { data, error } = await this.supabase.client
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash
      })
      .select('*')
      .single<DbUserRow>();

    if (error) throw new Error(`Lỗi tạo user: ${error.message}`);
    return this.mapToUser(data);
  }

  // 2. Tìm user theo ID (dùng cho Profile / Guard)
  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase.client
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle<DbUserRow>();

    if (error) throw error;
    return data ? this.mapToUser(data) : null;
  }

  // 3. Tìm user theo Email (kèm passwordHash để kiểm tra lúc Login)
  async findByEmailWithPassword(
    email: string,
  ): Promise<UserWithPassword | null> {
    const { data, error } = await this.supabase.client
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle<DbUserRow>();

    if (error) throw error;
    if (!data) return null;

    return {
      ...this.mapToUser(data),
      passwordHash: data.password_hash,
    };
  }

  // 4. Đánh dấu đã xác thực email (dùng khi user bấm link Verify Email)
  async markEmailVerified(userId: string): Promise<User> {
    const { data, error } = await this.supabase.client
      .from('users')
      .update({ email_verified: true })
      .eq('id', userId)
      .select('*')
      .single<DbUserRow>();

    if (error) throw error;
    return this.mapToUser(data);
  }

  // 5. Cập nhật mật khẩu mới (dùng cho Reset Password / Change Password)
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId);

    if (error) throw error;
  }

  async deleteById(userId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new Error(`Lỗi khi xóa user: ${error.message}`);
    }
  }
}
