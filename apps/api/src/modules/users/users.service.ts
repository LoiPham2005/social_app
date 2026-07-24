import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FriendshipState,
  PostPrivacy,
  type ProfileEntity,
  type PublicUser,
} from '@social/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicUser } from '../../common/mappers/user.mapper';
import { FriendshipsService } from '../friendships/friendships.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friendships: FriendshipsService,
  ) {}

  /** Hồ sơ đầy đủ của 1 user, nhìn từ góc độ người xem (viewerId). */
  async getProfile(viewerId: string, username: string): Promise<ProfileEntity> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMe = user.id === viewerId;
    const [{ state }, friendCount] = await Promise.all([
      this.friendships.statusWith(viewerId, user.id),
      this.friendships.countFriends(user.id),
    ]);

    // Số bài đếm theo đúng những gì người xem được phép thấy.
    const isFriend = state === FriendshipState.FRIENDS;
    const privacyFilter = isMe
      ? {}
      : isFriend
        ? { privacy: { in: [PostPrivacy.PUBLIC, PostPrivacy.FRIENDS] } }
        : { privacy: PostPrivacy.PUBLIC };
    const postCount = await this.prisma.post.count({
      where: { authorId: user.id, ...privacyFilter },
    });

    return {
      user: toPublicUser(user),
      friendCount,
      postCount,
      friendshipState: state,
      isMe,
    };
  }

  async getPublicById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toPublicUser(user);
  }

  async getPublicByUsername(username: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toPublicUser(user);
  }

  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
    });
    return toPublicUser(user);
  }

  async search(query: string, limit = 20): Promise<PublicUser[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return users.map(toPublicUser);
  }
}
