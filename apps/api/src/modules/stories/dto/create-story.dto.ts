import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import type { CreateStoryDto as ICreateStoryDto } from '@social/shared';

export class CreateStoryDto implements ICreateStoryDto {
  @ApiProperty()
  @IsUrl({ require_tld: false })
  mediaUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  caption?: string | null;
}
