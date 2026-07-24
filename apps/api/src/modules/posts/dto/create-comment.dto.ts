import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import type { CreateCommentDto as ICreateCommentDto } from '@social/shared';

export class CreateCommentDto implements ICreateCommentDto {
  @ApiProperty({ example: 'Bài viết hay quá!' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional({ description: 'ID comment cha (để trả lời)' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
