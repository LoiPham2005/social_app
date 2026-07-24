'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { PostPrivacy } from '@social/shared';
import { Avatar } from '@/components/avatar';
import { getApiErrorMessage } from '@/lib/api';
import { uploadImage } from '@/features/uploads/api';
import { useAuthStore } from '@/store/auth-store';
import { createPost } from './api';

export function Composer() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<PostPrivacy>(PostPrivacy.PUBLIC);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createPost({ content: content.trim(), privacy, mediaUrls }),
    onSuccess: () => {
      setContent('');
      setMediaUrls([]);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map((f) => uploadImage(f, 'posts')),
      );
      setMediaUrls((prev) => [...prev, ...urls].slice(0, 10));
    } catch (err) {
      setUploadError(getApiErrorMessage(err, 'Tải ảnh thất bại'));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  const canPost = (content.trim() || mediaUrls.length > 0) && !uploading;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card dark:bg-gray-900">
      <div className="flex gap-3">
        <Avatar name={user?.fullName ?? '?'} url={user?.avatarUrl} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`${user?.fullName ?? 'Bạn'} ơi, bạn đang nghĩ gì?`}
          rows={2}
          className="flex-1 resize-none rounded-xl bg-gray-100 px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand dark:bg-gray-800"
        />
      </div>

      {/* Preview ảnh đã chọn */}
      {mediaUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {mediaUrls.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-24 w-full rounded-lg object-cover"
              />
              <button
                onClick={() =>
                  setMediaUrls((prev) => prev.filter((u) => u !== url))
                }
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                title="Xóa ảnh"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadError && <p className="mt-2 text-sm text-red-500">{uploadError}</p>}
      {mutation.isError && (
        <p className="mt-2 text-sm text-red-500">
          {getApiErrorMessage(mutation.error, 'Đăng bài thất bại')}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {uploading ? '⏳ Đang tải…' : '🖼️ Ảnh'}
          </button>
          <select
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as PostPrivacy)}
            className="rounded-lg border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-700"
          >
            <option value={PostPrivacy.PUBLIC}>🌍 Công khai</option>
            <option value={PostPrivacy.FRIENDS}>👥 Bạn bè</option>
            <option value={PostPrivacy.PRIVATE}>🔒 Chỉ mình tôi</option>
          </select>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={!canPost || mutation.isPending}
          className="rounded-xl bg-brand px-6 py-2 font-semibold text-white shadow-pop transition hover:bg-brand-dark disabled:opacity-50 disabled:shadow-none"
        >
          {mutation.isPending ? 'Đang đăng…' : 'Đăng'}
        </button>
      </div>
    </div>
  );
}
