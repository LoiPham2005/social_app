'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { FriendshipState } from '@social/shared';
import { Avatar } from '@/components/avatar';
import { Protected } from '@/components/protected';
import { TopNav } from '@/components/top-nav';
import { EmptyState, PostSkeleton } from '@/components/ui';
import {
  acceptFriendRequest,
  removeFriend,
  sendFriendRequest,
} from '@/features/friends/api';
import { getOrCreateConversation } from '@/features/chat/api';
import { fetchProfile, fetchUserPosts } from '@/features/profile/api';
import { PostCard } from '@/features/feed/post-card';

function ProfileContent({ username }: { username: string }) {
  const qc = useQueryClient();
  const router = useRouter();

  const profileQuery = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchProfile(username),
  });
  const profile = profileQuery.data;

  const postsQuery = useInfiniteQuery({
    queryKey: ['user-posts', profile?.user.id],
    queryFn: ({ pageParam }) => fetchUserPosts(profile!.user.id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!profile?.user.id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['profile', username] });
    qc.invalidateQueries({ queryKey: ['feed'] });
    qc.invalidateQueries({ queryKey: ['friends'] });
    qc.invalidateQueries({ queryKey: ['friend-requests'] });
  };

  const addMut = useMutation({ mutationFn: sendFriendRequest, onSuccess: invalidate });
  const acceptMut = useMutation({ mutationFn: acceptFriendRequest, onSuccess: invalidate });
  const removeMut = useMutation({ mutationFn: removeFriend, onSuccess: invalidate });
  const messageMut = useMutation({
    mutationFn: (targetId: string) => getOrCreateConversation(targetId),
    onSuccess: (conv) => router.push(`/messages/${conv.id}`),
  });
  const busy = addMut.isPending || acceptMut.isPending || removeMut.isPending;

  if (profileQuery.isLoading) {
    return <p className="py-16 text-center text-gray-400">Đang tải hồ sơ…</p>;
  }
  if (profileQuery.isError || !profile) {
    return (
      <p className="py-16 text-center text-red-500">Không tìm thấy người dùng.</p>
    );
  }

  const { user, friendCount, postCount, friendshipState, isMe } = profile;
  const posts = postsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const actionButton = () => {
    if (isMe) {
      return (
        <Link
          href="/settings/profile"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Chỉnh sửa hồ sơ
        </Link>
      );
    }
    switch (friendshipState) {
      case FriendshipState.FRIENDS:
        return (
          <button
            onClick={() => removeMut.mutate(user.id)}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            ✓ Bạn bè · Hủy
          </button>
        );
      case FriendshipState.REQUEST_SENT:
        return (
          <button
            onClick={() => removeMut.mutate(user.id)}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Đã gửi lời mời · Hủy
          </button>
        );
      case FriendshipState.REQUEST_RECEIVED:
        return (
          <button
            onClick={() => acceptMut.mutate(user.id)}
            disabled={busy}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            Chấp nhận lời mời
          </button>
        );
      default:
        return (
          <button
            onClick={() => addMut.mutate(user.id)}
            disabled={busy}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            + Kết bạn
          </button>
        );
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 pb-10">
      {/* Cover */}
      <div
        className="mt-4 h-44 w-full rounded-2xl bg-gradient-to-br from-brand via-blue-500 to-indigo-400 bg-cover bg-center shadow-soft"
        style={user.coverUrl ? { backgroundImage: `url(${user.coverUrl})` } : undefined}
      />

      {/* Header card nổi trên cover */}
      <div className="relative z-10 -mt-14 rounded-2xl bg-white px-5 pb-5 pt-0 shadow-card dark:bg-gray-900">
        <div className="flex items-end justify-between">
          <div className="-mt-10 rounded-full ring-4 ring-white dark:ring-gray-900">
            <Avatar name={user.fullName} url={user.avatarUrl} size={96} />
          </div>
          <div className="mb-1 flex gap-2 pt-4">
            {actionButton()}
            {!isMe && (
              <button
                onClick={() => messageMut.mutate(user.id)}
                disabled={messageMut.isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                💬 Nhắn tin
              </button>
            )}
          </div>
        </div>

        <h1 className="mt-3 text-2xl font-bold">{user.fullName}</h1>
        <p className="text-gray-400">@{user.username}</p>
        {user.bio && (
          <p className="mt-2 whitespace-pre-wrap text-gray-600 dark:text-gray-300">
            {user.bio}
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-xl bg-gray-50 px-3 py-2 text-center dark:bg-gray-800">
            <p className="text-lg font-bold">{friendCount}</p>
            <p className="text-xs text-gray-400">Bạn bè</p>
          </div>
          <div className="flex-1 rounded-xl bg-gray-50 px-3 py-2 text-center dark:bg-gray-800">
            <p className="text-lg font-bold">{postCount}</p>
            <p className="text-xs text-gray-400">Bài viết</p>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="mt-6 space-y-4">
        <h2 className="font-semibold text-gray-500">Bài viết</h2>
        {postsQuery.isLoading && <PostSkeleton />}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {!postsQuery.isLoading && posts.length === 0 && (
          <EmptyState icon="🗒️" title="Chưa có bài viết nào" />
        )}
        {postsQuery.hasNextPage && (
          <button
            onClick={() => postsQuery.fetchNextPage()}
            disabled={postsQuery.isFetchingNextPage}
            className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-brand shadow hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-900"
          >
            {postsQuery.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const username = String(params.username);
  return (
    <Protected>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
        <TopNav />
        <ProfileContent username={username} />
      </div>
    </Protected>
  );
}
