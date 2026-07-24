import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Post, type User } from '@prisma/client';
import {
  FriendshipStatus,
  NotificationType,
  PostPrivacy,
  ReactionTarget,
  type Paginated,
  type PostEntity,
  type ReactionType,
} from '@social/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicUser } from '../../common/mappers/user.mapper';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePostDto } from './dto/create-post.dto';

type PostWithAuthor = Post & { author: User };

const FEED_PAGE_SIZE = 10;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createPost(userId: string, dto: CreatePostDto): Promise<PostEntity> {
    const post = await this.prisma.post.create({
      data: {
        authorId: userId,
        content: dto.content,
        mediaUrls: dto.mediaUrls ?? [],
        privacy: (dto.privacy as PostPrivacy) ?? PostPrivacy.PUBLIC,
      },
      include: { author: true },
    });
    return this.mapPost(post, 0, 0, null);
  }

  async getFeed(
    userId: string,
    cursor?: string,
  ): Promise<Paginated<PostEntity>> {
    const friendIds = await this.getFriendIds(userId);

    // Feed = bài của mình + bài của bạn bè + bài công khai.
    const where: Prisma.PostWhereInput = {
      OR: [
        { authorId: userId },
        { authorId: { in: friendIds } },
        { privacy: PostPrivacy.PUBLIC },
      ],
    };

    const posts = await this.prisma.post.findMany({
      where,
      include: { author: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: FEED_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > FEED_PAGE_SIZE;
    const pageItems = hasMore ? posts.slice(0, FEED_PAGE_SIZE) : posts;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null;

    const items = await this.attachCounts(userId, pageItems);
    return { items, nextCursor };
  }

  /** Bài của 1 user cụ thể, lọc theo quyền riêng tư nhìn từ người xem. */
  async getUserPosts(
    viewerId: string,
    targetId: string,
    cursor?: string,
  ): Promise<Paginated<PostEntity>> {
    const isMe = viewerId === targetId;
    const friendIds = isMe ? [] : await this.getFriendIds(viewerId);
    const isFriend = friendIds.includes(targetId);

    const privacyFilter: Prisma.PostWhereInput = isMe
      ? {}
      : isFriend
        ? { privacy: { in: [PostPrivacy.PUBLIC, PostPrivacy.FRIENDS] } }
        : { privacy: PostPrivacy.PUBLIC };

    const posts = await this.prisma.post.findMany({
      where: { authorId: targetId, ...privacyFilter },
      include: { author: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: FEED_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > FEED_PAGE_SIZE;
    const pageItems = hasMore ? posts.slice(0, FEED_PAGE_SIZE) : posts;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null;
    const items = await this.attachCounts(viewerId, pageItems);
    return { items, nextCursor };
  }

  async getPost(userId: string, postId: string): Promise<PostEntity> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    const [item] = await this.attachCounts(userId, [post]);
    return item;
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.authorId !== userId) {
      throw new ForbiddenException('Not your post');
    }
    await this.prisma.post.delete({ where: { id: postId } });
  }

  async react(
    userId: string,
    postId: string,
    type: ReactionType,
  ): Promise<PostEntity> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: ReactionTarget.POST,
          targetId: postId,
        },
      },
    });

    await this.prisma.reaction.upsert({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: ReactionTarget.POST,
          targetId: postId,
        },
      },
      create: {
        userId,
        targetType: ReactionTarget.POST,
        targetId: postId,
        type,
      },
      update: { type },
    });

    // Chỉ báo khi là lượt thích MỚI (không báo khi đổi loại cảm xúc).
    if (!existing) {
      await this.notifications.create(
        post.authorId,
        userId,
        NotificationType.LIKE,
        postId,
      );
    }
    return this.getPost(userId, postId);
  }

  async unreact(userId: string, postId: string): Promise<PostEntity> {
    await this.ensurePostExists(postId);
    await this.prisma.reaction.deleteMany({
      where: {
        userId,
        targetType: ReactionTarget.POST,
        targetId: postId,
      },
    });
    return this.getPost(userId, postId);
  }

  // ---------------- helpers ----------------

  private async ensurePostExists(postId: string): Promise<void> {
    const exists = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Post not found');
    }
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

  private async attachCounts(
    userId: string,
    posts: PostWithAuthor[],
  ): Promise<PostEntity[]> {
    const postIds = posts.map((p) => p.id);
    if (postIds.length === 0) return [];

    const [reactionGroups, commentGroups, myReactions] = await Promise.all([
      this.prisma.reaction.groupBy({
        by: ['targetId'],
        where: { targetType: ReactionTarget.POST, targetId: { in: postIds } },
        _count: { _all: true },
      }),
      this.prisma.comment.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds } },
        _count: { _all: true },
      }),
      this.prisma.reaction.findMany({
        where: {
          userId,
          targetType: ReactionTarget.POST,
          targetId: { in: postIds },
        },
        select: { targetId: true, type: true },
      }),
    ]);

    const reactionCount = new Map(
      reactionGroups.map((g) => [g.targetId, g._count._all]),
    );
    const commentCount = new Map(
      commentGroups.map((g) => [g.postId, g._count._all]),
    );
    const mine = new Map(myReactions.map((r) => [r.targetId, r.type]));

    return posts.map((p) =>
      this.mapPost(
        p,
        reactionCount.get(p.id) ?? 0,
        commentCount.get(p.id) ?? 0,
        (mine.get(p.id) as ReactionType | undefined) ?? null,
      ),
    );
  }

  private mapPost(
    post: PostWithAuthor,
    reactionCount: number,
    commentCount: number,
    myReaction: ReactionType | null,
  ): PostEntity {
    return {
      id: post.id,
      author: toPublicUser(post.author),
      content: post.content,
      mediaUrls: post.mediaUrls,
      privacy: post.privacy as PostPrivacy,
      reactionCount,
      commentCount,
      myReaction,
      createdAt: post.createdAt.toISOString(),
    };
  }
}
