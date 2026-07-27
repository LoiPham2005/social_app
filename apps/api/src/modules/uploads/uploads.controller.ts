import {
  BadRequestException,
  Controller,
  Inject,
  ParseFilePipeBuilder,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { UploadFolder, UploadResult } from '@social/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from './storage.provider';

const ALLOWED_FOLDERS: UploadFolder[] = [
  'posts',
  'avatars',
  'covers',
  'messages',
  'stories',
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ })
        .addMaxSizeValidator({ maxSize: MAX_SIZE })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
    @Query('folder') folder?: string,
  ): Promise<UploadResult> {
    const safeFolder: UploadFolder = ALLOWED_FOLDERS.includes(
      folder as UploadFolder,
    )
      ? (folder as UploadFolder)
      : 'posts';

    if (!file?.buffer) {
      throw new BadRequestException('Không có file');
    }

    const stored = await this.storage.upload(
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      safeFolder,
    );
    return { url: stored.url };
  }
}
