import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthzService } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';
import { UsersService } from './users.service';

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
    permissions: ['user:manage'],
  };
}

describe('UsersService', () => {
  it('hides a Tirap user from a Changlang administrator', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'u-tirap',
          email: 'da.tirap@ddwmd.local',
          roles: [{ districtId: tirap, role: { code: 'DISTRICT_ADMIN' } }],
          departments: [],
        }),
      },
    };
    const service = new UsersService(prisma as never, new AuthzService());
    await expect(service.getById(districtAdmin(), 'u-tirap')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses to provision a user into another district', async () => {
    const service = new UsersService({} as never, new AuthzService());
    await expect(
      service.create(districtAdmin(), {
        email: 'new@ddwmd.local',
        displayName: 'New officer',
        keycloakIssuer: 'http://localhost:8080/realms/tirap',
        roleCode: 'VIEWER',
        districtId: tirap,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
