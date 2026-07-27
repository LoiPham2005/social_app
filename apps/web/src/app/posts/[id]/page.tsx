'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Protected } from '@/components/protected';
import { TopNav } from '@/components/top-nav';
import { EmptyState, PostSkeleton } from '@/components/ui';
import { fetchPost } from '@/features/feed/api';
import { PostCard } from '@/features/feed/post-card';

function PostDetailContent({ id }: { id: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <TopNav />
      <main className="mx-auto max-w-xl space-y-4 px-4 py-6">
        <Link href="/feed" className="inline-block text-sm text-brand hover:underline">
          ← Về bảng tin
        </Link>
        {isLoading && <PostSkeleton />}
        {isError && (
          <EmptyState
            icon="🔍"
            title="Không tìm thấy bài viết"
            description="Bài viết có thể đã bị xóa."
          />
        )}
        {data && <PostCard post={data} defaultOpenComments />}
      </main>
    </div>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const id = String(params.id);
  return (
    <Protected>
      <PostDetailContent id={id} />
    </Protected>
  );
}
