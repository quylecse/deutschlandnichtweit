import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
    /**
     * Nội dung bình luận, không được để trống.
     */
    @IsNotEmpty()
    @IsString()
    @MaxLength(2000)
    content: string;

    /**
     * ID của bình luận cha nếu đây là một lượt trả lời (Reply).
     * Để trống nếu đây là bình luận trực tiếp vào bài viết.
     */
    @IsOptional()
    @IsUUID('4')
    parentId?: string;
}