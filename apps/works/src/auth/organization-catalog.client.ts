import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TtlCache, internalGet } from '@ddwmd/common';

export type CatalogDepartment = {
  id: string;
  code: string;
  name: string;
  districtId: string;
  district: { id: string; code: string; name: string };
};

@Injectable()
export class OrganizationCatalogClient {
  private readonly cache = new TtlCache<CatalogDepartment>();

  constructor(private readonly config: ConfigService) {}

  async getDepartment(departmentId: string): Promise<CatalogDepartment> {
    const ttlMs = Number(this.config.get<string>('CATALOG_CACHE_TTL_MS') ?? 30000);
    const cached = ttlMs > 0 ? this.cache.get(departmentId) : undefined;
    if (cached) {
      return cached;
    }

    const organizationUrl = this.config.get<string>('ORGANIZATION_URL') ?? 'http://127.0.0.1:3002';
    const internalKey = this.config.get<string>('INTERNAL_API_KEY') ?? 'dev-internal-key';
    try {
      const department = await internalGet<CatalogDepartment>(
        organizationUrl,
        `/api/v1/internal/departments/${departmentId}`,
        internalKey,
      );
      if (ttlMs > 0) {
        this.cache.set(departmentId, department, ttlMs);
      }
      return department;
    } catch {
      throw new NotFoundException('Department was not found in Organization.');
    }
  }
}
