-- ==============================================================================
-- Migration: Create Auth Pending Links Table
-- Description: Lưu token tạm thời cho Xác thực Email và Đặt lại Mật khẩu (Forgot Password)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.auth_pending_links (
  id          TEXT PRIMARY KEY,  -- Chuỗi token ngẫu nhiên (64 ký tự hex) gửi qua email
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,     -- 'VERIFY_EMAIL', 'PASSWORD_RESET'
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Index tăng tốc tối đa khi user click link email để đối chiếu token, loại token và hạn dùng
CREATE INDEX IF NOT EXISTS idx_auth_pending_links_lookup 
  ON public.auth_pending_links (id, type, expires_at);

-- Index giúp xóa nhanh toàn bộ token tạm của một user khi cần
CREATE INDEX IF NOT EXISTS idx_auth_pending_links_user_id 
  ON public.auth_pending_links (user_id);

