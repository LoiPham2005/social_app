'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/avatar';
import { Protected } from '@/components/protected';
import { TopNav } from '@/components/top-nav';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/api';
import {
  notificationHref,
  notificationIcon,
  notificationText,
} from '@/features/notifications/helpers';
import { timeAgo } from '@/lib/format';

function NotificationsContent() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['notifications'] });
    qc.invalidateQueries({ queryKey: ['notif-count'] });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <TopNav />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Thông báo</h1>
          <button
            onClick={() => markAllNotificationsRead().then(refresh)}
            className="text-sm font-medium text-brand hover:underline"
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900">
          {isLoading && (
            <p className="p-6 text-center text-gray-400">Đang tải…</p>
          )}
          {data?.length === 0 && !isLoading && (
            <p className="p-10 text-center text-gray-400">
              Chưa có thông báo nào.
            </p>
          )}
          {data?.map((n) => (
            <Link
              key={n.id}
              href={notificationHref(n)}
              onClick={() => markNotificationRead(n.id).then(refresh)}
              className={`flex items-start gap-3 border-b border-gray-100 px-4 py-3 transition last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 ${
                n.isRead ? '' : 'bg-brand/5'
              }`}
            >
              <div className="relative">
                <Avatar name={n.actor.fullName} url={n.actor.avatarUrl} size={44} />
                <span className="absolute -bottom-1 -right-1">
                  {notificationIcon(n.type)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="leading-snug">{notificationText(n)}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {timeAgo(n.createdAt)}
                </p>
              </div>
              {!n.isRead && (
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Protected>
      <NotificationsContent />
    </Protected>
  );
}
