'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/avatar';
import { usePrompt } from '@/components/dialog-provider';
import { uploadImage } from '@/features/uploads/api';
import { useAuthStore } from '@/store/auth-store';
import { createStory, fetchStories } from './api';
import { StoryViewer } from './story-viewer';

export function StoryBar() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const prompt = usePrompt();
  const fileInput = useRef<HTMLInputElement>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: groups } = useQuery({
    queryKey: ['stories'],
    queryFn: fetchStories,
  });

  const createMut = useMutation({
    mutationFn: ({ url, caption }: { url: string; caption?: string }) =>
      createStory(url, caption),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });

  async function handleFile(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, 'stories');
      const caption = await prompt({
        title: 'Thêm chú thích',
        message: 'Để trống nếu không cần.',
        placeholder: 'Chú thích cho tin của bạn…',
        confirmText: 'Đăng tin',
      });
      // prompt trả null nếu hủy -> vẫn đăng story không caption
      createMut.mutate({ url, caption: caption ?? undefined });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto rounded-2xl bg-white p-3 shadow-card dark:bg-gray-900">
        {/* Tạo tin */}
        <div className="flex w-16 shrink-0 flex-col items-center gap-1">
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 ring-2 ring-dashed ring-gray-300 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:ring-gray-600"
          >
            {uploading ? (
              <span className="text-sm">⏳</span>
            ) : (
              <span className="text-2xl text-brand">＋</span>
            )}
          </button>
          <span className="truncate text-center text-xs text-gray-500">
            Tạo tin
          </span>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {/* Các nhóm story */}
        {groups?.map((g, idx) => (
          <button
            key={g.author.id}
            onClick={() => setViewerIndex(idx)}
            className="flex w-16 shrink-0 flex-col items-center gap-1"
          >
            <span
              className={`rounded-full p-[3px] ${
                g.hasUnseen
                  ? 'bg-gradient-to-tr from-brand via-blue-500 to-indigo-400'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span className="block rounded-full ring-2 ring-white dark:ring-gray-900">
                <Avatar name={g.author.fullName} url={g.author.avatarUrl} size={58} />
              </span>
            </span>
            <span className="w-16 truncate text-center text-xs text-gray-600 dark:text-gray-300">
              {g.author.id === user?.id ? 'Tin của bạn' : g.author.fullName}
            </span>
          </button>
        ))}
      </div>

      {viewerIndex !== null && groups && (
        <StoryViewer
          groups={groups}
          startIndex={viewerIndex}
          onClose={() => {
            setViewerIndex(null);
            qc.invalidateQueries({ queryKey: ['stories'] });
          }}
        />
      )}
    </>
  );
}
