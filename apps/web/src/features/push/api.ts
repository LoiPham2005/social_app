import { api } from '@/lib/api';

export async function getPushPublicKey(): Promise<string> {
  const { data } = await api.get<{ publicKey: string }>('/push/public-key');
  return data.publicKey;
}

export async function subscribePush(sub: PushSubscriptionJSON): Promise<void> {
  await api.post('/push/subscribe', {
    endpoint: sub.endpoint,
    keys: sub.keys,
  });
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  await api.post('/push/unsubscribe', { endpoint });
}
