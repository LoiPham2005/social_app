'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ReactionType, type PostEntity } from '@social/shared';
import { Avatar } from '@/components/avatar';
import { timeAgo } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import { CommentSection } from './comment-section';
import { REACTIONS, ReactionPicker, reactionOf } from './reactions';
import { deletePost, reactToPost, unreactToPost } from './api';

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

export function PostCard({ post }: { post: PostEntity }) {
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
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
            <button
              onClick={() => {
                if (confirm('Xóa bài viết này?')) deleteMutation.mutate();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
              title="Xóa bài"
            >
              ✕
            </button>
          )}
        </header>

        {post.content && (
          <p className="mt-3 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
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
            <CommentSection postId={post.id} />
          </div>
        )}
      </div>
    </article>
  );
}
