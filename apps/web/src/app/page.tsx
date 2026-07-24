'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { tokenStorage } from '@/lib/token-storage';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(tokenStorage.access ? '/feed' : '/login');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Đang tải…</p>
    </main>
  );
}
