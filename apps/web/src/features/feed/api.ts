import type {
  CommentEntity,
  CreateCommentDto,
  CreatePostDto,
  Paginated,
  PostEntity,
  ReactionType,
} from '@social/shared';
import { api } from '@/lib/api';

export async function fetchFeed(cursor?: string): Promise<Paginated<PostEntity>> {
  const { data } = await api.get<Paginated<PostEntity>>('/posts/feed', {
    params: cursor ? { cursor } : {},
  });
  return data;
}

export async function searchPosts(q: string): Promise<PostEntity[]> {
  const { data } = await api.get<PostEntity[]>('/posts/search', {
    params: { q },
  });
  return data;
}

export async function createPost(dto: CreatePostDto): Promise<PostEntity> {
  const { data } = await api.post<PostEntity>('/posts', dto);
  return data;
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/posts/${id}`);
}

export async function updatePost(
  id: string,
  data: { content?: string; privacy?: string; mediaUrls?: string[] },
): Promise<PostEntity> {
  const { data: res } = await api.patch<PostEntity>(`/posts/${id}`, data);
  return res;
}

export async function fetchPost(id: string): Promise<PostEntity> {
  const { data } = await api.get<PostEntity>(`/posts/${id}`);
  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(`/posts/comments/${commentId}`);
}

export async function reactToPost(
  id: string,
  type: ReactionType,
): Promise<PostEntity> {
  const { data } = await api.put<PostEntity>(`/posts/${id}/reaction`, { type });
  return data;
}

export async function unreactToPost(id: string): Promise<PostEntity> {
  const { data } = await api.delete<PostEntity>(`/posts/${id}/reaction`);
  return data;
}

export async function fetchComments(postId: string): Promise<CommentEntity[]> {
  const { data } = await api.get<CommentEntity[]>(`/posts/${postId}/comments`);
  return data;
}

export async function addComment(
  postId: string,
  dto: CreateCommentDto,
): Promise<CommentEntity> {
  const { data } = await api.post<CommentEntity>(
    `/posts/${postId}/comments`,
    dto,
  );
  return data;
}
