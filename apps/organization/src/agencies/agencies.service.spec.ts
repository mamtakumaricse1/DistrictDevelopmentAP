import { ForbiddenException } from '@nestjs/common';
import { AuthzService } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';
import { AgenciesService } from './agencies.service';

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
    permissions: ['agency:manage', 'district:read'],
  };
}

describe('AgenciesService', () => {
  it('denies get-by-id when the agency belongs to another district', async () => {
    const prisma = {
      agency: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'a-tirap',
          districtId: tirap,
          code: 'NBCC',
          name: 'NBCC Tirap',
        }),
      },
    };
    const service = new AgenciesService(prisma as never, new AuthzService());
    await expect(service.getById(districtAdmin(), 'a-tirap')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses to create an agency in another district', async () => {
    const service = new AgenciesService({} as never, new AuthzService());
    await expect(
      service.create(districtAdmin(), {
        districtId: tirap,
        code: 'NBCC',
        name: 'NBCC',
        agencyType: 'IMPLEMENTING',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
