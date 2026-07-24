import { Injectable } from '@nestjs/common';
import type { Notification, User } from '@prisma/client';
import {
  NotificationType,
  type NotificationEntity,
} from '@social/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicUser } from '../../common/mappers/user.mapper';
import { ChatGateway } from '../chat/chat.gateway';
import { PushService } from '../push/push.service';

type NotificationWithActor = Notification & { actor: User };

const PUSH_TEXT: Record<NotificationType, string> = {
  [NotificationType.LIKE]: 'đã thích bài viết của bạn',
  [NotificationType.COMMENT]: 'đã bình luận bài viết của bạn',
  [NotificationType.FRIEND_REQUEST]: 'đã gửi cho bạn lời mời kết bạn',
  [NotificationType.FRIEND_ACCEPT]: 'đã chấp nhận lời mời kết bạn',
  [NotificationType.MESSAGE]: 'đã gửi cho bạn một tin nhắn',
  [NotificationType.TAG]: 'đã nhắc đến bạn',
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ChatGateway,
    private readonly push: PushService,
  ) {}

  /** Tạo thông báo + đẩy realtime tới người nhận. Bỏ qua nếu tự thao tác với mình. */
  async create(
    recipientId: string,
    actorId: string,
    type: NotificationType,
    targetId?: string | null,
  ): Promise<void> {
    if (recipientId === actorId) return;

    const notification = await this.prisma.notification.create({
      data: {
        userId: recipientId,
        actorId,
        type: type as any,
        targetId: targetId ?? null,
      },
      include: { actor: true },
    });

    this.gateway.emitToUser(
      recipientId,
      'notification:new',
      this.map(notification),
    );
    const count = await this.unreadCount(recipientId);
    this.gateway.emitToUser(recipientId, 'notification:count', { count });

    // Web Push (khi tab đóng / không mở app).
    void this.push.sendToUser(recipientId, {
      title: 'Social App',
      body: `${notification.actor.fullName} ${PUSH_TEXT[type]}`,
      url: '/notifications',
    });
  }

  async list(userId: string): Promise<NotificationEntity[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return rows.map((n) => this.map(n));
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  private map(n: NotificationWithActor): NotificationEntity {
    return {
      id: n.id,
      type: n.type as NotificationType,
      actor: toPublicUser(n.actor),
      targetId: n.targetId,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    };
  }
}
