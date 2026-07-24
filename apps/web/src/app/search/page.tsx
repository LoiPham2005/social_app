'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '@/components/avatar';
import { Protected } from '@/components/protected';
import { TopNav } from '@/components/top-nav';
import { EmptyState, PostSkeleton } from '@/components/ui';
import { searchPosts } from '@/features/feed/api';
import { PostCard } from '@/features/feed/post-card';
import { searchUsers } from '@/features/friends/api';

type Tab = 'people' | 'posts';

function SearchContent() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [tab, setTab] = useState<Tab>('people');
  const query = q.trim();

  const people = useQuery({
    queryKey: ['search-people', query],
    queryFn: () => searchUsers(query),
    enabled: query.length > 0,
  });
  const posts = useQuery({
    queryKey: ['search-posts', query],
    queryFn: () => searchPosts(query),
    enabled: query.length > 0,
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <TopNav />
      <main className="mx-auto max-w-xl px-4 py-6">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Tìm người dùng hoặc bài viết…"
          className="w-full rounded-full bg-white px-5 py-3 shadow-card outline-none focus:ring-2 focus:ring-brand dark:bg-gray-900"
        />

        {!query && (
          <EmptyState
            icon="🔎"
            title="Tìm kiếm"
            description="Nhập tên người dùng hoặc nội dung bài viết để tìm."
          />
        )}

        {query && (
          <>
            <div className="my-4 flex gap-2">
              <button
                onClick={() => setTab('people')}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                  tab === 'people'
                    ? 'bg-brand text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800'
                }`}
              >
                Người dùng{people.data ? ` (${people.data.length})` : ''}
              </button>
              <button
                onClick={() => setTab('posts')}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                  tab === 'posts'
                    ? 'bg-brand text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800'
                }`}
              >
                Bài viết{posts.data ? ` (${posts.data.length})` : ''}
              </button>
            </div>

            {tab === 'people' && (
              <div className="space-y-2">
                {people.isLoading && (
                  <p className="text-center text-gray-400">Đang tìm…</p>
                )}
                {people.data?.map((u) => (
                  <Link
                    key={u.id}
                    href={`/u/${u.username}`}
                    className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-card transition hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    <Avatar name={u.fullName} url={u.avatarUrl} />
                    <div>
                      <p className="font-semibold">{u.fullName}</p>
                      <p className="text-sm text-gray-400">@{u.username}</p>
                    </div>
                  </Link>
                ))}
                {people.data?.length === 0 && !people.isLoading && (
                  <EmptyState icon="🙁" title="Không tìm thấy người dùng" />
                )}
              </div>
            )}

            {tab === 'posts' && (
              <div className="space-y-4">
                {posts.isLoading && <PostSkeleton />}
                {posts.data?.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
                {posts.data?.length === 0 && !posts.isLoading && (
                  <EmptyState icon="🙁" title="Không tìm thấy bài viết" />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Protected>
      <SearchContent />
    </Protected>
  );
}
