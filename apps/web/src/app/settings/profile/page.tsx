'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { UploadFolder } from '@social/shared';
import { Avatar } from '@/components/avatar';
import { Protected } from '@/components/protected';
import { updateMyProfile } from '@/features/profile/api';
import { uploadImage } from '@/features/uploads/api';
import { getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

function EditProfileContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [form, setForm] = useState({
    fullName: '',
    bio: '',
    avatarUrl: '',
    coverUrl: '',
  });
  const [uploading, setUploading] = useState<null | 'avatar' | 'cover'>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function pickImage(
    field: 'avatarUrl' | 'coverUrl',
    folder: UploadFolder,
    file?: File,
  ) {
    if (!file) return;
    setUploadError(null);
    setUploading(field === 'avatarUrl' ? 'avatar' : 'cover');
    try {
      const url = await uploadImage(file, folder);
      setForm((f) => ({ ...f, [field]: url }));
    } catch (err) {
      setUploadError(getApiErrorMessage(err, 'Tải ảnh thất bại'));
    } finally {
      setUploading(null);
    }
  }

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName ?? '',
        bio: user.bio ?? '',
        avatarUrl: user.avatarUrl ?? '',
        coverUrl: user.coverUrl ?? '',
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      updateMyProfile({
        fullName: form.fullName,
        bio: form.bio,
        // gửi undefined nếu để trống để không ghi đè bằng chuỗi rỗng không hợp lệ
        avatarUrl: form.avatarUrl.trim() || undefined,
        coverUrl: form.coverUrl.trim() || undefined,
      }),
    onSuccess: (updated) => {
      setUser(updated);
      router.push(`/u/${updated.username}`);
    },
  });

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-brand dark:border-gray-700 dark:bg-gray-800';

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/feed" className="text-brand">
          ←
        </Link>
        <h1 className="text-xl font-bold">Chỉnh sửa hồ sơ</h1>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Avatar name={form.fullName || '?'} url={form.avatarUrl || null} size={64} />
        <p className="text-sm text-gray-400">
          Xem trước avatar (dán URL ảnh bên dưới)
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Họ và tên</label>
          <input value={form.fullName} onChange={set('fullName')} className={inputClass} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tiểu sử (bio)</label>
          <textarea value={form.bio} onChange={set('bio')} rows={3} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Ảnh đại diện</label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            {uploading === 'avatar' ? '⏳ Đang tải…' : '🖼️ Chọn ảnh đại diện'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) =>
                pickImage('avatarUrl', 'avatars', e.target.files?.[0])
              }
            />
          </label>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Ảnh bìa</label>
          {form.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.coverUrl}
              alt=""
              className="mb-2 h-28 w-full rounded-lg object-cover"
            />
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            {uploading === 'cover' ? '⏳ Đang tải…' : '🖼️ Chọn ảnh bìa'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) =>
                pickImage('coverUrl', 'covers', e.target.files?.[0])
              }
            />
          </label>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-500">
            {getApiErrorMessage(mutation.error, 'Cập nhật thất bại')}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {mutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
          <Link
            href="/feed"
            className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Hủy
          </Link>
        </div>
      </form>

      <p className="mt-6 text-xs text-gray-400">
        Ghi chú: hiện dùng URL ảnh. Upload ảnh trực tiếp (S3/Cloudinary) sẽ thêm ở
        bước sau.
      </p>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <Protected>
      <EditProfileContent />
    </Protected>
  );
}
