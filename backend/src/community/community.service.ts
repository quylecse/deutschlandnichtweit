import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CommunityRepository } from './community.repository.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { QueryPostsDto } from './dto/query-posts.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import {
  Comment,
  FeedResponse,
  Post,
  Topic,
} from './types/community.interface.js';
import { Role } from '../user/types/user.interface.js';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(private readonly communityRepo: CommunityRepository) {}

  // ============================================================================
  // 1. CHỦ ĐỀ (TOPICS)
  // ============================================================================

  async getTopics(): Promise<Topic[]> {
    try {
      return await this.communityRepo.getTopics();
    } catch (err: unknown) {
      this.logger.error('Error fetching topics', err);
      throw new InternalServerErrorException('FETCH_TOPICS_FAILED');
    }
  }

  // ============================================================================
  // 2. BẢNG TIN (FEED & POSTS)
  // ============================================================================

  async getFeed(
    queryDto: QueryPostsDto,
    currentUserId?: string,
  ): Promise<FeedResponse> {
    try {
      return await this.communityRepo.getPosts({
        cursor: queryDto.cursor,
        limit: queryDto.limit || 10,
        topicSlug: queryDto.topicSlug,
        currentUserId,
      });
    } catch (err: unknown) {
      this.logger.error('Error fetching feed', err);
      throw new InternalServerErrorException('FETCH_FEED_FAILED');
    }
  }

  async getPostById(postId: string, currentUserId?: string): Promise<Post> {
    const post = await this.communityRepo.getPostById(postId, currentUserId);
    if (!post) {
      throw new NotFoundException('POST_NOT_FOUND');
    }
    return post;
  }

  async createPost(userId: string, dto: CreatePostDto): Promise<Post> {
    try {
      return await this.communityRepo.createPost(userId, dto);
    } catch (err: unknown) {
      this.logger.error('Error creating post', err);
      throw new InternalServerErrorException('CREATE_POST_FAILED');
    }
  }

  async deletePost(
    userId: string,
    userRoles: Role[],
    postId: string,
  ): Promise<{ code: string }> {
    // 1. Kiểm tra bài viết tồn tại
    const authorId = await this.communityRepo.getPostAuthorId(postId);
    if (!authorId) {
      throw new NotFoundException('POST_NOT_FOUND');
    }

    // 2. Kiểm tra quyền sở hữu (Bảo mật OWASP: Chống IDOR)
    const isAdmin = userRoles?.includes('admin');
    const isAuthor = authorId === userId;

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('FORBIDDEN_DELETE_POST');
    }

    // 3. Thực hiện xóa bài
    try {
      await this.communityRepo.deletePost(postId);
      return { code: 'POST_DELETED_SUCCESS' };
    } catch (err: unknown) {
      this.logger.error('Error deleting post', err);
      throw new InternalServerErrorException('DELETE_POST_FAILED');
    }
  }

  // ============================================================================
  // 3. THẢ TIM (TOGGLE LIKE)
  // ============================================================================

  async toggleLike(
    userId: string,
    postId: string,
  ): Promise<{ isLiked: boolean }> {
    // 1. Xác minh bài viết tồn tại trước khi thả tim
    const post = await this.communityRepo.getPostById(postId);
    if (!post) {
      throw new NotFoundException('POST_NOT_FOUND');
    }

    // 2. Kiểm tra xem người dùng đã thả tim chưa
    const hasLiked = await this.communityRepo.hasUserLikedPost(userId, postId);

    try {
      if (hasLiked) {
        await this.communityRepo.removeLike(userId, postId);
        return { isLiked: false };
      } else {
        await this.communityRepo.addLike(userId, postId);
        return { isLiked: true };
      }
    } catch (err: unknown) {
      this.logger.error('Error toggling like', err);
      throw new InternalServerErrorException('TOGGLE_LIKE_FAILED');
    }
  }

  // ============================================================================
  // 4. BÌNH LUẬN (COMMENTS)
  // ============================================================================

  async getComments(postId: string): Promise<Comment[]> {
    // 1. Kiểm tra bài viết tồn tại
    const post = await this.communityRepo.getPostById(postId);
    if (!post) {
      throw new NotFoundException('POST_NOT_FOUND');
    }

    try {
      return await this.communityRepo.getCommentsByPostId(postId);
    } catch (err: unknown) {
      this.logger.error('Error fetching comments', err);
      throw new InternalServerErrorException('FETCH_COMMENTS_FAILED');
    }
  }

  async addComment(
    userId: string,
    postId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    // 1. Xác minh bài viết có tồn tại không
    const post = await this.communityRepo.getPostById(postId);
    if (!post) {
      throw new NotFoundException('POST_NOT_FOUND');
    }

    try {
      return await this.communityRepo.createComment(userId, postId, dto);
    } catch (err: unknown) {
      this.logger.error('Error adding comment', err);
      throw new InternalServerErrorException('ADD_COMMENT_FAILED');
    }
  }
}

