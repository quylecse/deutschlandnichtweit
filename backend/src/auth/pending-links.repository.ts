import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

export type PendingLinkType = 'VERIFY_EMAIL' | 'PASSWORD_RESET';
interface DbPendingLinkRow {
  id: string;
  type: PendingLinkType;
  user_id: string;
  expires_at: string;
  created_at: string;
}
@Injectable()
export class PendingLinksRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async create(
    tokenId: string,
    userId: string,
    type: PendingLinkType,
    expiresInMs: number,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresInMs).toISOString();
    const { error } = await this.supabase.client
      .from('auth_pending_links')
      .insert({
        id: tokenId,
        user_id: userId,
        type,
        expires_at: expiresAt,
      });
    if (error) {
      throw new Error(`Lỗi tạo verify token> ${error.message}`);
    }
  }
  async consumeToken(
    tokenId: string,
    type: PendingLinkType,
  ): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from('auth_pending_links')
      .select('user_id')
      .eq('id', tokenId)
      .eq('type', type)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle<DbPendingLinkRow>();

    if (error || !data) {
      return null;
    }
    await this.supabase.client
      .from('auth_pending_links')
      .delete()
      .eq('id', tokenId);

    return data.user_id;
  }

  async clearExistingTokens(
    userId: string,
    type: PendingLinkType,
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('auth_pending_links')
      .delete()
      .eq('user_id', userId)
      .eq('type', type);

    if (error) {
      throw new Error(`Lỗi xóa các token cũ: ${error.message}`);
    }
  }
  
}
