'use client';

import type { ReactNode } from 'react';
import type { PublicUser } from '@social/shared';
import { Avatar } from '@/components/avatar';

export function UserRow({
  user,
  actions,
}: {
  user: PublicUser;
  actions: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-gray-900">
      <Avatar name={user.fullName} url={user.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{user.fullName}</p>
        <p className="truncate text-sm text-gray-400">@{user.username}</p>
      </div>
      <div className="flex shrink-0 gap-2">{actions}</div>
    </div>
  );
}

export function BtnPrimary({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function BtnGhost({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
    >
      {children}
    </button>
  );
}
