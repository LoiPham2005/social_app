import type {
  ConversationSummary,
  MessageEntity,
  Paginated,
} from '@social/shared';
import { api } from '@/lib/api';

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const { data } = await api.get<ConversationSummary[]>('/conversations');
  return data;
}

export async function getOrCreateConversation(
  userId: string,
): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>(`/conversations/with/${userId}`);
  return data;
}

export async function fetchMessages(
  conversationId: string,
  cursor?: string,
): Promise<Paginated<MessageEntity>> {
  const { data } = await api.get<Paginated<MessageEntity>>(
    `/conversations/${conversationId}/messages`,
    { params: cursor ? { cursor } : {} },
  );
  return data;
}

export async function sendMessageRest(
  conversationId: string,
  content: string,
  mediaUrl?: string | null,
): Promise<MessageEntity> {
  const { data } = await api.post<MessageEntity>(
    `/conversations/${conversationId}/messages`,
    { content, mediaUrl },
  );
  return data;
}

export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  await api.post(`/conversations/${conversationId}/read`);
}
