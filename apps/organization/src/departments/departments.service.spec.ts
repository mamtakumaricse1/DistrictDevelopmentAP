import { ForbiddenException } from '@nestjs/common';
import { AuthzService } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';
import { DepartmentsService } from './departments.service';

const changlang = '11111111-1111-1111-1111-111111111111';
const tirap = '22222222-2222-2222-2222-222222222222';
const pwdChanglang = '33333333-3333-3333-3333-333333333333';
const pwdTirap = '55555555-5555-5555-5555-555555555555';

function pwdOfficer(): AuthContext {
  return {
    userId: 'u-pwd',
    email: 'pwd.changlang@ddwmd.local',
    displayName: 'PWD',
    isSuperAdmin: false,
    isActive: true,
    issuer: 'http://localhost:8080/realms/changlang',
    roles: [{ code: 'DEPARTMENT_USER', districtId: changlang }],
    districtIds: [changlang],
    departmentIds: [pwdChanglang],
    agencyIds: [],
    permissions: ['district:read'],
  };
}

describe('DepartmentsService', () => {
  it('denies a Changlang PWD user who guesses a Tirap department id', async () => {
    const prisma = {
      department: {
        findUnique: jest.fn().mockResolvedValue({
          id: pwdTirap,
          districtId: tirap,
          code: 'PWD',
          name: 'Public Works Department',
          shortName: 'PWD',
          isActive: true,
        }),
      },
    };
    const service = new DepartmentsService(prisma as never, new AuthzService());
    await expect(service.getById(pwdOfficer(), pwdTirap)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
