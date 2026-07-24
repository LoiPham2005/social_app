'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth-store';

/** Client-side guard: loads the current user, redirects to /login if not authed. */
export function Protected({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const loadMe = useAuthStore((s) => s.loadMe);

  useEffect(() => {
    if (status === 'idle') {
      void loadMe();
    }
  }, [status, loadMe]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Đang tải…</p>
      </main>
    );
  }

  return <>{children}</>;
}
