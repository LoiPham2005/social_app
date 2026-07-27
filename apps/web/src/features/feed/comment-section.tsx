'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Avatar } from '@/components/avatar';
import { useConfirm } from '@/components/dialog-provider';
import { timeAgo } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import { addComment, deleteComment, fetchComments } from './api';

export function CommentSection({
  postId,
  postAuthorId,
}: {
  postId: string;
  postAuthorId?: string;
}) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const me = useAuthStore((s) => s.user);
  const [text, setText] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['post', postId] });
  };

  const mutation = useMutation({
    mutationFn: () => addComment(postId, { content: text.trim() }),
    onSuccess: () => {
      setText('');
      invalidate();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: invalidate,
  });

  return (
    <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) mutation.mutate();
        }}
        className="flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Viết bình luận…"
          className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand dark:bg-gray-800"
        />
        <button
          type="submit"
          disabled={!text.trim() || mutation.isPending}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Gửi
        </button>
      </form>

      <div className="mt-3 space-y-3">
        {isLoading && (
          <p className="text-sm text-gray-400">Đang tải bình luận…</p>
        )}
        {comments?.map((c) => {
          const canDelete =
            me?.id === c.author.id || me?.id === postAuthorId;
          return (
            <div key={c.id} className="group flex gap-2">
              <Link href={`/u/${c.author.username}`} className="shrink-0">
                <Avatar
                  name={c.author.fullName}
                  url={c.author.avatarUrl}
                  size={32}
                />
              </Link>
              <div className="rounded-2xl bg-gray-100 px-3 py-2 dark:bg-gray-800">
                <Link
                  href={`/u/${c.author.username}`}
                  className="text-sm font-semibold hover:underline"
                >
                  {c.author.fullName}
                </Link>
                <p className="text-sm">{c.content}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {timeAgo(c.createdAt)}
                </p>
              </div>
              {canDelete && (
                <button
                  onClick={async () => {
                    if (
                      await confirm({
                        title: 'Xóa bình luận?',
                        confirmText: 'Xóa',
                        danger: true,
                        icon: '🗑️',
                      })
                    ) {
                      deleteMut.mutate(c.id);
                    }
                  }}
                  className="self-center text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                  title="Xóa bình luận"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
        {comments?.length === 0 && !isLoading && (
          <p className="text-sm text-gray-400">Chưa có bình luận nào.</p>
        )}
      </div>
    </div>
  );
}
