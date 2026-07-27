'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Avatar } from '@/components/avatar';
import { useToast } from '@/components/dialog-provider';
import { getApiErrorMessage } from '@/lib/api';
import { fetchFriends } from '@/features/friends/api';
import { createGroup } from './api';

export function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const friends = useQuery({ queryKey: ['friends'], queryFn: fetchFriends });

  const mutation = useMutation({
    mutationFn: () => createGroup(name.trim(), Array.from(selected)),
    onSuccess: (conv) => {
      onClose();
      router.push(`/messages/${conv.id}`);
    },
    onError: (e) => toast(getApiErrorMessage(e, 'Tạo nhóm thất bại'), 'error'),
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const canCreate = name.trim() && selected.size >= 2;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md animate-pop-in flex-col overflow-hidden rounded-2xl bg-white shadow-soft dark:bg-gray-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 p-5 dark:border-gray-800">
          <h3 className="text-lg font-bold">Tạo nhóm chat</h3>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên nhóm…"
            className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-brand dark:border-gray-700 dark:bg-gray-800"
          />
          <p className="mt-2 text-xs text-gray-400">
            Chọn ít nhất 2 người bạn ({selected.size} đã chọn)
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {friends.isLoading && (
            <p className="p-4 text-center text-sm text-gray-400">Đang tải…</p>
          )}
          {friends.data?.length === 0 && (
            <p className="p-6 text-center text-sm text-gray-400">
              Bạn chưa có bạn bè nào để tạo nhóm.
            </p>
          )}
          {friends.data?.map((f) => (
            <button
              key={f.id}
              onClick={() => toggle(f.id)}
              className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Avatar name={f.fullName} url={f.avatarUrl} />
              <div className="flex-1">
                <p className="font-semibold">{f.fullName}</p>
                <p className="text-sm text-gray-400">@{f.username}</p>
              </div>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  selected.has(f.id)
                    ? 'border-brand bg-brand text-white'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {selected.has(f.id) && '✓'}
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 p-4 dark:border-gray-800">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Hủy
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canCreate || mutation.isPending}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang tạo…' : 'Tạo nhóm'}
          </button>
        </div>
      </div>
    </div>
  );
}
