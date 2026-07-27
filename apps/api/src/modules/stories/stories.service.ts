import { Injectable } from '@nestjs/common';
import type { Story, User } from '@prisma/client';
import {
  FriendshipStatus,
  type StoryEntity,
  type StoryGroup,
} from '@social/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicUser } from '../../common/mappers/user.mapper';
import { CreateStoryDto } from './dto/create-story.dto';

type StoryWithAuthor = Story & { author: User };
const STORY_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateStoryDto): Promise<StoryEntity> {
    const story = await this.prisma.story.create({
      data: {
        authorId: userId,
        mediaUrl: dto.mediaUrl,
        caption: dto.caption ?? null,
        expiresAt: new Date(Date.now() + STORY_TTL_MS),
      },
      include: { author: true },
    });
    return this.map(story, false);
  }

  /** Story còn hạn của mình + bạn bè, gom theo tác giả. */
  async listGroups(userId: string): Promise<StoryGroup[]> {
    const friendIds = await this.getFriendIds(userId);
    const authorIds = [userId, ...friendIds];

    const stories = await this.prisma.story.findMany({
      where: { authorId: { in: authorIds }, expiresAt: { gt: new Date() } },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
    if (stories.length === 0) return [];

    const seenRows = await this.prisma.storyView.findMany({
      where: { userId, storyId: { in: stories.map((s) => s.id) } },
      select: { storyId: true },
    });
    const seen = new Set(seenRows.map((r) => r.storyId));

    // Gom theo tác giả, giữ thứ tự xuất hiện.
    const groups = new Map<string, StoryGroup>();
    for (const s of stories) {
      const entity = this.map(s, seen.has(s.id));
      const g = groups.get(s.authorId);
      if (g) {
        g.stories.push(entity);
        if (!entity.seen) g.hasUnseen = true;
      } else {
        groups.set(s.authorId, {
          author: toPublicUser(s.author),
          stories: [entity],
          hasUnseen: !entity.seen,
        });
      }
    }

    // Sắp: nhóm của mình trước, rồi nhóm còn tin chưa xem, rồi theo tin mới nhất.
    return Array.from(groups.values()).sort((a, b) => {
      if (a.author.id === userId) return -1;
      if (b.author.id === userId) return 1;
      if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
      const at = a.stories[a.stories.length - 1].createdAt;
      const bt = b.stories[b.stories.length - 1].createdAt;
      return bt.localeCompare(at);
    });
  }

  async markSeen(userId: string, storyId: string): Promise<void> {
    await this.prisma.storyView.upsert({
      where: { storyId_userId: { storyId, userId } },
      create: { storyId, userId },
      update: {},
    });
  }

  private async getFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: { requesterId: true, addresseeId: true },
    });
    return friendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId,
    );
  }

  private map(story: StoryWithAuthor, seen: boolean): StoryEntity {
    return {
      id: story.id,
      author: toPublicUser(story.author),
      mediaUrl: story.mediaUrl,
      caption: story.caption,
      createdAt: story.createdAt.toISOString(),
      expiresAt: story.expiresAt.toISOString(),
      seen,
    };
  }
}
