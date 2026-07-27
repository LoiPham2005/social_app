import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Message, User } from '@prisma/client';
import type {
  ConversationDetail,
  ConversationSummary,
  MessageEntity,
  Paginated,
} from '@social/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicUser } from '../../common/mappers/user.mapper';

type MessageWithSender = Message & { sender: User };
const PAGE_SIZE = 30;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lấy (hoặc tạo mới) hội thoại 1-1 giữa 2 người. */
  async getOrCreateDirect(
    userId: string,
    otherUserId: string,
  ): Promise<{ id: string }> {
    if (userId === otherUserId) {
      throw new ForbiddenException('Không thể nhắn tin cho chính mình');
    }
    const other = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    });
    if (!other) {
      throw new NotFoundException('User not found');
    }

    // Tìm hội thoại 1-1 đã có cả 2 thành viên.
    const existing = await this.prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: otherUserId } } },
        ],
      },
      select: { id: true },
    });
    if (existing) return existing;

    const created = await this.prisma.conversation.create({
      data: {
        isGroup: false,
        members: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
      select: { id: true },
    });
    return created;
  }

  /** Tạo nhóm chat với tên + danh sách thành viên. */
  async createGroup(
    userId: string,
    name: string,
    memberIds: string[],
  ): Promise<{ id: string }> {
    const uniqueMembers = Array.from(new Set([userId, ...memberIds]));
    if (uniqueMembers.length < 3) {
      throw new BadRequestException('Nhóm cần ít nhất 3 thành viên');
    }
    const conv = await this.prisma.conversation.create({
      data: {
        isGroup: true,
        name: name.trim() || 'Nhóm mới',
        members: { create: uniqueMembers.map((id) => ({ userId: id })) },
      },
      select: { id: true },
    });
    return conv;
  }

  /** Chi tiết 1 hội thoại (tên + thành viên) cho header. */
  async getDetail(
    userId: string,
    conversationId: string,
  ): Promise<ConversationDetail> {
    await this.ensureMember(userId, conversationId);
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: { include: { user: true } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return {
      id: conv.id,
      isGroup: conv.isGroup,
      name: conv.name,
      members: conv.members.map((m) => toPublicUser(m.user)),
    };
  }

  /** Rời khỏi nhóm. */
  async leaveGroup(userId: string, conversationId: string): Promise<void> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { isGroup: true },
    });
    if (!conv?.isGroup) {
      throw new BadRequestException('Chỉ có thể rời nhóm');
    }
    await this.prisma.conversationMember.deleteMany({
      where: { conversationId, userId },
    });
  }

  /** Danh sách hội thoại của user, kèm tin cuối + số chưa đọc. */
  async listConversations(userId: string): Promise<ConversationSummary[]> {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            members: { include: { user: true } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: true },
            },
          },
        },
      },
    });

    const summaries = await Promise.all(
      memberships.map(async (m) => {
        const conv = m.conversation;
        const other = conv.isGroup
          ? null
          : (conv.members.find((mem) => mem.userId !== userId)?.user ?? null);
        const last = conv.messages[0] as MessageWithSender | undefined;

        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
          },
        });

        return {
          id: conv.id,
          isGroup: conv.isGroup,
          name: conv.name,
          otherUser: other ? toPublicUser(other) : null,
          lastMessage: last ? this.mapMessage(last) : null,
          unreadCount,
          _sort: last?.createdAt.getTime() ?? conv.createdAt.getTime(),
        };
      }),
    );

    return summaries
      .sort((a, b) => b._sort - a._sort)
      .map(({ _sort, ...rest }) => rest);
  }

  async getMessages(
    userId: string,
    conversationId: string,
    cursor?: string,
  ): Promise<Paginated<MessageEntity>> {
    await this.ensureMember(userId, conversationId);

    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > PAGE_SIZE;
    const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    // Trả về theo thứ tự cũ → mới cho tiện render.
    const items = page.reverse().map((m) => this.mapMessage(m));
    return { items, nextCursor };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    content?: string,
    mediaUrl?: string | null,
  ): Promise<MessageEntity> {
    await this.ensureMember(userId, conversationId);
    const text = (content ?? '').trim();
    if (!text && !mediaUrl) {
      throw new ForbiddenException('Tin nhắn rỗng');
    }
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: text,
        mediaUrl: mediaUrl ?? null,
      },
      include: { sender: true },
    });
    return this.mapMessage(message);
  }

  async markRead(userId: string, conversationId: string): Promise<void> {
    await this.ensureMember(userId, conversationId);
    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  /** Trả về danh sách userId thành viên (để gateway biết bắn cho ai). */
  async getMemberIds(conversationId: string): Promise<string[]> {
    const members = await this.prisma.conversationMember.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  async isMember(userId: string, conversationId: string): Promise<boolean> {
    const member = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { userId: true },
    });
    return !!member;
  }

  // ---------------- helpers ----------------

  private async ensureMember(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    if (!(await this.isMember(userId, conversationId))) {
      throw new ForbiddenException('Không thuộc hội thoại này');
    }
  }

  private mapMessage(m: MessageWithSender): MessageEntity {
    return {
      id: m.id,
      conversationId: m.conversationId,
      sender: toPublicUser(m.sender),
      content: m.content,
      mediaUrl: m.mediaUrl,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
