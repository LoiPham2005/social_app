import type { User } from '@prisma/client';
import type { PublicUser } from '@social/shared';

/** Strip sensitive fields (passwordHash) before returning a user to clients. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
  };
}
