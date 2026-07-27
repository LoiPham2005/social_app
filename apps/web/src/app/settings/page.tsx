'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useConfirm, useToast } from '@/components/dialog-provider';
import { Protected } from '@/components/protected';
import { ThemeToggle } from '@/components/theme-toggle';
import { TopNav } from '@/components/top-nav';
import { Card } from '@/components/ui';
import {
  changePassword,
  deleteAccount,
  logoutAllDevices,
} from '@/features/settings/api';
import { getApiErrorMessage } from '@/lib/api';
import { tokenStorage } from '@/lib/token-storage';
import { disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth-store';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 font-bold">{title}</h2>
      {children}
    </Card>
  );
}

function SettingsContent() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const confirm = useConfirm();
  const toast = useToast();

  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const forceLogin = () => {
    tokenStorage.clear();
    disconnectSocket();
    router.replace('/login');
  };

  const pwMut = useMutation({
    mutationFn: () => changePassword(cur, next),
    onSuccess: () => {
      toast('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.', 'success');
      forceLogin();
    },
    onError: (e) => setPwMsg(getApiErrorMessage(e, 'Đổi mật khẩu thất bại')),
  });

  const logoutAllMut = useMutation({
    mutationFn: logoutAllDevices,
    onSuccess: () => {
      toast('Đã đăng xuất khỏi mọi thiết bị.', 'success');
      forceLogin();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteAccount,
    onSuccess: forceLogin,
  });

  const input =
    'w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-brand dark:border-gray-700 dark:bg-gray-800';

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (next !== confirmPw) {
      setPwMsg('Mật khẩu xác nhận không khớp');
      return;
    }
    if (next.length < 6) {
      setPwMsg('Mật khẩu mới tối thiểu 6 ký tự');
      return;
    }
    pwMut.mutate();
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <TopNav />
      <main className="mx-auto max-w-xl space-y-4 px-4 py-6">
        <h1 className="text-2xl font-bold">Cài đặt</h1>

        <Section title="Tài khoản">
          <Link
            href="/settings/profile"
            className="flex items-center justify-between rounded-lg px-1 py-2 text-brand hover:underline"
          >
            <span>✏️ Chỉnh sửa hồ sơ</span>
            <span>›</span>
          </Link>
        </Section>

        <Section title="Giao diện">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Chế độ sáng / tối / theo hệ thống
            </span>
            <ThemeToggle />
          </div>
        </Section>

        <Section title="Đổi mật khẩu">
          <form onSubmit={submitPassword} className="space-y-3">
            <input
              type="password"
              placeholder="Mật khẩu hiện tại"
              value={cur}
              onChange={(e) => setCur(e.target.value)}
              required
              className={input}
            />
            <input
              type="password"
              placeholder="Mật khẩu mới (≥ 6 ký tự)"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              className={input}
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              className={input}
            />
            {pwMsg && <p className="text-sm text-red-500">{pwMsg}</p>}
            <button
              type="submit"
              disabled={pwMut.isPending}
              className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {pwMut.isPending ? 'Đang đổi…' : 'Đổi mật khẩu'}
            </button>
          </form>
        </Section>

        <Section title="Bảo mật">
          <button
            onClick={() => logoutAllMut.mutate()}
            disabled={logoutAllMut.isPending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            🚪 Đăng xuất khỏi mọi thiết bị
          </button>
          <button
            onClick={() => logout().then(() => router.replace('/login'))}
            className="ml-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Đăng xuất
          </button>
        </Section>

        <Section title="Vùng nguy hiểm">
          <p className="mb-3 text-sm text-gray-500">
            Xóa tài khoản sẽ xóa vĩnh viễn bài viết, bình luận, tin nhắn của bạn.
            Không thể hoàn tác.
          </p>
          <button
            onClick={async () => {
              if (
                await confirm({
                  title: 'Xóa tài khoản vĩnh viễn?',
                  message:
                    'Toàn bộ bài viết, bình luận, tin nhắn của bạn sẽ bị xóa và không thể khôi phục.',
                  confirmText: 'Xóa tài khoản',
                  danger: true,
                  icon: '⚠️',
                })
              ) {
                deleteMut.mutate();
              }
            }}
            disabled={deleteMut.isPending}
            className="rounded-lg bg-red-500 px-5 py-2.5 font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          >
            {deleteMut.isPending ? 'Đang xóa…' : '🗑️ Xóa tài khoản'}
          </button>
        </Section>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Protected>
      <SettingsContent />
    </Protected>
  );
}
