import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { internalGet } from '../http/internal-client';
import { TtlCache } from '../http/ttl-cache';
import type { DistrictIssuerRecord, DistrictIssuerStore } from './tokens';

type DistrictRealm = {
  id: string;
  code: string;
  keycloakIssuer: string | null;
};

@Injectable()
export class RemoteDistrictIssuerStore implements DistrictIssuerStore {
  private readonly listCache = new TtlCache<DistrictRealm[]>();

  constructor(private readonly config: ConfigService) {}

  async findByIssuer(issuer: string): Promise<DistrictIssuerRecord | null> {
    const districts = await this.districts();
    const district = districts.find((row) => row.keycloakIssuer === issuer);
    if (!district?.keycloakIssuer) {
      return null;
    }
    return {
      issuer: district.keycloakIssuer,
      districtId: district.id,
      districtCode: district.code,
    };
  }

  private async districts(): Promise<DistrictRealm[]> {
    const ttlMs = Number(this.config.get<string>('ISSUER_CACHE_TTL_MS') ?? 30000);
    const cached = ttlMs > 0 ? this.listCache.get('district-realms') : undefined;
    if (cached) {
      return cached;
    }

    const organizationUrl = this.config.get<string>('ORGANIZATION_URL') ?? 'http://127.0.0.1:3002';
    const internalKey = this.config.get<string>('INTERNAL_API_KEY') ?? 'dev-internal-key';
    try {
      const districts = await internalGet<DistrictRealm[]>(
        organizationUrl,
        '/api/v1/internal/district-realms',
        internalKey,
      );
      if (ttlMs > 0) {
        this.listCache.set('district-realms', districts, ttlMs);
      }
      return districts;
    } catch {
      return [];
    }
  }
}
