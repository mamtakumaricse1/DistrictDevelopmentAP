import { Inject, Injectable, Optional } from '@nestjs/common';
import { DATABASE_PING, type DatabasePing } from '../auth/tokens';

export type LivenessResponse = {
  status: 'ok';
  service: string;
  timestamp: string;
};

export type ReadinessResponse = {
  status: 'ready' | 'degraded';
  service: string;
  timestamp: string;
  checks: {
    database: 'up' | 'down';
  };
};

@Injectable()
export class HealthService {
  constructor(@Optional() @Inject(DATABASE_PING) private readonly db: DatabasePing | null) {}

  liveness(): LivenessResponse {
    return {
      status: 'ok',
      service: process.env.APP_NAME ?? process.env.SERVICE_NAME ?? 'ddwmd-api',
      timestamp: new Date().toISOString(),
    };
  }

  async readiness(): Promise<ReadinessResponse> {
    let database: 'up' | 'down' = 'down';
    if (this.db) {
      try {
        await this.db.$queryRaw`SELECT 1`;
        database = 'up';
      } catch {
        database = 'down';
      }
    }

    return {
      status: database === 'up' ? 'ready' : 'degraded',
      service: process.env.APP_NAME ?? process.env.SERVICE_NAME ?? 'ddwmd-api',
      timestamp: new Date().toISOString(),
      checks: { database },
    };
  }
}
