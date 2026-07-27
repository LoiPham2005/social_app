import type { StoryEntity, StoryGroup } from '@social/shared';
import { api } from '@/lib/api';

export async function fetchStories(): Promise<StoryGroup[]> {
  const { data } = await api.get<StoryGroup[]>('/stories');
  return data;
}

export async function createStory(
  mediaUrl: string,
  caption?: string,
): Promise<StoryEntity> {
  const { data } = await api.post<StoryEntity>('/stories', { mediaUrl, caption });
  return data;
}

export async function markStorySeen(id: string): Promise<void> {
  await api.post(`/stories/${id}/seen`);
}
