'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageEntity } from '@social/shared';
import { OnlineAvatar } from '@/components/online-avatar';
import { useConfirm } from '@/components/dialog-provider';
import { Protected } from '@/components/protected';
import {
  fetchConversationDetail,
  fetchMessages,
  leaveGroup,
  markConversationRead,
  sendMessageRest,
} from '@/features/chat/api';
import { uploadImage } from '@/features/uploads/api';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth-store';
import { usePresenceStore } from '@/store/presence-store';

function ChatRoom({ conversationId }: { conversationId: string }) {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const router = useRouter();
  const confirm = useConfirm();
  const [messages, setMessages] = useState<MessageEntity[]>([]);
  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Lịch sử tin nhắn
  const history = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
  });

  // Chi tiết hội thoại (tên nhóm / thành viên / người đối thoại)
  const detail = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => fetchConversationDetail(conversationId),
  });
  const isGroup = detail.data?.isGroup ?? false;
  const other = detail.data?.members.find((m) => m.id !== me?.id);
  const otherOnline = usePresenceStore((s) =>
    other ? s.online.has(other.id) : false,
  );
  const title = isGroup
    ? (detail.data?.name ?? 'Nhóm')
    : (other?.fullName ?? 'Trò chuyện');
  const subtitle = isGroup
    ? `${detail.data?.members.length ?? 0} thành viên`
    : otherTyping
      ? 'đang nhập…'
      : otherOnline
        ? 'Đang hoạt động'
        : '';

  async function handleLeave() {
    if (
      await confirm({
        title: 'Rời nhóm?',
        message: 'Bạn sẽ không nhận tin nhắn của nhóm này nữa.',
        confirmText: 'Rời nhóm',
        danger: true,
        icon: '🚪',
      })
    ) {
      await leaveGroup(conversationId);
      qc.invalidateQueries({ queryKey: ['conversations'] });
      router.replace('/messages');
    }
  }

  useEffect(() => {
    if (history.data) setMessages(history.data.items);
  }, [history.data]);

  // Kết nối socket: join room, nghe tin mới + typing
  useEffect(() => {
    const socket = getSocket();
    socket.emit('conversation:join', conversationId);
    void markConversationRead(conversationId);

    const onNew = (msg: MessageEntity) => {
      if (msg.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
      void markConversationRead(conversationId);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    };
    const onTyping = (p: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (p.conversationId === conversationId && p.userId !== me?.id) {
        setOtherTyping(p.isTyping);
      }
    };
    const onRead = (p: { conversationId: string; userId: string; at: string }) => {
      if (p.conversationId === conversationId && p.userId !== me?.id) {
        setOtherReadAt(p.at);
      }
    };

    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    socket.on('conversation:read', onRead);
    return () => {
      socket.emit('conversation:leave', conversationId);
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
      socket.off('conversation:read', onRead);
    };
  }, [conversationId, me?.id, qc]);

  // Tự cuộn xuống cuối khi có tin mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  function handleTyping(value: string) {
    setText(value);
    const socket = getSocket();
    socket.emit('typing', { conversationId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', { conversationId, isTyping: false });
    }, 1200);
  }

  async function send() {
    const content = text.trim();
    if (!content) return;
    setText('');
    getSocket().emit('typing', { conversationId, isTyping: false });
    await sendMessageRest(conversationId, content); // socket 'message:new' sẽ append
  }

  async function sendImage(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, 'messages');
      await sendMessageRest(conversationId, '', url);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <Link href="/messages" className="text-brand">
          ←
        </Link>
        {isGroup ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-indigo-400 text-white">
            👥
          </span>
        ) : (
          other && (
            <OnlineAvatar
              userId={other.id}
              name={other.fullName}
              url={other.avatarUrl}
              size={36}
            />
          )
        )}
        <div className="flex-1">
          <p className="font-semibold">{title}</p>
          {subtitle && (
            <p
              className={`text-xs ${otherTyping && !isGroup ? 'text-brand' : 'text-gray-400'}`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {isGroup && (
          <button
            onClick={handleLeave}
            title="Rời nhóm"
            className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            🚪 Rời
          </button>
        )}
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 px-4 py-4 dark:bg-gray-950">
        {history.isLoading && (
          <p className="text-center text-gray-400">Đang tải tin nhắn…</p>
        )}
        {messages.map((m) => {
          const mine = m.sender.id === me?.id;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] overflow-hidden rounded-2xl ${
                  mine
                    ? 'bg-brand text-white'
                    : 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                }`}
              >
                {isGroup && !mine && (
                  <p className="px-4 pt-2 text-xs font-semibold text-brand">
                    {m.sender.fullName}
                  </p>
                )}
                {m.mediaUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.mediaUrl}
                    alt=""
                    className="max-h-72 w-full object-cover"
                  />
                )}
                {m.content && (
                  <p className="whitespace-pre-wrap break-words px-4 py-2 text-sm">
                    {m.content}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && !history.isLoading && (
          <p className="py-8 text-center text-sm text-gray-400">
            Hãy gửi lời chào đầu tiên 👋
          </p>
        )}
        {!isGroup &&
          messages.length > 0 &&
          messages[messages.length - 1].sender.id === me?.id &&
          otherReadAt &&
          new Date(otherReadAt) >=
            new Date(messages[messages.length - 1].createdAt) && (
            <p className="pr-1 text-right text-xs text-gray-400">✓ Đã xem</p>
          )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex items-center gap-2 border-t border-gray-200 p-3 dark:border-gray-800"
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => sendImage(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          title="Gửi ảnh"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
        >
          {uploading ? '⏳' : '🖼️'}
        </button>
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Nhắn tin…"
          className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand dark:bg-gray-800"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          Gửi
        </button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const conversationId = String(params.id);
  return (
    <Protected>
      <ChatRoom conversationId={conversationId} />
    </Protected>
  );
}
