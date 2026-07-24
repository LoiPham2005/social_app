import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import type {
  StorageProvider,
  StoredObject,
  UploadedFile,
} from '../storage.provider';

/**
 * Lưu ảnh lên Cloudinary (có CDN + tự resize). Bật bằng STORAGE_DRIVER=cloudinary.
 * Chỉ file này biết về Cloudinary — phần còn lại của app không hề hay biết.
 */
@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);

  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  upload(file: UploadedFile, folder: string): Promise<StoredObject> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `social/${folder}`, resource_type: 'image' },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload failed', error);
            return reject(error ?? new Error('Upload failed'));
          }
          resolve({ url: result.secure_url, key: result.public_id });
        },
      );
      stream.end(file.buffer);
    });
  }

  async delete(key: string): Promise<void> {
    await cloudinary.uploader.destroy(key);
  }
}
