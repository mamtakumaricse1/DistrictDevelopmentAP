import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  AuthCoreModule,
  EventLogInterceptor,
  HealthModule,
  HttpExceptionFilter,
  NotifyPublisherModule,
  RemoteDistrictIssuerStore,
  RemoteUserDirectory,
  RequestIdInterceptor,
} from '@ddwmd/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { ImportsModule } from './imports/imports.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { ProjectsModule } from './projects/projects.module';
import { ReportsModule } from './reports/reports.module';
import { SchemesModule } from './schemes/schemes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
    NotifyPublisherModule,
    AuthCoreModule.forRoot({
      issuerStore: RemoteDistrictIssuerStore,
      userDirectory: RemoteUserDirectory,
    }),
    HealthModule,
    ProjectsModule,
    SchemesModule,
    ImportsModule,
    ProgressModule,
    DocumentsModule,
    DashboardModule,
    ReportsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: EventLogInterceptor },
  ],
})
export class WorksModule {}
