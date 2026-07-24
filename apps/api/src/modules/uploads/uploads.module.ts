import { Module, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadsController } from './uploads.controller';
import { STORAGE_PROVIDER } from './storage.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';
import { LocalStorageProvider } from './providers/local-storage.provider';

/**
 * Factory: chọn provider theo env STORAGE_DRIVER ("local" | "cloudinary").
 * Đây là DUY NHẤT nơi quyết định dùng nhà cung cấp nào — muốn thêm S3/R2
 * chỉ cần viết provider mới rồi thêm 1 case ở đây.
 */
const storageProvider: Provider = {
  provide: STORAGE_PROVIDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const driver = config.get<string>('STORAGE_DRIVER', 'local');
    switch (driver) {
      case 'cloudinary':
        return new CloudinaryStorageProvider(config);
      case 'local':
      default:
        return new LocalStorageProvider(config);
    }
  },
};

@Module({
  controllers: [UploadsController],
  providers: [storageProvider],
  exports: [STORAGE_PROVIDER],
})
export class UploadsModule {}
