import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscribeDto } from './dto/subscribe.dto';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT', 'mailto:admin@social.app');
    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.enabled = true;
    } else {
      this.logger.warn('VAPID keys chưa cấu hình — Web Push bị tắt.');
    }
  }

  getPublicKey(): string {
    return this.config.get<string>('VAPID_PUBLIC_KEY', '');
  }

  async subscribe(userId: string, dto: SubscribeDto): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
      },
      update: { userId, p256dh: dto.keys.p256dh, auth: dto.keys.auth },
    });
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  /** Gửi push tới mọi thiết bị của 1 user (fire-and-forget, tự dọn sub hỏng). */
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.enabled) return;
    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload),
          );
        } catch (err: any) {
          // 404/410 = subscription hết hạn → xóa.
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await this.prisma.pushSubscription.deleteMany({
              where: { endpoint: sub.endpoint },
            });
          } else {
            this.logger.warn(`Push lỗi: ${err?.message ?? err}`);
          }
        }
      }),
    );
  }
}
