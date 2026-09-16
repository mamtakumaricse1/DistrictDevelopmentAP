import { Injectable } from '@nestjs/common';
import { DistrictIssuerRecord, DistrictIssuerStore } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdentityIssuerStore implements DistrictIssuerStore {
  constructor(private readonly prisma: PrismaService) {}

  async findByIssuer(issuer: string): Promise<DistrictIssuerRecord | null> {
    const row = await this.prisma.registeredIssuer.findFirst({
      where: { issuer, isActive: true },
    });
    if (!row) {
      return null;
    }
    return { issuer: row.issuer, districtId: row.districtId, districtCode: row.districtCode };
  }
}
