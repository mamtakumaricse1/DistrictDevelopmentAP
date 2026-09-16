import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthzService, type AuthContext } from '@ddwmd/common';
import { ProjectStatus } from '../generated/prisma';
import { OrganizationCatalogClient } from '../auth/organization-catalog.client';
import { ProjectsService } from './projects.service';

const changlang = '11111111-1111-1111-1111-111111111111';
const tirap = '22222222-2222-2222-2222-222222222222';
const changlangPwd = '33333333-3333-3333-3333-333333333333';
const tirapPwd = '55555555-5555-5555-5555-555555555555';

function districtAdmin(): AuthContext {
  return {
    userId: 'u-da',
    email: 'da.changlang@ddwmd.local',
    displayName: 'Changlang DA',
    isSuperAdmin: false,
    isActive: true,
    issuer: 'http://localhost:8080/realms/changlang',
    roles: [{ code: 'DISTRICT_ADMIN', districtId: changlang }],
    districtIds: [changlang],
    departmentIds: [],
    agencyIds: [],
    permissions: ['project:read', 'project:create', 'project:update', 'project:delete'],
  };
}

function departmentUser(): AuthContext {
  return {
    userId: 'u-pwd',
    email: 'pwd.changlang@ddwmd.local',
    displayName: 'PWD Changlang',
    isSuperAdmin: false,
    isActive: true,
    issuer: 'http://localhost:8080/realms/changlang',
    roles: [{ code: 'DEPARTMENT_USER', districtId: changlang }],
    districtIds: [changlang],
    departmentIds: [changlangPwd],
    agencyIds: [],
    permissions: ['project:read', 'project:update'],
  };
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    code: 'CHANGLANG-PWD-2026-00001',
    name: 'Road work',
    description: null,
    districtId: changlang,
    departmentId: changlangPwd,
    implementingAgencyId: null,
    executingAgencyId: null,
    financialYear: 2026,
    sanctionedAmount: { toString: () => '10.00' },
    status: ProjectStatus.ACTIVE,
    startDate: null,
    endDate: null,
    locationText: null,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('ProjectsService', () => {
  const authz = new AuthzService();

  it('lists only the caller district when no district filter is sent', async () => {
    const prisma = {
      project: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([row()]),
      },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    const service = new ProjectsService(prisma as never, authz, {} as OrganizationCatalogClient);
    const result = await service.list(districtAdmin(), {});
    expect(result.meta.total).toBe(1);
    expect(result.data[0].code).toBe('CHANGLANG-PWD-2026-00001');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('refuses get-by-id for a Tirap project even when the UUID is guessed', async () => {
    const prisma = {
      project: {
        findUnique: jest.fn().mockResolvedValue(row({ id: 'tirap-project', districtId: tirap, departmentId: tirapPwd })),
      },
    };
    const service = new ProjectsService(prisma as never, authz, {} as OrganizationCatalogClient);
    await expect(service.getById(districtAdmin(), 'tirap-project')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns 404 when the project does not exist', async () => {
    const prisma = { project: { findUnique: jest.fn().mockResolvedValue(null) } };
    const service = new ProjectsService(prisma as never, authz, {} as OrganizationCatalogClient);
    await expect(service.getById(districtAdmin(), changlang)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('assigns the next district-department-year code on create', async () => {
    const created = row({ code: 'CHANGLANG-PWD-2026-00002', sanctionedAmount: null });
    const tx = {
      projectSequence: {
        upsert: jest.fn().mockResolvedValue({ lastValue: 2 }),
      },
      project: { create: jest.fn().mockResolvedValue(created) },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    const catalog = {
      getDepartment: jest.fn().mockResolvedValue({
        id: changlangPwd,
        code: 'PWD',
        name: 'Public Works',
        districtId: changlang,
        district: { id: changlang, code: 'CHANGLANG', name: 'Changlang' },
      }),
    };
    const service = new ProjectsService(prisma as never, authz, catalog as never);
    const result = await service.create(districtAdmin(), { name: 'Bridge', departmentId: changlangPwd, financialYear: 2026 });
    expect(result.code).toBe('CHANGLANG-PWD-2026-00002');
    expect(tx.project.create).toHaveBeenCalled();
  });

  it('does not let a department user create a project', async () => {
    const service = new ProjectsService({} as never, authz, {} as OrganizationCatalogClient);
    await expect(
      service.create(departmentUser(), { name: 'Should fail', departmentId: changlangPwd }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires project:delete to set CLOSED', async () => {
    const prisma = {
      project: { findUnique: jest.fn().mockResolvedValue(row()) },
    };
    const service = new ProjectsService(prisma as never, authz, {} as OrganizationCatalogClient);
    await expect(
      service.update(departmentUser(), row().id, { status: ProjectStatus.CLOSED }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
