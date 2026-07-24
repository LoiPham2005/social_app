import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import type { FriendRequestDto as IFriendRequestDto } from '@social/shared';

export class FriendRequestDto implements IFriendRequestDto {
  @ApiProperty({ description: 'ID người muốn kết bạn / phản hồi' })
  @IsUUID()
  targetId!: string;
}
