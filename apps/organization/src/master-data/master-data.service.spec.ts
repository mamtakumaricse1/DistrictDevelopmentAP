import { NotFoundException } from '@nestjs/common';
import { AuthzService } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';
import { MasterDataService } from './master-data.service';

const changlang = '11111111-1111-1111-1111-111111111111';

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

describe('MasterDataService', () => {
  it('does not let a district administrator edit a global item', async () => {
    const prisma = {
      masterDataItem: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'item-1',
          districtId: null,
          code: 'SANCTION',
        }),
      },
    };
    const service = new MasterDataService(prisma as never, new AuthzService());
    await expect(
      service.updateItem(districtAdmin(), 'item-1', { name: 'Changed' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
