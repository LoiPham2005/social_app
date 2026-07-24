import type { NotificationEntity, UnreadCount } from '@social/shared';
import { api } from '@/lib/api';

export async function fetchNotifications(): Promise<NotificationEntity[]> {
  const { data } = await api.get<NotificationEntity[]>('/notifications');
  return data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<UnreadCount>('/notifications/unread-count');
  return data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read-all');
}
