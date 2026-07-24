import { Injectable, NotFoundException } from '@nestjs/common';
import type { Comment, User } from '@prisma/client';
import { NotificationType, type CommentEntity } from '@social/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicUser } from '../../common/mappers/user.mapper';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommentDto } from './dto/create-comment.dto';

type CommentWithAuthor = Comment & { author: User };

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async addComment(
    userId: string,
    postId: string,
    dto: CreateCommentDto,
  ): Promise<CommentEntity> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        parentId: dto.parentId ?? null,
        content: dto.content,
      },
      include: { author: true },
    });

    await this.notifications.create(
      post.authorId,
      userId,
      NotificationType.COMMENT,
      postId,
    );
    return this.mapComment(comment);
  }

  async listByPost(postId: string): Promise<CommentEntity[]> {
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
    return comments.map((c) => this.mapComment(c));
  }

  private mapComment(comment: CommentWithAuthor): CommentEntity {
    return {
      id: comment.id,
      postId: comment.postId,
      author: toPublicUser(comment.author),
      parentId: comment.parentId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
