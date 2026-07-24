'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageEntity } from '@social/shared';
import { Avatar } from '@/components/avatar';
import { Protected } from '@/components/protected';
import {
  fetchConversations,
  fetchMessages,
  markConversationRead,
  sendMessageRest,
} from '@/features/chat/api';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth-store';

function ChatRoom({ conversationId }: { conversationId: string }) {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [messages, setMessages] = useState<MessageEntity[]>([]);
  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Lịch sử tin nhắn
  const history = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
  });

  // Thông tin người đối thoại (lấy từ danh sách hội thoại)
  const conversations = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
  });
  const other = conversations.data?.find((c) => c.id === conversationId)
    ?.otherUser;

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

    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    return () => {
      socket.emit('conversation:leave', conversationId);
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
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

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <Link href="/messages" className="text-brand">
          ←
        </Link>
        {other && <Avatar name={other.fullName} url={other.avatarUrl} size={36} />}
        <div>
          <p className="font-semibold">{other?.fullName ?? 'Trò chuyện'}</p>
          {otherTyping && (
            <p className="text-xs text-brand">đang nhập…</p>
          )}
        </div>
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
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  mine
                    ? 'bg-brand text-white'
                    : 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm">
                  {m.content}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && !history.isLoading && (
          <p className="py-8 text-center text-sm text-gray-400">
            Hãy gửi lời chào đầu tiên 👋
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex gap-2 border-t border-gray-200 p-3 dark:border-gray-800"
      >
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
