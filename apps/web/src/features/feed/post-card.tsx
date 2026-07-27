'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ReactionType, type PostEntity } from '@social/shared';
import { Avatar } from '@/components/avatar';
import { useConfirm } from '@/components/dialog-provider';
import { timeAgo } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import { CommentSection } from './comment-section';
import { REACTIONS, ReactionPicker, reactionOf } from './reactions';
import { deletePost, reactToPost, unreactToPost, updatePost } from './api';

const PRIVACY_ICON: Record<string, string> = {
  PUBLIC: '🌍',
  FRIENDS: '👥',
  PRIVATE: '🔒',
};

function MediaGrid({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  const cols = urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2';
  return (
    <div className={`mt-3 grid gap-1 overflow-hidden rounded-xl ${cols}`}>
      {urls.slice(0, 4).map((url, i) => (
        <div
          key={url}
          className={`relative ${urls.length === 3 && i === 0 ? 'col-span-2' : ''}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className="h-full max-h-96 w-full object-cover"
          />
          {i === 3 && urls.length > 4 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-bold text-white">
              +{urls.length - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function PostCard({
  post,
  defaultOpenComments = false,
}: {
  post: PostEntity;
  defaultOpenComments?: boolean;
}) {
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [showComments, setShowComments] = useState(defaultOpenComments);
  const [showPicker, setShowPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);

  const liked = post.myReaction != null;
  const myReaction = reactionOf(post.myReaction);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['user-posts'] });
  };

  const reactMutation = useMutation({
    mutationFn: (type: ReactionType) =>
      post.myReaction === type
        ? unreactToPost(post.id)
        : reactToPost(post.id, type),
    onSuccess: invalidate,
  });

  const toggleLike = useMutation({
    mutationFn: () =>
      liked ? unreactToPost(post.id) : reactToPost(post.id, ReactionType.LIKE),
    onSuccess: invalidate,
  });

  // Các emoji xuất hiện trên bài (để hiện ở dòng tóm tắt).
  const summaryEmojis = REACTIONS.filter(
    (r) => (post.reactions[r.type] ?? 0) > 0,
  ).map((r) => r.emoji);

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(post.id),
    onSuccess: invalidate,
  });

  const editMutation = useMutation({
    mutationFn: () => updatePost(post.id, { content: editText.trim() }),
    onSuccess: () => {
      setEditing(false);
      invalidate();
    },
  });

  const isOwner = currentUser?.id === post.author.id;

  return (
    <article className="animate-fade-up overflow-hidden rounded-2xl bg-white shadow-card dark:bg-gray-900">
      <div className="p-4">
        <header className="flex items-center gap-3">
          <Link href={`/u/${post.author.username}`} className="shrink-0">
            <Avatar name={post.author.fullName} url={post.author.avatarUrl} size={44} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/u/${post.author.username}`}
              className="font-semibold hover:underline"
            >
              {post.author.fullName}
            </Link>
            <p className="flex items-center gap-1 text-xs text-gray-400">
              <span>@{post.author.username}</span>
              <span>·</span>
              <span>{timeAgo(post.createdAt)}</span>
              <span>·</span>
              <span>{PRIVACY_ICON[post.privacy] ?? ''}</span>
            </p>
          </div>
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Tùy chọn"
              >
                ⋯
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-soft dark:border-gray-700 dark:bg-gray-800">
                    <button
                      onClick={() => {
                        setEditing(true);
                        setEditText(post.content);
                        setMenuOpen(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      ✏️ Sửa bài
                    </button>
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        if (
                          await confirm({
                            title: 'Xóa bài viết?',
                            message: 'Bài viết sẽ bị xóa vĩnh viễn.',
                            confirmText: 'Xóa',
                            danger: true,
                            icon: '🗑️',
                          })
                        ) {
                          deleteMutation.mutate();
                        }
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      🗑️ Xóa bài
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </header>

        {editing ? (
          <div className="mt-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl bg-gray-100 px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand dark:bg-gray-800"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={() => editMutation.mutate()}
                disabled={!editText.trim() || editMutation.isPending}
                className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {editMutation.isPending ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </div>
        ) : (
          post.content && (
            <p className="mt-3 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          )
        )}
      </div>

      {post.mediaUrls.length > 0 && (
        <div className="px-4 pb-1">
          <MediaGrid urls={post.mediaUrls} />
        </div>
      )}

      <div className="px-4">
        {(post.reactionCount > 0 || post.commentCount > 0) && (
          <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
            {post.reactionCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="flex -space-x-1">
                  {summaryEmojis.slice(0, 3).map((e) => (
                    <span
                      key={e}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
                    >
                      {e}
                    </span>
                  ))}
                </span>
                {post.reactionCount}
              </span>
            )}
            {post.commentCount > 0 && (
              <button
                onClick={() => setShowComments(true)}
                className="ml-auto hover:underline"
              >
                {post.commentCount} bình luận
              </button>
            )}
          </div>
        )}

        <div className="flex border-t border-gray-100 py-1 dark:border-gray-800">
          {/* Nút Thích + bảng chọn cảm xúc khi rê chuột */}
          <div
            className="relative flex-1"
            onMouseEnter={() => setShowPicker(true)}
            onMouseLeave={() => setShowPicker(false)}
          >
            {showPicker && (
              <ReactionPicker
                onPick={(type) => {
                  setShowPicker(false);
                  reactMutation.mutate(type);
                }}
              />
            )}
            <button
              onClick={() => toggleLike.mutate()}
              disabled={toggleLike.isPending || reactMutation.isPending}
              className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                liked ? myReaction.color : 'text-gray-500'
              }`}
            >
              <span className={liked ? 'inline-block animate-pop-in' : ''}>
                {liked ? myReaction.emoji : '👍'}
              </span>
              {liked ? myReaction.label : 'Thích'}
            </button>
          </div>
          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            💬 Bình luận
          </button>
        </div>

        {showComments && (
          <div className="pb-2">
            <CommentSection postId={post.id} postAuthorId={post.author.id} />
          </div>
        )}
      </div>
    </article>
  );
}
