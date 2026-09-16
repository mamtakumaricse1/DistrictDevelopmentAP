import { Injectable } from '@nestjs/common';
import { DistrictIssuerRecord, DistrictIssuerStore } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationIssuerStore implements DistrictIssuerStore {
  constructor(private readonly prisma: PrismaService) {}

  async findByIssuer(issuer: string): Promise<DistrictIssuerRecord | null> {
    const district = await this.prisma.district.findFirst({
      where: { keycloakIssuer: issuer, isActive: true },
      select: { id: true, code: true, keycloakIssuer: true },
    });
    if (!district?.keycloakIssuer) {
      return null;
    }
    return {
      issuer: district.keycloakIssuer,
      districtId: district.id,
      districtCode: district.code,
    };
  }
}
