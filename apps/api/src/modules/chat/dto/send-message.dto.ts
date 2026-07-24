import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import type { SendMessageDto as ISendMessageDto } from '@social/shared';

export class SendMessageDto implements ISendMessageDto {
  @ApiPropertyOptional({ example: 'Chào bạn!' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  mediaUrl?: string | null;
}
