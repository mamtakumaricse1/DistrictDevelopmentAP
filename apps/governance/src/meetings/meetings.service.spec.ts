import { ForbiddenException } from '@nestjs/common';
import { AuthzService, type AuthContext } from '@ddwmd/common';
import { MeetingsService } from './meetings.service';

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
    permissions: ['meeting:manage'],
  };
}

describe('MeetingsService', () => {
  it('refuses update of a Tirap meeting', async () => {
    const prisma = {
      reviewMeeting: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'm-tirap',
          districtId: tirap,
          title: 'Tirap review',
          isActive: true,
        }),
      },
    };
    const service = new MeetingsService(prisma as never, new AuthzService(), { publish: jest.fn() } as never);
    await expect(service.update(admin(), 'm-tirap', { title: 'x' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
