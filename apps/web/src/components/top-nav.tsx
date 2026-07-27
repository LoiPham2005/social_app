'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/avatar';
import { LogoMark } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { fetchConversations } from '@/features/chat/api';
import { NotificationBell } from '@/features/notifications/notification-bell';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth-store';
import { usePresenceStore } from '@/store/presence-store';

const NAV = [
  { href: '/feed', icon: '🏠', label: 'Bảng tin' },
  { href: '/friends', icon: '👥', label: 'Bạn bè' },
  { href: '/messages', icon: '💬', label: 'Tin nhắn' },
];

export function TopNav() {
  const pathname = usePathname();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Tổng số tin nhắn chưa đọc (badge trên mục Tin nhắn).
  const conversations = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
  });
  const unreadMessages =
    conversations.data?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;

  // Đảm bảo socket kết nối app-wide + cập nhật badge tin nhắn + trạng thái online.
  useEffect(() => {
    const socket = getSocket();
    const onUpdate = () =>
      qc.invalidateQueries({ queryKey: ['conversations'] });
    const onList = (ids: string[]) => usePresenceStore.getState().setList(ids);
    const onPresence = (p: { userId: string; online: boolean }) =>
      usePresenceStore.getState().setOnline(p.userId, p.online);
    socket.on('conversation:updated', onUpdate);
    socket.on('presence:list', onList);
    socket.on('presence', onPresence);
    return () => {
      socket.off('conversation:updated', onUpdate);
      socket.off('presence:list', onList);
      socket.off('presence', onPresence);
    };
  }, [qc]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
        <Link href="/feed" className="mr-1 flex items-center gap-2">
          <LogoMark size={36} />
          <span className="hidden text-lg font-extrabold tracking-tight text-brand sm:block">
            Social
          </span>
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            const showBadge = item.href === '/messages' && unreadMessages > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition sm:px-4 ${
                  active
                    ? 'bg-brand/10 text-brand'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="hidden sm:block">{item.label}</span>
                {showBadge && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            title="Tìm kiếm"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg transition hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            🔍
          </Link>
          <ThemeToggle />
          <NotificationBell />
          <Link
            href={user ? `/u/${user.username}` : '/feed'}
            title="Trang cá nhân"
            className="rounded-full ring-2 ring-transparent transition hover:ring-brand"
          >
            <Avatar name={user?.fullName ?? '?'} url={user?.avatarUrl} size={36} />
          </Link>
          <Link
            href="/settings"
            title="Cài đặt"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg transition hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            ⚙️
          </Link>
        </div>
      </div>
    </header>
  );
}
