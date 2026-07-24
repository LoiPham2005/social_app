import type { UploadFolder, UploadResult } from '@social/shared';
import { api } from '@/lib/api';

/** Upload 1 ảnh, trả về URL. Không quan tâm backend dùng provider nào. */
export async function uploadImage(
  file: File,
  folder: UploadFolder,
): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<UploadResult>('/uploads', form, {
    params: { folder },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}
