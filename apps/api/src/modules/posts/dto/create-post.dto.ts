import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PostPrivacy, type CreatePostDto as ICreatePostDto } from '@social/shared';

export class CreatePostDto implements ICreatePostDto {
  @ApiProperty({ example: 'Xin chào mọi người!' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  // require_tld: false để chấp nhận URL localhost (driver local); Cloudinary vẫn hợp lệ.
  @IsUrl({ require_tld: false }, { each: true })
  mediaUrls?: string[];

  @ApiPropertyOptional({ enum: PostPrivacy, default: PostPrivacy.PUBLIC })
  @IsOptional()
  @IsEnum(PostPrivacy)
  privacy?: PostPrivacy;
}
