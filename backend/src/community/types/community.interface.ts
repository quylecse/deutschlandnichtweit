import { Role } from '../../user/types/user.interface.js';

/**
 * Thông tin rút gọn của người đăng bài / bình luận
 */
export interface AuthorSummary {
    id: string;
    roles: Role[];
}

/**
 * Danh mục chủ đề bài viết
 */
export interface Topic {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string;
    displayOrder: number;
}
/**
 * Dữ liệu bài viết hoàn chỉnh trả về cho Client
 */
export interface Post {
    id: string;
    topicId: string | null;
    topic?: Topic | null;
    title: string | null; // Hiển thị nếu có
    content: string;
    images: string[];
    likesCount: number;
    commentsCount: number;
    isLiked?: boolean; // User hiện tại đã thả tim chưa (để tô đỏ nút tim)
    createdAt: string;
    updatedAt: string;
}

/**
 * Dữ liệu phản hồi bảng tin Infinite Scroll
 */
export interface FeedResponse {
    items: Post[];
    nextCursor: string | null;
    hasMore: boolean;
}

/**
 * Bình luận & Phản hồi
 */
export interface Comment {
    id: string;
    postId: string;
    parentId: string | null;
    content: string;
    createdAt: string;
    updatedAt: string;
    replies?: Comment[];
}