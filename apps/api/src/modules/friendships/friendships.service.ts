import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Friendship } from '@prisma/client';
import {
  FriendshipState,
  FriendshipStatus,
  NotificationType,
  type FriendRequestItem,
  type FriendshipStatusResult,
  type PublicUser,
} from '@social/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicUser } from '../../common/mappers/user.mapper';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FriendshipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Gửi lời mời kết bạn tới targetId. */
  async sendRequest(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) {
      throw new BadRequestException('Không thể kết bạn với chính mình');
    }
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.findBetween(userId, targetId);
    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('Đã là bạn bè');
      }
      throw new ConflictException('Lời mời đã tồn tại');
    }

    await this.prisma.friendship.create({
      data: {
        requesterId: userId,
        addresseeId: targetId,
        status: FriendshipStatus.PENDING,
      },
    });

    await this.notifications.create(
      targetId,
      userId,
      NotificationType.FRIEND_REQUEST,
      userId,
    );
  }

  /** Chấp nhận lời mời ĐẾN từ targetId. */
  async accept(userId: string, targetId: string): Promise<void> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        requesterId: targetId,
        addresseeId: userId,
        status: FriendshipStatus.PENDING,
      },
    });
    if (!friendship) {
      throw new NotFoundException('Không tìm thấy lời mời');
    }
    await this.prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: FriendshipStatus.ACCEPTED },
    });

    // Báo lại cho người đã gửi lời mời rằng đã được chấp nhận.
    await this.notifications.create(
      targetId,
      userId,
      NotificationType.FRIEND_ACCEPT,
      userId,
    );
  }

  /** Hủy quan hệ với targetId (từ chối lời mời / hủy lời mời đã gửi / hủy kết bạn). */
  async remove(userId: string, targetId: string): Promise<void> {
    const existing = await this.findBetween(userId, targetId);
    if (!existing) {
      throw new NotFoundException('Không có quan hệ nào');
    }
    await this.prisma.friendship.delete({ where: { id: existing.id } });
  }

  /** Danh sách bạn bè (đã chấp nhận). */
  async listFriends(userId: string): Promise<PublicUser[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: { requester: true, addressee: true },
      orderBy: { updatedAt: 'desc' },
    });
    return friendships.map((f) =>
      toPublicUser(f.requesterId === userId ? f.addressee : f.requester),
    );
  }

  /** Lời mời đến (incoming) hoặc đã gửi (outgoing). */
  async listRequests(
    userId: string,
    direction: 'incoming' | 'outgoing',
  ): Promise<FriendRequestItem[]> {
    const where =
      direction === 'incoming'
        ? { addresseeId: userId, status: FriendshipStatus.PENDING }
        : { requesterId: userId, status: FriendshipStatus.PENDING };

    const friendships = await this.prisma.friendship.findMany({
      where,
      include: { requester: true, addressee: true },
      orderBy: { createdAt: 'desc' },
    });

    return friendships.map((f) => ({
      friendshipId: f.id,
      user: toPublicUser(direction === 'incoming' ? f.requester : f.addressee),
      createdAt: f.createdAt.toISOString(),
    }));
  }

  /** Gợi ý kết bạn: user chưa có quan hệ nào với mình. */
  async suggestions(userId: string, limit = 20): Promise<PublicUser[]> {
    const related = await this.prisma.friendship.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
      select: { requesterId: true, addresseeId: true },
    });
    const excludeIds = new Set<string>([userId]);
    related.forEach((f) => {
      excludeIds.add(f.requesterId);
      excludeIds.add(f.addresseeId);
    });

    const users = await this.prisma.user.findMany({
      where: { id: { notIn: Array.from(excludeIds) } },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return users.map(toPublicUser);
  }

  /** Trạng thái quan hệ với 1 người (dùng cho nút trên profile / kết quả tìm kiếm). */
  async statusWith(
    userId: string,
    targetId: string,
  ): Promise<FriendshipStatusResult> {
    if (userId === targetId) {
      return { state: FriendshipState.NONE };
    }
    const existing = await this.findBetween(userId, targetId);
    if (!existing) {
      return { state: FriendshipState.NONE };
    }
    if (existing.status === FriendshipStatus.ACCEPTED) {
      return { state: FriendshipState.FRIENDS };
    }
    if (existing.status === FriendshipStatus.BLOCKED) {
      return { state: FriendshipState.BLOCKED };
    }
    // PENDING: ai là người gửi?
    return {
      state:
        existing.requesterId === userId
          ? FriendshipState.REQUEST_SENT
          : FriendshipState.REQUEST_RECEIVED,
    };
  }

  /** Đếm số bạn (đã chấp nhận) của 1 user. */
  countFriends(userId: string): Promise<number> {
    return this.prisma.friendship.count({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });
  }

  // ---------------- helpers ----------------

  private findBetween(a: string, b: string): Promise<Friendship | null> {
    return this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: a, addresseeId: b },
          { requesterId: b, addresseeId: a },
        ],
      },
    });
  }
}
