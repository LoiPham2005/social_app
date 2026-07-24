import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { NotificationEntity, UnreadCount } from '@social/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@CurrentUser('id') userId: string): Promise<NotificationEntity[]> {
    return this.service.list(userId);
  }

  @Get('unread-count')
  async unread(@CurrentUser('id') userId: string): Promise<UnreadCount> {
    return { count: await this.service.unreadCount(userId) };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAll(@CurrentUser('id') userId: string): Promise<void> {
    return this.service.markAllRead(userId);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.service.markRead(userId, id);
  }
}
