-- ==============================================================================
-- Migration: Create Auth Tables
-- Description: Khởi tạo bảng users, index và trigger tự động cập nhật thời gian
-- ==============================================================================

-- 1. Kích hoạt extension pgcrypto để sinh chuỗi UUID ngẫu nhiên
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tạo bảng users
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  roles           TEXT[] NOT NULL DEFAULT ARRAY['user']::TEXT[],
  metadata        JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- 3. Tạo index tăng tốc độ tìm kiếm email khi đăng nhập
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- 4. Hàm cập nhật trường updated_at theo giờ UTC
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger tự động chạy hàm trên trước mỗi lần UPDATE dữ liệu
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON public.users;

CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
