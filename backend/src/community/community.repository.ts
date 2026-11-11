import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import {
  Comment,
  FeedResponse,
  Post,
  Topic,
} from './types/community.interface.js';

interface DbTopicRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  display_order: number;
}

interface DbPostRow {
  id: string;
  user_id: string;
  topic_id: string | null;
  title: string | null;
  content: string;
  images: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  topic?: DbTopicRow | null;
}

interface DbCommentRow {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class CommunityRepository {
  private readonly logger = new Logger(CommunityRepository.name);

  constructor(private readonly supabase: SupabaseService) {}

  // ============================================================================
  // 1. CHỦ ĐỀ (TOPICS)
  // ============================================================================

  async getTopics(): Promise<Topic[]> {
    const { data, error } = await this.supabase.client
      .from('community_topics')
      .select('id, name, slug, description, color, display_order')
      .order('display_order', { ascending: true });

    if (error) {
      this.logger.error(`getTopics error: ${error.message}`);
      throw new Error('FETCH_TOPICS_FAILED');
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      color: row.color,
      displayOrder: row.display_order,
    }));
  }

  async getTopicBySlug(slug: string): Promise<Topic | null> {
    const { data, error } = await this.supabase.client
      .from('community_topics')
      .select('id, name, slug, description, color, display_order')
      .eq('slug', slug)
      .maybeSingle<DbTopicRow>();

    if (error) {
      this.logger.error(`getTopicBySlug error: ${error.message}`);
      throw new Error('FETCH_TOPIC_FAILED');
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      color: data.color,
      displayOrder: data.display_order,
    };
  }

  // ============================================================================
  // 2. BÀI VIẾT (POSTS & INFINITE SCROLL)
  // ============================================================================

  async createPost(userId: string, dto: CreatePostDto): Promise<Post> {
    const { data, error } = await this.supabase.client
      .from('community_posts')
      .insert({
        user_id: userId,
        topic_id: dto.topicId || null,
        title: dto.title?.trim() || null,
        content: dto.content.trim(),
        images: dto.images || [],
      })
      .select('*, topic:community_topics(*)')
      .single<DbPostRow>();

    if (error) {
      this.logger.error(`createPost error: ${error.message}`);
      throw new Error('CREATE_POST_FAILED');
    }

    return this.mapToPost(data);
  }

  async getPosts(options: {
    cursor?: string;
    limit: number;
    topicId?: string;
    topicSlug?: string;
    currentUserId?: string;
  }): Promise<FeedResponse> {
    const { cursor, limit, topicId, topicSlug, currentUserId } = options;

    // Lấy dư 1 phần tử (limit + 1) để xác định hasMore
    // Nếu có topicSlug, dùng inner join để lọc bài viết đúng topic
    const selectClause = topicSlug
      ? '*, topic:community_topics!inner(*)'
      : '*, topic:community_topics(*)';

    let query = this.supabase.client
      .from('community_posts')
      .select(selectClause)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (topicSlug) {
      query = query.eq('topic.slug', topicSlug);
    } else if (topicId) {
      query = query.eq('topic_id', topicId);
    }

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) {
      this.logger.error(`getPosts error: ${error.message}`);
      throw new Error('FETCH_POSTS_FAILED');
    }

    const rawRows = (data as DbPostRow[]) || [];
    const hasMore = rawRows.length > limit;
    const postRows = hasMore ? rawRows.slice(0, limit) : rawRows;

    // Lấy danh sách ID các bài mà user hiện tại đã like
    let likedPostIds = new Set<string>();
    if (currentUserId && postRows.length > 0) {
      const postIds = postRows.map((p) => p.id);
      const { data: likesData, error: likesError } = await this.supabase.client
        .from('community_likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds);

      if (!likesError && likesData) {
        likedPostIds = new Set(likesData.map((l) => l.post_id));
      }
    }

    const items = postRows.map((row) => ({
      ...this.mapToPost(row),
      isLiked: likedPostIds.has(row.id),
    }));

    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1].createdAt : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  async getPostById(postId: string, currentUserId?: string): Promise<Post | null> {
    const { data, error } = await this.supabase.client
      .from('community_posts')
      .select('*, topic:community_topics(*)')
      .eq('id', postId)
      .maybeSingle<DbPostRow>();

    if (error) {
      this.logger.error(`getPostById error: ${error.message}`);
      throw new Error('FETCH_POST_BY_ID_FAILED');
    }

    if (!data) return null;

    let isLiked = false;
    if (currentUserId) {
      const { data: likeData } = await this.supabase.client
        .from('community_likes')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('post_id', postId)
        .maybeSingle();

      isLiked = !!likeData;
    }

    return {
      ...this.mapToPost(data),
      isLiked,
    };
  }

  async getPostAuthorId(postId: string): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from('community_posts')
      .select('user_id')
      .eq('id', postId)
      .maybeSingle<{ user_id: string }>();

    if (error) {
      this.logger.error(`getPostAuthorId error: ${error.message}`);
      return null;
    }

    return data?.user_id || null;
  }

  async deletePost(postId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('community_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      this.logger.error(`deletePost error: ${error.message}`);
      throw new Error('DELETE_POST_FAILED');
    }
  }

  // ============================================================================
  // 3. THẢ TIM (LIKES)
  // ============================================================================

  async hasUserLikedPost(userId: string, postId: string): Promise<boolean> {
    const { data, error } = await this.supabase.client
      .from('community_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }

  async addLike(userId: string, postId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('community_likes')
      .insert({ user_id: userId, post_id: postId });

    if (error && error.code !== '23505') {
      this.logger.error(`addLike error: ${error.message}`);
      throw new Error('ADD_LIKE_FAILED');
    }
  }

  async removeLike(userId: string, postId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('community_likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (error) {
      this.logger.error(`removeLike error: ${error.message}`);
      throw new Error('REMOVE_LIKE_FAILED');
    }
  }

  // ============================================================================
  // 4. BÌNH LUẬN (COMMENTS)
  // ============================================================================

  async createComment(
    userId: string,
    postId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const { data, error } = await this.supabase.client
      .from('community_comments')
      .insert({
        user_id: userId,
        post_id: postId,
        parent_id: dto.parentId || null,
        content: dto.content.trim(),
      })
      .select('*')
      .single<DbCommentRow>();

    if (error) {
      this.logger.error(`createComment error: ${error.message}`);
      throw new Error('CREATE_COMMENT_FAILED');
    }

    return {
      id: data.id,
      postId: data.post_id,
      parentId: data.parent_id,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const { data, error } = await this.supabase.client
      .from('community_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`getCommentsByPostId error: ${error.message}`);
      throw new Error('FETCH_COMMENTS_FAILED');
    }

    const rows = (data as DbCommentRow[]) || [];
    return rows.map((row) => ({
      id: row.id,
      postId: row.post_id,
      parentId: row.parent_id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  // ============================================================================
  // HÀM HELPER CHUYỂN ĐỔI ROW DB -> POST OBJECT
  // ============================================================================

  private mapToPost(row: DbPostRow): Post {
    return {
      id: row.id,
      topicId: row.topic_id,
      title: row.title,
      content: row.content,
      images: row.images || [],
      likesCount: row.likes_count || 0,
      commentsCount: row.comments_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      topic: row.topic
        ? {
            id: row.topic.id,
            name: row.topic.name,
            slug: row.topic.slug,
            description: row.topic.description,
            color: row.topic.color,
            displayOrder: row.topic.display_order,
          }
        : null,
    };
  }
}
