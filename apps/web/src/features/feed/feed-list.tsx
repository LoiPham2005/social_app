'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { EmptyState, PostSkeleton } from '@/components/ui';
import { fetchFeed } from './api';
import { PostCard } from './post-card';

export function FeedList() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['feed'],
      queryFn: ({ pageParam }) => fetchFeed(pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }
  if (isError) {
    return (
      <EmptyState
        icon="⚠️"
        title="Không tải được bảng tin"
        description="Kiểm tra xem API có đang chạy không rồi thử lại."
      />
    );
  }

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  if (posts.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="Chưa có bài viết nào"
        description="Hãy là người đăng bài đầu tiên hoặc kết bạn để xem bài của họ!"
      />
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-brand shadow hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-900 dark:hover:bg-gray-800"
        >
          {isFetchingNextPage ? 'Đang tải…' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}
