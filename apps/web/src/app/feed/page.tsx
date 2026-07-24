'use client';

import { Protected } from '@/components/protected';
import { TopNav } from '@/components/top-nav';
import { Composer } from '@/features/feed/composer';
import { FeedList } from '@/features/feed/feed-list';

function FeedContent() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <TopNav />
      <main className="mx-auto max-w-xl space-y-4 px-4 py-6">
        <Composer />
        <FeedList />
      </main>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Protected>
      <FeedContent />
    </Protected>
  );
}
