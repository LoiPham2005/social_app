import type {
  Paginated,
  PostEntity,
  ProfileEntity,
  PublicUser,
  UpdateProfileDto,
} from '@social/shared';
import { api } from '@/lib/api';

export async function fetchProfile(username: string): Promise<ProfileEntity> {
  const { data } = await api.get<ProfileEntity>(`/users/${username}/profile`);
  return data;
}

export async function fetchUserPosts(
  userId: string,
  cursor?: string,
): Promise<Paginated<PostEntity>> {
  const { data } = await api.get<Paginated<PostEntity>>(
    `/posts/user/${userId}`,
    { params: cursor ? { cursor } : {} },
  );
  return data;
}

export async function updateMyProfile(
  dto: UpdateProfileDto,
): Promise<PublicUser> {
  const { data } = await api.patch<PublicUser>('/users/me', dto);
  return data;
}
