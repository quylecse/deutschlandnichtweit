import {
    ArrayMaxSize,
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class CreatePostDto {
    @IsOptional()
    @IsUUID('4')
    topicId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    title?: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(5000)
    content: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ArrayMaxSize(4)
    images?: string[];
}