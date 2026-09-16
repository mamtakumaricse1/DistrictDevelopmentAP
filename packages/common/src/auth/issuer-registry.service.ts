import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DISTRICT_ISSUER_STORE, type DistrictIssuerStore } from './tokens';

export type ResolvedIssuer =
  | { kind: 'system'; issuer: string }
  | { kind: 'district'; issuer: string; districtId: string; districtCode: string };

@Injectable()
export class IssuerRegistryService {
  constructor(
    private readonly config: ConfigService,
    @Inject(DISTRICT_ISSUER_STORE) private readonly store: DistrictIssuerStore,
  ) {}

  systemIssuer(): string {
    const base = this.normalize(this.config.get<string>('KEYCLOAK_URL') ?? 'http://localhost:8080');
    const realm = this.config.get<string>('KEYCLOAK_SYSTEM_REALM') ?? 'system';
    return `${base}/realms/${realm}`;
  }

  normalize(issuer: string): string {
    return issuer.replace(/\/+$/, '');
  }

  async resolve(issuer: string): Promise<ResolvedIssuer | null> {
    const normalized = this.normalize(issuer);
    if (normalized === this.systemIssuer()) {
      return { kind: 'system', issuer: normalized };
    }
    const district = await this.store.findByIssuer(normalized);
    if (!district) {
      return null;
    }
    return {
      kind: 'district',
      issuer: district.issuer,
      districtId: district.districtId,
      districtCode: district.districtCode,
    };
  }
}
