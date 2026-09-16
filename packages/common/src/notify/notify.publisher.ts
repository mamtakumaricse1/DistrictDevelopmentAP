import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { internalPost } from '../http/internal-client';

export type NotifyPayload = {
  districtId: string;
  departmentId?: string;
  title: string;
  body: string;
  type: string;
  entityType?: string;
  entityId?: string;
};

@Injectable()
export class NotifyPublisher {
  private readonly logger = new Logger(NotifyPublisher.name);

  constructor(private readonly config: ConfigService) {}

  async publish(payload: NotifyPayload): Promise<void> {
    const notifyUrl = this.config.get<string>('NOTIFY_URL');
    if (!notifyUrl) {
      return;
    }
    const internalKey = this.config.get<string>('INTERNAL_API_KEY') ?? 'dev-internal-key';
    try {
      await internalPost(notifyUrl, '/api/v1/internal/notifications', internalKey, payload);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Notification publish skipped: ${message}`);
    }
  }
}
