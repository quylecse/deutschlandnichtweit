-- ==============================================================================
-- Migration: Create Community Topics & Posts Tables
-- Description: Khởi tạo bảng danh mục chủ đề, bài viết, index phục vụ Infinite Scroll
-- ==============================================================================

-- 1. Bảng danh mục chủ đề (Topics)
CREATE TABLE IF NOT EXISTS public.community_topics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  color         TEXT DEFAULT '#111111',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Thêm một số chủ đề khởi tạo mặc định cho du học sinh Đức
INSERT INTO public.community_topics (name, slug, description, display_order)
VALUES 
  ('Hỏi đáp Aufnahmetest', 'aufnahmetest', 'Kinh nghiệm ôn thi, đề thi mẫu và cấu trúc bài thi các trường', 1),
  ('Visa & Thủ tục APS', 'visa-aps', 'Tài khoản phong tỏa, mở sổ tiết kiệm, nộp hồ sơ xin visa', 2),
  ('Nhà ở & Ký túc xá', 'nha-o-ktx', 'Kinh nghiệm tìm WG, Wohnheim và cẩn trọng lừa đảo', 3),
  ('Cuộc sống & Du học', 'cuoc-song-du-hoc', 'Học tiếng Đức, việc làm thêm và hòa nhập văn hóa', 4)
ON CONFLICT (slug) DO NOTHING;

-- 2. Bảng bài đăng cộng đồng (Posts)
CREATE TABLE IF NOT EXISTS public.community_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic_id        UUID REFERENCES public.community_topics(id) ON DELETE SET NULL,
  title           TEXT,                       -- Tiêu đề (không bắt buộc, linh hoạt cho Forum/Threads)
  content         TEXT NOT NULL,              -- Nội dung bài viết
  images          TEXT[] NOT NULL DEFAULT '{}'::TEXT[], -- Mảng URL ảnh đính kèm
  likes_count     INTEGER NOT NULL DEFAULT 0, -- Bộ đếm like (tối ưu tốc độ)
  comments_count  INTEGER NOT NULL DEFAULT 0, -- Bộ đếm bình luận
  created_at      TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- 3. Index tối ưu hiệu năng
-- Index then chốt cho Infinite Scroll (Cursor Pagination theo thời gian giảm dần)
CREATE INDEX IF NOT EXISTS idx_community_posts_cursor 
  ON public.community_posts (created_at DESC, id DESC);

-- Index lọc bài viết theo chủ đề
CREATE INDEX IF NOT EXISTS idx_community_posts_topic 
  ON public.community_posts (topic_id, created_at DESC);

-- Index tra cứu các bài viết của một người dùng
CREATE INDEX IF NOT EXISTS idx_community_posts_user 
  ON public.community_posts (user_id);

-- 4. Trigger tự động cập nhật trường updated_at khi sửa bài viết
DROP TRIGGER IF EXISTS trigger_update_community_posts_updated_at ON public.community_posts;

CREATE TRIGGER trigger_update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 5. Bảng bình luận (Comments & Nested Replies)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.community_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES public.community_comments(id) ON DELETE CASCADE, -- Hỗ trợ trả lời trực tiếp comment khác
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Index tăng tốc hiển thị comment theo từng bài viết theo thứ tự thời gian
CREATE INDEX IF NOT EXISTS idx_community_comments_post 
  ON public.community_comments (post_id, created_at ASC);

-- Index tra cứu các comment trả lời cho 1 comment cha (replies)
CREATE INDEX IF NOT EXISTS idx_community_comments_parent 
  ON public.community_comments (parent_id) 
  WHERE parent_id IS NOT NULL;

-- Trigger tự động cập nhật updated_at cho comment
DROP TRIGGER IF EXISTS trigger_update_community_comments_updated_at ON public.community_comments;

CREATE TRIGGER trigger_update_community_comments_updated_at
  BEFORE UPDATE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 6. Bảng thả tim (Likes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.community_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  -- Mỗi người dùng chỉ được thả tim 1 lần cho 1 bài viết
  CONSTRAINT unique_user_post_like UNIQUE (user_id, post_id)
);

-- Index tra cứu danh sách bài viết mà người dùng đã like
CREATE INDEX IF NOT EXISTS idx_community_likes_user_post 
  ON public.community_likes (user_id, post_id);

-- ==============================================================================
-- 7. Triggers tự động duy trì bộ đếm likes_count và comments_count
-- Giúp truy vấn bảng tin siêu nhanh không cần COUNT(*)
-- ==============================================================================

-- A. Trigger cập nhật comments_count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON public.community_comments;

CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- B. Trigger cập nhật likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.community_likes;

CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.community_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();
