import { ForbiddenException } from '@nestjs/common';
import { AuthzService, NotifyPublisher, type AuthContext } from '@ddwmd/common';
import { ProgressStatus } from '../generated/prisma';
import { ProgressService } from './progress.service';
import { ProjectAccessService } from '../projects/project-access.service';

const changlang = '11111111-1111-1111-1111-111111111111';
const tirap = '22222222-2222-2222-2222-222222222222';
const projectId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';

function officer(): AuthContext {
  return {
    userId: 'u-pwd',
    email: 'pwd.changlang@ddwmd.local',
    displayName: 'PWD',
    isSuperAdmin: false,
    isActive: true,
    issuer: 'http://localhost:8080/realms/changlang',
    roles: [{ code: 'DEPARTMENT_USER', districtId: changlang }],
    districtIds: [changlang],
    departmentIds: ['33333333-3333-3333-3333-333333333333'],
    agencyIds: [],
    permissions: ['progress:submit', 'progress:read'],
  };
}

describe('ProgressService', () => {
  it('creates a new version and never updates an existing row', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'p1',
      projectId,
      version: 2,
      periodYm: '2026-09',
      physicalPercent: { toString: () => '40' },
      financialAmount: null,
      status: ProgressStatus.DELAYED,
      remarks: null,
      createdAt: new Date(),
      createdById: 'u-pwd',
    });
    const tx = {
      projectProgress: {
        aggregate: jest.fn().mockResolvedValue({ _max: { version: 1 } }),
        create,
      },
    };
    const prisma = {
      projectProgress: { findMany: jest.fn() },
      $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    const access = {
      requireProject: jest.fn().mockResolvedValue({
        id: projectId,
        code: 'CHANGLANG-PWD-2026-00001',
        name: 'Road',
        districtId: changlang,
        departmentId: '33333333-3333-3333-3333-333333333333',
      }),
    };
    const notify = { publish: jest.fn().mockResolvedValue(undefined) };
    const service = new ProgressService(prisma as never, access as never, notify as never);
    const result = await service.submit(officer(), projectId, {
      periodYm: '2026-09',
      physicalPercent: 40,
      status: ProgressStatus.DELAYED,
    });
    expect(result.version).toBe(2);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data.version).toBe(2);
    expect(notify.publish).toHaveBeenCalled();
  });

  it('refuses progress on another district project', async () => {
    const access = new ProjectAccessService(
      {
        project: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'tirap-p',
            code: 'TIRAP-PWD-2026-00001',
            name: 'Other',
            districtId: tirap,
            departmentId: '55555555-5555-5555-5555-555555555555',
            isActive: true,
          }),
        },
      } as never,
      new AuthzService(),
    );
    const service = new ProgressService({} as never, access, { publish: jest.fn() } as unknown as NotifyPublisher);
    await expect(
      service.submit(officer(), 'tirap-p', {
        periodYm: '2026-09',
        physicalPercent: 10,
        status: ProgressStatus.IN_PROGRESS,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
