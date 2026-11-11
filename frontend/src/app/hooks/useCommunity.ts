'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type {
  Comment,
  CreateCommentPayload,
  CreatePostPayload,
  FeedResponse,
  Post,
  Topic,
} from '../types/community';

const COMMUNITY_API_BASE = '/api/community';

export const COMMUNITY_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Bạn cần đăng nhập để thực hiện thao tác này.',
  POST_NOT_FOUND: 'Bài viết không tồn tại hoặc đã bị xóa.',
  FORBIDDEN_DELETE_POST: 'Bạn không có quyền xóa bài viết này.',
  CREATE_POST_FAILED: 'Không thể đăng bài viết. Vui lòng thử lại sau.',
  CREATE_COMMENT_FAILED: 'Không thể gửi bình luận. Vui lòng thử lại sau.',
  TOGGLE_LIKE_FAILED: 'Không thể cập nhật lượt thích. Vui lòng thử lại sau.',
  CANNOT_CONNECT_TO_SERVER: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.',
};

export function getCommunityErrorMessage(code?: string | string[]): string {
  if (!code) return 'Đã xảy ra lỗi không xác định.';
  const normalized = Array.isArray(code) ? code[0] : code;
  return COMMUNITY_ERROR_MESSAGES[normalized] || `Lỗi: ${normalized}`;
}

async function safeJsonFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('CANNOT_CONNECT_TO_SERVER');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'REQUEST_FAILED');
  }
  return data as T;
}

// 1. Lấy danh sách các chủ đề (Topics)
export function useCommunityTopics() {
  return useQuery({
    queryKey: ['community', 'topics'],
    queryFn: () => safeJsonFetch<Topic[]>(`${COMMUNITY_API_BASE}/topics`),
    staleTime: 10 * 60 * 1000, // 10 phút
  });
}

// 2. Lấy Bảng tin Infinite Scroll (Feed)
export function useCommunityFeed(topicSlug?: string) {
  return useInfiniteQuery({
    queryKey: ['community', 'feed', topicSlug || 'all'],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const params = new URLSearchParams();
      params.set('limit', '10');
      if (pageParam) params.set('cursor', pageParam);
      if (topicSlug) params.set('topicSlug', topicSlug);

      return safeJsonFetch<FeedResponse>(
        `${COMMUNITY_API_BASE}/posts?${params.toString()}`
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60 * 1000,
  });
}

// 3. Đăng bài viết mới
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePostPayload) =>
      safeJsonFetch<Post>(`${COMMUNITY_API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      // Làm mới toàn bộ feed để bài mới hiển thị ngay lập tức trên đầu
      queryClient.invalidateQueries({ queryKey: ['community', 'feed'] });
    },
  });
}

// 4. Thả tim / Bỏ thả tim (Optimistic Update - Phản hồi tức thì)
export function useToggleLike(activeTopicSlug?: string) {
  const queryClient = useQueryClient();
  const feedKey = ['community', 'feed', activeTopicSlug || 'all'];

  return useMutation({
    mutationFn: (postId: string) =>
      safeJsonFetch<{ isLiked: boolean }>(
        `${COMMUNITY_API_BASE}/posts/${postId}/like`,
        { method: 'POST' }
      ),
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previousData = queryClient.getQueryData<InfiniteData<FeedResponse>>(feedKey);

      if (previousData) {
        queryClient.setQueryData<InfiniteData<FeedResponse>>(feedKey, {
          ...previousData,
          pages: previousData.pages.map((page) => ({
            ...page,
            items: page.items.map((post) => {
              if (post.id === postId) {
                const nextIsLiked = !post.isLiked;
                return {
                  ...post,
                  isLiked: nextIsLiked,
                  likesCount: nextIsLiked
                    ? post.likesCount + 1
                    : Math.max(post.likesCount - 1, 0),
                };
              }
              return post;
            }),
          })),
        });
      }

      return { previousData };
    },
    onError: (_err, _postId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(feedKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedKey });
    },
  });
}

// 5. Lấy danh sách bình luận của bài viết
export function usePostComments(postId: string, enabled = true) {
  return useQuery({
    queryKey: ['community', 'comments', postId],
    queryFn: () =>
      safeJsonFetch<Comment[]>(`${COMMUNITY_API_BASE}/posts/${postId}/comments`),
    enabled: !!postId && enabled,
  });
}

// 6. Gửi bình luận mới
export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentPayload) =>
      safeJsonFetch<Comment>(
        `${COMMUNITY_API_BASE}/posts/${postId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', postId] });
      // Cập nhật lại số lượng comment trên feed
      queryClient.invalidateQueries({ queryKey: ['community', 'feed'] });
    },
  });
}

// 7. Xóa bài viết (Chính chủ hoặc Admin)
export function useDeletePost(activeTopicSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) =>
      safeJsonFetch<{ code: string }>(
        `${COMMUNITY_API_BASE}/posts/${postId}`,
        { method: 'DELETE' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['community', 'feed', activeTopicSlug || 'all'],
      });
    },
  });
}

