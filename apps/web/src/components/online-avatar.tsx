'use client';

import { Avatar } from '@/components/avatar';
import { usePresenceStore } from '@/store/presence-store';

/** Avatar kèm chấm xanh nếu user đang online. */
export function OnlineAvatar({
  userId,
  name,
  url,
  size = 40,
}: {
  userId?: string | null;
  name: string;
  url?: string | null;
  size?: number;
}) {
  const online = usePresenceStore((s) => (userId ? s.online.has(userId) : false));
  const dot = Math.max(10, Math.round(size * 0.28));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <Avatar name={name} url={url} size={size} />
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-900"
          style={{ width: dot, height: dot }}
        />
      )}
    </div>
  );
}
