import { DynamicModule, Global, Module, Type } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthzService } from './authz.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { UserDirectory } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { IssuerRegistryService } from './issuer-registry.service';
import { DISTRICT_ISSUER_STORE, USER_DIRECTORY, type DistrictIssuerStore } from './tokens';
import { TokenVerifierService } from './token-verifier.service';

export type AuthCoreOptions = {
  issuerStore: Type<DistrictIssuerStore>;
  userDirectory: Type<UserDirectory>;
};

@Global()
@Module({})
export class AuthCoreModule {
  static forRoot(options: AuthCoreOptions): DynamicModule {
    return {
      module: AuthCoreModule,
      global: true,
      providers: [
        { provide: DISTRICT_ISSUER_STORE, useClass: options.issuerStore },
        { provide: USER_DIRECTORY, useClass: options.userDirectory },
        AuthzService,
        IssuerRegistryService,
        TokenVerifierService,
        JwtAuthGuard,
        PermissionsGuard,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
      exports: [AuthzService, IssuerRegistryService, TokenVerifierService, DISTRICT_ISSUER_STORE, USER_DIRECTORY],
    };
  }
}
