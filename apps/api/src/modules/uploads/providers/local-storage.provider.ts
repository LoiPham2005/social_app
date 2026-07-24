import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  StorageProvider,
  StoredObject,
  UploadedFile,
} from '../storage.provider';

/**
 * Lưu file xuống ổ đĩa cục bộ (thư mục apps/api/uploads), phục vụ qua static route.
 * Dùng cho dev / khi chưa cấu hình Cloudinary. Không hợp production đa-instance.
 */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly root = join(process.cwd(), 'uploads');
  private readonly publicBaseUrl: string;

  constructor(config: ConfigService) {
    // URL công khai để client tải ảnh, ví dụ http://localhost:4000
    this.publicBaseUrl = config.get<string>(
      'API_PUBLIC_URL',
      `http://localhost:${config.get<string>('PORT', '4000')}`,
    );
  }

  async upload(file: UploadedFile, folder: string): Promise<StoredObject> {
    const dir = join(this.root, folder);
    await mkdir(dir, { recursive: true });

    const ext = extname(file.originalName) || this.extFromMime(file.mimeType);
    const filename = `${randomUUID()}${ext}`;
    const key = join(folder, filename); // đường dẫn tương đối làm "key"
    await writeFile(join(this.root, key), file.buffer);

    return {
      url: `${this.publicBaseUrl}/uploads/${folder}/${filename}`,
      key,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(this.root, key));
    } catch {
      // bỏ qua nếu file không tồn tại
    }
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };
    return map[mime] ?? '';
  }
}
