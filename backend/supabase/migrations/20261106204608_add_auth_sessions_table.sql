-- ==============================================================================
-- Migration: Create Auth Sessions Table
-- Description: Quản lý phiên đăng nhập và refresh token của người dùng
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.auth_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  refresh_token_hash  TEXT,
  user_agent          TEXT,
  ip_address          TEXT,
  is_revoked          BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Index tăng tốc truy vấn tìm session theo user và theo hạn hết hạn
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON public.auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON public.auth_sessions (expires_at);

-- Trigger tự động cập nhật updated_at
DROP TRIGGER IF EXISTS trigger_update_auth_sessions_updated_at ON public.auth_sessions;

CREATE TRIGGER trigger_update_auth_sessions_updated_at
  BEFORE UPDATE ON public.auth_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
