'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OnlineAvatar } from '@/components/online-avatar';
import { Protected } from '@/components/protected';
import { TopNav } from '@/components/top-nav';
import { EmptyState } from '@/components/ui';
import { fetchConversations } from '@/features/chat/api';
import { CreateGroupModal } from '@/features/chat/create-group-modal';
import { timeAgo } from '@/lib/format';
import { getSocket } from '@/lib/socket';

function MessagesContent() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
  });

  // Cập nhật danh sách khi có tin mới ở bất kỳ hội thoại nào.
  useEffect(() => {
    const socket = getSocket();
    const onUpdate = () =>
      qc.invalidateQueries({ queryKey: ['conversations'] });
    socket.on('conversation:updated', onUpdate);
    return () => {
      socket.off('conversation:updated', onUpdate);
    };
  }, [qc]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <TopNav />
      <main className="mx-auto max-w-xl px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tin nhắn</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            ＋ Tạo nhóm
          </button>
        </div>
        {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
        {isLoading && <p className="text-center text-gray-400">Đang tải…</p>}
        {data?.length === 0 && !isLoading && (
          <EmptyState
            icon="💬"
            title="Chưa có cuộc trò chuyện"
            description="Vào trang cá nhân của bạn bè và bấm “Nhắn tin” để bắt đầu."
          />
        )}
        <div className="space-y-1">
          {data?.map((c) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 rounded-xl p-3 hover:bg-white dark:hover:bg-gray-900"
            >
              {c.isGroup ? (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-indigo-400 text-lg text-white">
                  👥
                </span>
              ) : (
                <OnlineAvatar
                  userId={c.otherUser?.id}
                  name={c.otherUser?.fullName ?? c.name ?? '?'}
                  url={c.otherUser?.avatarUrl}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate font-semibold">
                    {c.otherUser?.fullName ?? c.name ?? 'Hội thoại'}
                  </p>
                  {c.lastMessage && (
                    <span className="shrink-0 text-xs text-gray-400">
                      {timeAgo(c.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <p
                  className={`truncate text-sm ${
                    c.unreadCount > 0
                      ? 'font-semibold text-gray-900 dark:text-gray-100'
                      : 'text-gray-400'
                  }`}
                >
                  {c.lastMessage
                    ? c.lastMessage.content || '📷 Hình ảnh'
                    : 'Bắt đầu trò chuyện…'}
                </p>
              </div>
              {c.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                  {c.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Protected>
      <MessagesContent />
    </Protected>
  );
}
