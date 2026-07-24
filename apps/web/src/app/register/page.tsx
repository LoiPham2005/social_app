'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { registerRequest } from '@/features/auth/api';
import { getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
  });

  const mutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: (res) => {
      setSession(res);
      router.replace('/feed');
    },
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-brand dark:border-gray-700 dark:bg-gray-800';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand/15 via-gray-100 to-blue-200/30 px-4 py-8 dark:from-brand/10 dark:via-gray-950 dark:to-gray-900">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl dark:bg-gray-900">
        <h1 className="mb-6 text-center text-2xl font-extrabold text-brand">
          Tạo tài khoản
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
          className="space-y-4"
        >
          <input
            required
            placeholder="Họ và tên"
            value={form.fullName}
            onChange={set('fullName')}
            className={inputClass}
          />
          <input
            required
            placeholder="Tên người dùng (username)"
            value={form.username}
            onChange={set('username')}
            className={inputClass}
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={set('email')}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            value={form.password}
            onChange={set('password')}
            className={inputClass}
          />
          {mutation.isError && (
            <p className="text-sm text-red-500">
              {getApiErrorMessage(mutation.error, 'Đăng ký thất bại')}
            </p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {mutation.isPending ? 'Đang tạo…' : 'Đăng ký'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-semibold text-brand">
            Đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
