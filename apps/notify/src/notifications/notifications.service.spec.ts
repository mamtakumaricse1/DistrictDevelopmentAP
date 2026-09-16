import { AuthzService, type AuthContext } from '@ddwmd/common';
import { NotificationsService } from './notifications.service';

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
    permissions: ['notification:read'],
  };
}

describe('NotificationsService', () => {
  it('lists only the caller district', async () => {
    const prisma = {
      notification: {
        findMany: jest.fn().mockImplementation(({ where }: { where?: { districtId?: { in?: string[] } } }) => {
          const rows = [
            {
              id: 'n1',
              districtId: changlang,
              departmentId: null,
              title: 'Changlang alert',
              body: 'x',
              type: 'PROGRESS',
              entityType: null,
              entityId: null,
              createdAt: new Date(),
              reads: [],
            },
            {
              id: 'n2',
              districtId: tirap,
              departmentId: null,
              title: 'Tirap alert',
              body: 'y',
              type: 'PROGRESS',
              entityType: null,
              entityId: null,
              createdAt: new Date(),
              reads: [],
            },
          ];
          const allowed = where?.districtId?.in;
          return Promise.resolve(allowed ? rows.filter((row) => allowed.includes(row.districtId)) : rows);
        }),
      },
    };
    const service = new NotificationsService(prisma as never, new AuthzService());
    const result = await service.list(admin());
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Changlang alert');
  });
});
