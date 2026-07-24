/**
 * Port trừu tượng cho việc lưu trữ file/ảnh.
 * Toàn bộ app chỉ phụ thuộc vào interface này (inject qua STORAGE_PROVIDER).
 * Đổi nhà cung cấp (Cloudinary → S3/R2/…) = viết 1 adapter mới + đổi env,
 * KHÔNG đụng controller/service/frontend.
 */
export interface UploadedFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface StoredObject {
  url: string;
  /** Khóa/định danh nội bộ để xóa sau này (path, public_id…). */
  key: string;
}

export interface StorageProvider {
  upload(file: UploadedFile, folder: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
}

/** Token DI cho StorageProvider. */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
