import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  AuthCoreModule,
  HealthModule,
  HttpExceptionFilter,
  RequestIdInterceptor,
} from '@ddwmd/common';
import { AuthHttpModule } from './auth/auth-http.module';
import { IdentityIssuerStore } from './auth/identity-issuer.store';
import { IdentityUserDirectory } from './auth/identity-user.directory';
import { PrismaModule } from './prisma/prisma.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
    AuthCoreModule.forRoot({
      issuerStore: IdentityIssuerStore,
      userDirectory: IdentityUserDirectory,
    }),
    HealthModule,
    AuthHttpModule,
    UsersModule,
    RolesModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
  ],
})
export class IdentityModule {}
