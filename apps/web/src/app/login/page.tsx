'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { LogoMark } from '@/components/logo';
import {
  DEMO_ACCOUNTS,
  demoLogin,
  loginRequest,
  type DemoAccount,
} from '@/features/auth/api';
import { getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (res) => {
      setSession(res);
      router.replace('/feed');
    },
  });

  const demoMutation = useMutation({
    mutationFn: (acc: DemoAccount) => demoLogin(acc),
    onSuccess: (res) => {
      setSession(res);
      router.replace('/feed');
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand/15 via-gray-100 to-blue-200/30 px-4 dark:from-brand/10 dark:via-gray-950 dark:to-gray-900">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl dark:bg-gray-900">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 inline-block">
            <LogoMark size={64} className="drop-shadow-lg" />
          </span>
          <h1 className="text-2xl font-extrabold text-brand">Social App</h1>
          <p className="mt-1 text-sm text-gray-400">
            Kết nối với bạn bè mọi lúc
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({ email, password });
          }}
          className="space-y-4"
        >
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-brand dark:border-gray-700 dark:bg-gray-800"
          />
          <input
            type="password"
            required
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-brand dark:border-gray-700 dark:bg-gray-800"
          />
          {mutation.isError && (
            <p className="text-sm text-red-500">
              {getApiErrorMessage(mutation.error, 'Đăng nhập thất bại')}
            </p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {mutation.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          hoặc dùng tài khoản demo
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => demoMutation.mutate(acc)}
              disabled={demoMutation.isPending}
              className="rounded-lg border border-gray-300 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand disabled:opacity-60 dark:border-gray-700"
            >
              {demoMutation.isPending && demoMutation.variables?.email === acc.email
                ? 'Đang vào…'
                : acc.label}
            </button>
          ))}
        </div>
        {demoMutation.isError && (
          <p className="mt-2 text-center text-sm text-red-500">
            {getApiErrorMessage(demoMutation.error, 'Không vào được tài khoản demo')}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="font-semibold text-brand">
            Đăng ký
          </Link>
        </p>
      </div>
    </main>
  );
}
