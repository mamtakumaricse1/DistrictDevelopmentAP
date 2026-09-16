import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';
import { UpsertSettingDto } from './dto/setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async list(auth: AuthContext, districtId?: string) {
    if (districtId) {
      this.authz.assertDistrictAccess(auth, districtId);
    }
    const districtIds = this.authz.visibleDistrictIds(auth);
    const districtScope =
      districtId != null
        ? [{ districtId: null }, { districtId }]
        : districtIds == null
          ? undefined
          : [{ districtId: null }, { districtId: { in: districtIds } }];
    return this.prisma.systemSetting.findMany({
      where: districtScope ? { OR: districtScope } : {},
      orderBy: { key: 'asc' },
    });
  }

  async upsert(auth: AuthContext, dto: UpsertSettingDto) {
    this.authz.assertPermission(auth, auth.isSuperAdmin ? 'config:manage' : 'master:manage');
    if (dto.districtId) {
      this.authz.assertDistrictAccess(auth, dto.districtId);
    } else if (!auth.isSuperAdmin) {
      this.authz.assertPermission(auth, 'config:manage');
    }

    const existing = await this.prisma.systemSetting.findFirst({
      where: { districtId: dto.districtId ?? null, key: dto.key },
    });
    if (existing) {
      return this.prisma.systemSetting.update({
        where: { id: existing.id },
        data: { value: dto.value, valueType: dto.valueType },
      });
    }
    return this.prisma.systemSetting.create({
      data: {
        districtId: dto.districtId,
        key: dto.key,
        value: dto.value,
        valueType: dto.valueType,
      },
    });
  }
}
