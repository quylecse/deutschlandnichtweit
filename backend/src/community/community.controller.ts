import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CommunityService } from './community.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { QueryPostsDto } from './dto/query-posts.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';

@Controller('community')
export class CommunityController {
    constructor(private readonly communityService: CommunityService) { }

    // ============================================================================
    // 1. CHỦ ĐỀ (PUBLIC)
    // ============================================================================

    @Get('topics')
    @HttpCode(HttpStatus.OK)
    async getTopics() {
        return await this.communityService.getTopics();
    }

    // ============================================================================
    // 2. BẢNG TIN BÀI VIẾT (INFINITE SCROLL)
    // ============================================================================

    @Get('posts')
    @UseGuards(OptionalJwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getFeed(
        @Query() queryDto: QueryPostsDto,
        @CurrentUser() user: AuthenticatedUser | null,
    ) {
        return await this.communityService.getFeed(queryDto, user?.id);
    }

    @Post('posts')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async createPost(
        @CurrentUser('id') userId: string,
        @Body() dto: CreatePostDto,
    ) {
        return await this.communityService.createPost(userId, dto);
    }

    @Get('posts/:id')
    @UseGuards(OptionalJwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getPostById(
        @Param('id', ParseUUIDPipe) postId: string,
        @CurrentUser() user: AuthenticatedUser | null,
    ) {
        return await this.communityService.getPostById(postId, user?.id);
    }

    @Delete('posts/:id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async deletePost(
        @Param('id', ParseUUIDPipe) postId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return await this.communityService.deletePost(user.id, user.roles, postId);
    }

    // ============================================================================
    // 3. THẢ TIM (YÊU CẦU ĐĂNG NHẬP)
    // ============================================================================

    @Post('posts/:id/like')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async toggleLike(
        @Param('id', ParseUUIDPipe) postId: string,
        @CurrentUser('id') userId: string,
    ) {
        return await this.communityService.toggleLike(userId, postId);
    }

    // ============================================================================
    // 4. BÌNH LUẬN (COMMENTS)
    // ============================================================================

    @Get('posts/:id/comments')
    @HttpCode(HttpStatus.OK)
    async getComments(@Param('id', ParseUUIDPipe) postId: string) {
        return await this.communityService.getComments(postId);
    }

    @Post('posts/:id/comments')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async addComment(
        @Param('id', ParseUUIDPipe) postId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: CreateCommentDto,
    ) {
        return await this.communityService.addComment(userId, postId, dto);
    }
}