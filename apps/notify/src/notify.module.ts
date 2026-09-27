import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  AuthCoreModule,
  EventLogInterceptor,
  HealthModule,
  HttpExceptionFilter,
  RemoteDistrictIssuerStore,
  RemoteUserDirectory,
  RequestIdInterceptor,
} from '@ddwmd/common';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
    AuthCoreModule.forRoot({
      issuerStore: RemoteDistrictIssuerStore,
      userDirectory: RemoteUserDirectory,
    }),
    HealthModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: EventLogInterceptor },
  ],
})
export class NotifyModule {}
