import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { withPrismaPool } from '@ddwmd/common';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = process.env.ORGANIZATION_DATABASE_URL;
    super(url ? { datasources: { db: { url: withPrismaPool(url) } } } : undefined);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
