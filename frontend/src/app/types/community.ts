export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  displayOrder: number;
}

export interface Post {
  id: string;
  topicId: string | null;
  topic?: Topic | null;
  title: string | null;
  content: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedResponse {
  items: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostPayload {
  topicId?: string;
  title?: string;
  content: string;
  images?: string[];
}

export interface CreateCommentPayload {
  content: string;
  parentId?: string;
}

