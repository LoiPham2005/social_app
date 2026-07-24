import type {
  FriendRequestItem,
  FriendshipStatusResult,
  PublicUser,
} from '@social/shared';
import { api } from '@/lib/api';

export async function fetchFriends(): Promise<PublicUser[]> {
  const { data } = await api.get<PublicUser[]>('/friendships');
  return data;
}

export async function fetchRequests(
  type: 'incoming' | 'outgoing' = 'incoming',
): Promise<FriendRequestItem[]> {
  const { data } = await api.get<FriendRequestItem[]>('/friendships/requests', {
    params: { type },
  });
  return data;
}

export async function fetchSuggestions(): Promise<PublicUser[]> {
  const { data } = await api.get<PublicUser[]>('/friendships/suggestions');
  return data;
}

export async function fetchFriendStatus(
  targetId: string,
): Promise<FriendshipStatusResult> {
  const { data } = await api.get<FriendshipStatusResult>(
    `/friendships/status/${targetId}`,
  );
  return data;
}

export async function sendFriendRequest(targetId: string): Promise<void> {
  await api.post('/friendships/request', { targetId });
}

export async function acceptFriendRequest(targetId: string): Promise<void> {
  await api.post('/friendships/accept', { targetId });
}

export async function removeFriend(targetId: string): Promise<void> {
  await api.delete(`/friendships/${targetId}`);
}

export async function searchUsers(q: string): Promise<PublicUser[]> {
  const { data } = await api.get<PublicUser[]>('/users/search', {
    params: { q },
  });
  return data;
}
