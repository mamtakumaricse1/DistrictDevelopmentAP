import { ForbiddenException } from '@nestjs/common';
import { AuthzService } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';
import { SettingsService } from './settings.service';

const changlang = '11111111-1111-1111-1111-111111111111';
const tirap = '22222222-2222-2222-2222-222222222222';

function districtAdmin(): AuthContext {
  return {
    userId: 'u-da',
    email: 'da.changlang@ddwmd.local',
    displayName: 'DA',
    isSuperAdmin: false,
    isActive: true,
    issuer: 'http://localhost:8080/realms/changlang',
    roles: [{ code: 'DISTRICT_ADMIN', districtId: changlang }],
    districtIds: [changlang],
    departmentIds: [],
    agencyIds: [],
    permissions: ['master:manage'],
  };
}

describe('SettingsService', () => {
  it('refuses a global setting write from a district administrator', async () => {
    const service = new SettingsService({} as never, new AuthzService());
    await expect(
      service.upsert(districtAdmin(), {
        key: 'project.code_pattern',
        value: 'X',
        valueType: 'STRING',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses a setting write for another district', async () => {
    const service = new SettingsService({} as never, new AuthzService());
    await expect(
      service.upsert(districtAdmin(), {
        districtId: tirap,
        key: 'reporting.period_kind',
        value: 'calendar_month',
        valueType: 'STRING',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
