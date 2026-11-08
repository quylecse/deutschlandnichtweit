-- Migration: Bổ sung các trường thông tin chi tiết cho bảng entrance_exam_info
ALTER TABLE public.entrance_exam_info
  ADD COLUMN IF NOT EXISTS funding_type text,
  ADD COLUMN IF NOT EXISTS partner_universities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS application_portal text,
  ADD COLUMN IF NOT EXISTS required_documents text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS application_fee text,
  ADD COLUMN IF NOT EXISTS exam_fee text,
  ADD COLUMN IF NOT EXISTS exam_mode text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text;

