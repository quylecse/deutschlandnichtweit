import { Type } from 'class-transformer';
import {
    IsInt,
    IsISO8601,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class QueryPostsDto {
    /**
     * Mốc thời gian (ISO 8601) của bài viết cuối cùng client đã tải.
     * Dùng để query các bài viết tiếp theo cho tính năng Infinite Scroll.
     */
    @IsOptional()
    @IsISO8601()
    cursor?: string;

    /**
     * Lọc bài viết theo slug của chủ đề (VD: 'aufnahmetest', 'visa-aps').
     * Nếu để trống, sẽ lấy bài viết của tất cả chủ đề.
     */
    @IsOptional()
    @IsString()
    topicSlug?: string;

    /**
     * Số lượng bài viết lấy trong 1 lần tải (mặc định 10, tối đa 50).
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit: number = 10;
}