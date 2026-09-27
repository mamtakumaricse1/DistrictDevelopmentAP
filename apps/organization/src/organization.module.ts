import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  AuthCoreModule,
  EventLogInterceptor,
  HealthModule,
  HttpExceptionFilter,
  RemoteUserDirectory,
  RequestIdInterceptor,
} from '@ddwmd/common';
import { AgenciesModule } from './agencies/agencies.module';
import { InternalDepartmentsController } from './auth/internal-departments.controller';
import { InternalDistrictRealmsController } from './auth/internal-district-realms.controller';
import { OrganizationIssuerStore } from './auth/organization-issuer.store';
import { DepartmentsModule } from './departments/departments.module';
import { DistrictsModule } from './districts/districts.module';
import { LocationsModule } from './locations/locations.module';
import { MasterDataModule } from './master-data/master-data.module';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationReportsModule } from './reports/organization-reports.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
    AuthCoreModule.forRoot({
      issuerStore: OrganizationIssuerStore,
      userDirectory: RemoteUserDirectory,
    }),
    HealthModule,
    DistrictsModule,
    LocationsModule,
    DepartmentsModule,
    AgenciesModule,
    MasterDataModule,
    SettingsModule,
    OrganizationReportsModule,
  ],
  controllers: [InternalDistrictRealmsController, InternalDepartmentsController],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: EventLogInterceptor },
  ],
})
export class OrganizationModule {}
