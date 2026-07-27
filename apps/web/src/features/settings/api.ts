import { api } from '@/lib/api';

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}

export async function logoutAllDevices(): Promise<void> {
  await api.post('/auth/logout-all');
}

export async function deleteAccount(): Promise<void> {
  await api.delete('/users/me');
}
