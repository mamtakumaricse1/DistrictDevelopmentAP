import { Global, Module } from '@nestjs/common';
import { DATABASE_PING } from '@ddwmd/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, { provide: DATABASE_PING, useExisting: PrismaService }],
  exports: [PrismaService, DATABASE_PING],
})
export class PrismaModule {}
