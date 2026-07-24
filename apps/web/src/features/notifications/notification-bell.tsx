'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/avatar';
import { timeAgo } from '@/lib/format';
import { getSocket } from '@/lib/socket';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './api';
import { notificationHref, notificationIcon, notificationText } from './helpers';

export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = useQuery({
    queryKey: ['notif-count'],
    queryFn: fetchUnreadCount,
  });
  const list = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: open,
  });

  // Realtime: nghe thông báo mới → cập nhật badge + danh sách.
  useEffect(() => {
    const socket = getSocket();
    const bump = () => {
      qc.invalidateQueries({ queryKey: ['notif-count'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('notification:new', bump);
    socket.on('notification:count', bump);
    return () => {
      socket.off('notification:new', bump);
      socket.off('notification:count', bump);
    };
  }, [qc]);

  // Đóng khi bấm ra ngoài.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const count = unread.data ?? 0;

  async function handleOpen() {
    setOpen((v) => !v);
  }

  async function markAll() {
    await markAllNotificationsRead();
    qc.invalidateQueries({ queryKey: ['notif-count'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg transition hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
        title="Thông báo"
      >
        🔔
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <span className="font-bold">Thông báo</span>
            {count > 0 && (
              <button
                onClick={markAll}
                className="text-xs font-medium text-brand hover:underline"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {list.isLoading && (
              <p className="p-4 text-center text-sm text-gray-400">Đang tải…</p>
            )}
            {list.data?.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-400">
                Chưa có thông báo nào.
              </p>
            )}
            {list.data?.map((n) => (
              <Link
                key={n.id}
                href={notificationHref(n)}
                onClick={() => {
                  void markNotificationRead(n.id).then(() => {
                    qc.invalidateQueries({ queryKey: ['notif-count'] });
                    qc.invalidateQueries({ queryKey: ['notifications'] });
                  });
                  setOpen(false);
                }}
                className={`flex items-start gap-3 px-4 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  n.isRead ? '' : 'bg-brand/5'
                }`}
              >
                <div className="relative">
                  <Avatar name={n.actor.fullName} url={n.actor.avatarUrl} size={40} />
                  <span className="absolute -bottom-1 -right-1 text-sm">
                    {notificationIcon(n.type)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{notificationText(n)}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
