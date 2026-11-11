'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ImagePlus, Loader2, Send, X } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  useCreatePost,
  getCommunityErrorMessage,
} from '../../hooks/useCommunity';
import type { Topic } from '../../types/community';

interface CreatePostWidgetProps {
  topics: Topic[];
  selectedTopicSlug?: string;
}

export default function CreatePostWidget({
  topics,
  selectedTopicSlug,
}: CreatePostWidgetProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const createPostMutation = useCreatePost();

  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(() => {
    const current = topics.find((t) => t.slug === selectedTopicSlug);
    return current?.id || '';
  });
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showImageInput, setShowImageInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddImage = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (images.length >= 4) {
      setErrorMsg('Tối đa 4 ảnh đính kèm.');
      return;
    }
    setImages((prev) => [...prev, trimmed]);
    setImageUrlInput('');
    setShowImageInput(false);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!content.trim()) {
      setErrorMsg('Vui lòng nhập nội dung bài viết.');
      return;
    }

    try {
      await createPostMutation.mutateAsync({
        title: title.trim() || undefined,
        content: content.trim(),
        topicId: selectedTopicId || undefined,
        images: images.length > 0 ? images : undefined,
      });

      // Reset form
      setTitle('');
      setContent('');
      setImages([]);
      setIsExpanded(false);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMsg(getCommunityErrorMessage(errObj?.message));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="border border-[#111111] bg-[#EFECE6] p-5 sm:p-6 mb-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-editorial text-lg text-[#111111] mb-1">
            Bạn có câu hỏi về du học hay thi tuyển?
          </h3>
          <p className="text-xs text-[#6E6D68]">
            Đăng nhập để đặt câu hỏi, chia sẻ kinh nghiệm hoặc thảo luận cùng cộng đồng.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="mt-4 sm:mt-0 inline-block px-5 py-2.5 bg-[#111111] text-[#F6F5F0] text-xs uppercase tracking-[0.14em] font-medium hover:opacity-85 transition-opacity"
        >
          Đăng nhập ngay →
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-[#111111] bg-[#F6F5F0] p-4 sm:p-6 mb-8 transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#111111] pb-3 mb-4">
        <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#6E6D68]">
          Góc thảo luận & Hỏi đáp
        </span>
        {isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-[11px] text-[#6E6D68] hover:text-[#111111] uppercase tracking-wider cursor-pointer"
          >
            Thu gọn [Esc]
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 border border-[#111111] bg-[#FAF2EF] text-[#A32A15] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Optional Title */}
        {isExpanded && (
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề câu hỏi / chủ đề thảo luận (tùy chọn)..."
              maxLength={150}
              className="w-full bg-transparent border-b border-[#D6D4CC] pb-2 text-sm font-editorial font-medium text-[#111111] focus:outline-none focus:border-[#111111] placeholder:text-[#9A9890]"
            />
          </div>
        )}

        {/* Main Content Area */}
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Bạn đang thắc mắc điều gì? Đăng câu hỏi hoặc chia sẻ thông tin tại đây..."
            rows={isExpanded ? 4 : 2}
            maxLength={5000}
            className="w-full bg-transparent p-0 text-xs sm:text-sm text-[#111111] leading-relaxed focus:outline-none placeholder:text-[#9A9890] resize-none"
          />
        </div>

        {/* Image Preview List */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative group border border-[#111111] bg-[#EFECE6] w-20 h-20 overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-[#111111] text-[#F6F5F0] p-0.5 rounded-none hover:opacity-80"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Image URL Input Form */}
        {showImageInput && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Dán link ảnh (https://...)"
              className="flex-1 bg-transparent border border-[#111111] px-3 py-1.5 text-xs text-[#111111] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-3 py-1.5 bg-[#111111] text-[#F6F5F0] text-xs font-mono uppercase"
            >
              Thêm
            </button>
            <button
              type="button"
              onClick={() => setShowImageInput(false)}
              className="text-[#6E6D68] hover:text-[#111111] text-xs px-2"
            >
              Hủy
            </button>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="pt-3 border-t border-[#D6D4CC] flex flex-wrap items-center justify-between gap-3">
          {/* Topic Select */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-mono text-[#6E6D68] mr-1">
              Chủ đề:
            </span>
            {topics.map((t) => {
              const isSelected = selectedTopicId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTopicId(isSelected ? '' : t.id)}
                  className={`px-2.5 py-1 text-[11px] font-mono transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-[#111111] text-[#F6F5F0] border-[#111111]'
                      : 'bg-transparent text-[#6E6D68] border-[#D6D4CC] hover:border-[#111111] hover:text-[#111111]'
                  }`}
                >
                  #{t.name}
                </button>
              );
            })}
          </div>

          {/* Submit & Extra Controls */}
          <div className="flex items-center gap-3 ml-auto">
            {!showImageInput && images.length < 4 && (
              <button
                type="button"
                onClick={() => setShowImageInput(true)}
                title="Đính kèm ảnh"
                className="text-[#6E6D68] hover:text-[#111111] p-1.5 transition-colors cursor-pointer"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={createPostMutation.isPending || !content.trim()}
              className="px-5 py-2 bg-[#111111] text-[#F6F5F0] text-xs uppercase tracking-[0.14em] font-medium hover:opacity-85 transition-opacity disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              {createPostMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang đăng...</span>
                </>
              ) : (
                <>
                  <span>Đăng bài</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
