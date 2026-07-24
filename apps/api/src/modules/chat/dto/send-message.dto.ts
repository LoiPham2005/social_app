import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import type { SendMessageDto as ISendMessageDto } from '@social/shared';

export class SendMessageDto implements ISendMessageDto {
  @ApiProperty({ example: 'Chào bạn!' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  mediaUrl?: string | null;
}
