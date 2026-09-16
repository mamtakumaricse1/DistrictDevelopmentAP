import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthzService } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';
import { DistrictsService } from './districts.service';

const changlang = '11111111-1111-1111-1111-111111111111';
const tirap = '22222222-2222-2222-2222-222222222222';

function admin(): AuthContext {
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
    permissions: ['district:read'],
  };
}

describe('DistrictsService', () => {
  it('refuses get-by-id for another district even when the UUID is guessed', async () => {
    const prisma = {
      district: {
        findUnique: jest.fn().mockResolvedValue({
          id: tirap,
          code: 'TIRAP',
          name: 'Tirap',
          stateCode: 'AR',
          stateName: 'Arunachal Pradesh',
          headquarters: 'Khonsa',
          isActive: true,
          keycloakRealm: 'tirap',
        }),
      },
    };
    const service = new DistrictsService(prisma as never, new AuthzService(), {
      syncIssuer: jest.fn(),
    } as never);

    await expect(service.getById(admin(), tirap)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns 404 when the district does not exist', async () => {
    const prisma = {
      district: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = new DistrictsService(prisma as never, new AuthzService(), {
      syncIssuer: jest.fn(),
    } as never);

    await expect(service.getById(admin(), changlang)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not allow a district administrator to create districts', async () => {
    const service = new DistrictsService({} as never, new AuthzService(), {
      syncIssuer: jest.fn(),
    } as never);
    await expect(
      service.create(admin(), {
        code: 'LONGDING',
        name: 'Longding',
        stateCode: 'AR',
        stateName: 'Arunachal Pradesh',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
