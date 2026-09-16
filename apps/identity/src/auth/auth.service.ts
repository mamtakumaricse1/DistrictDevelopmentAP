import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IssuerRegistryService, internalGet } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';

export type LoginOption = {
  kind: 'system' | 'district';
  label: string;
  code: string;
  issuer: string;
  realm: string;
  clientId: string;
  districtId: string | null;
};

export type MeResponse = {
  userId: string;
  email: string;
  displayName: string;
  isSuperAdmin: boolean;
  issuer: string;
  roles: AuthContext['roles'];
  districtIds: string[];
  departmentIds: string[];
  agencyIds: string[];
  permissions: string[];
};

type DistrictRealm = {
  id: string;
  code: string;
  name: string;
  keycloakIssuer: string;
  keycloakRealm: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly issuers: IssuerRegistryService,
    private readonly config: ConfigService,
  ) {}

  async loginOptions(): Promise<LoginOption[]> {
    const clientId = this.config.get<string>('KEYCLOAK_WEB_CLIENT_ID') ?? 'ddwmd-web';
    const systemIssuer = this.issuers.systemIssuer();
    const systemRealm = this.config.get<string>('KEYCLOAK_SYSTEM_REALM') ?? 'system';
    const organizationUrl = this.config.get<string>('ORGANIZATION_URL') ?? 'http://127.0.0.1:3002';
    const internalKey = this.config.get<string>('INTERNAL_API_KEY') ?? 'dev-internal-key';

    let districtOptions: LoginOption[] = [];
    try {
      const districts = await internalGet<DistrictRealm[]>(
        organizationUrl,
        '/api/v1/internal/district-realms',
        internalKey,
      );
      districtOptions = districts.map((district) => ({
        kind: 'district',
        label: district.name,
        code: district.code,
        issuer: district.keycloakIssuer,
        realm: district.keycloakRealm,
        clientId,
        districtId: district.id,
      }));
    } catch {
      districtOptions = [];
    }

    return [
      ...districtOptions,
      {
        kind: 'system',
        label: 'System administration',
        code: 'SYSTEM',
        issuer: systemIssuer,
        realm: systemRealm,
        clientId,
        districtId: null,
      },
    ];
  }

  me(auth: AuthContext): MeResponse {
    return {
      userId: auth.userId,
      email: auth.email,
      displayName: auth.displayName,
      isSuperAdmin: auth.isSuperAdmin,
      issuer: auth.issuer,
      roles: auth.roles,
      districtIds: auth.districtIds,
      departmentIds: auth.departmentIds,
      agencyIds: auth.agencyIds,
      permissions: auth.permissions,
    };
  }
}
