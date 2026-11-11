'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageSquare,
  Send,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  useToggleLike,
  usePostComments,
  useCreateComment,
} from '../../hooks/useCommunity';
import type { Post } from '../../types/community';

interface PostCardProps {
  post: Post;
  activeTopicSlug?: string;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

export default function PostCard({ post, activeTopicSlug }: PostCardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const toggleLikeMutation = useToggleLike(activeTopicSlug);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Fetch comments only when expanded
  const { data: comments, isLoading: isLoadingComments } = usePostComments(
    post.id,
    showComments
  );
  const createCommentMutation = useCreateComment(post.id);

  const handleLike = () => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }
    toggleLikeMutation.mutate(post.id);
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        content: commentText.trim(),
      });
      setCommentText('');
    } catch (err) {
      console.error('Lỗi gửi comment:', err);
    }
  };

  return (
    <article className="border border-[#111111] bg-[#F6F5F0] p-5 sm:p-6 mb-4 transition-all hover:border-[#111111] hover:shadow-xs">
      {/* Top Metadata: Topic Badge & Timestamp */}
      <div className="flex items-center justify-between gap-3 text-xs border-b border-[#EAE7DF] pb-3 mb-3.5">
        <div className="flex items-center gap-2">
          {post.topic ? (
            <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-medium border border-[#111111] bg-[#EFECE6] text-[#111111]">
              #{post.topic.name}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] uppercase font-mono text-[#6E6D68] border border-[#D6D4CC]">
              #Chung
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6E6D68]">
          <Clock className="w-3 h-3" />
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </div>

      {/* Optional Title */}
      {post.title && (
        <h2 className="font-editorial text-lg sm:text-xl text-[#111111] font-semibold mb-2 leading-snug">
          {post.title}
        </h2>
      )}

      {/* Main Content */}
      <div className="text-xs sm:text-sm text-[#111111] leading-relaxed whitespace-pre-wrap font-sans mb-4">
        {post.content}
      </div>

      {/* Images Grid (if any) */}
      {post.images && post.images.length > 0 && (
        <div
          className={`grid gap-2 mb-4 ${
            post.images.length === 1
              ? 'grid-cols-1'
              : post.images.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2 sm:grid-cols-3'
          }`}
        >
          {post.images.map((imgUrl, i) => (
            <div
              key={i}
              className="border border-[#111111] bg-[#EFECE6] overflow-hidden max-h-72"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={`Ảnh đính kèm ${i + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Bottom Interactive Bar */}
      <div className="flex items-center gap-6 pt-3 border-t border-[#EAE7DF] text-xs font-mono text-[#6E6D68]">
        {/* Like Button */}
        <button
          type="button"
          onClick={handleLike}
          disabled={toggleLikeMutation.isPending}
          className={`flex items-center gap-1.5 py-1 transition-colors cursor-pointer group ${
            post.isLiked ? 'text-[#C92A2A]' : 'hover:text-[#111111]'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform group-hover:scale-115 ${
              post.isLiked ? 'fill-[#C92A2A] text-[#C92A2A]' : 'text-[#6E6D68]'
            }`}
          />
          <span className="font-medium">{post.likesCount}</span>
        </button>

        {/* Comment Toggle Button */}
        <button
          type="button"
          onClick={() => setShowComments((prev) => !prev)}
          className="flex items-center gap-1.5 py-1 hover:text-[#111111] transition-colors cursor-pointer group"
        >
          <MessageSquare className="w-4 h-4 text-[#6E6D68] group-hover:scale-110 transition-transform" />
          <span className="font-medium">{post.commentsCount}</span>
          <span className="text-[11px] text-[#9A9890] hidden sm:inline">
            {showComments ? '• Ẩn' : '• Xem thảo luận'}
          </span>
        </button>
      </div>

      {/* Inline Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-[#111111]/15 space-y-3.5">
          {/* Comment List */}
          {isLoadingComments ? (
            <div className="py-4 text-center text-xs font-mono text-[#6E6D68] flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang tải bình luận...</span>
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-2.5">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-[#EFECE6]/80 border-l-2 border-[#111111] text-xs"
                >
                  <div className="text-[10px] font-mono text-[#6E6D68] mb-1">
                    {formatDate(c.createdAt)}
                  </div>
                  <div className="text-[#111111] whitespace-pre-wrap leading-relaxed">
                    {c.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-center text-xs font-mono text-[#6E6D68] italic">
              Chưa có bình luận nào. Hãy là người đầu tiên tham gia thảo luận!
            </div>
          )}

          {/* Add Comment Input Form */}
          {isAuthenticated ? (
            <form onSubmit={handleSendComment} className="flex gap-2 pt-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Viết câu trả lời của bạn..."
                className="flex-1 bg-transparent border border-[#111111] px-3 py-2 text-xs text-[#111111] focus:outline-none placeholder:text-[#9A9890]"
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={createCommentMutation.isPending || !commentText.trim()}
                className="px-4 py-2 bg-[#111111] text-[#F6F5F0] text-xs uppercase tracking-wider font-mono hover:opacity-85 transition-opacity disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {createCommentMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Gửi</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="pt-2 text-center text-xs text-[#6E6D68]">
              <Link
                href="/auth/login"
                className="underline underline-offset-4 text-[#111111] font-medium"
              >
                Đăng nhập
              </Link>{' '}
              để tham gia bình luận câu hỏi này.
            </div>
          )}
        </div>
      )}
    </article>
  );
}

