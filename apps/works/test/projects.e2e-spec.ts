import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthContext, TokenVerifierService, USER_DIRECTORY } from '@ddwmd/common';
import { OrganizationCatalogClient } from '../src/auth/organization-catalog.client';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorksModule } from '../src/works.module';

const changlang = '11111111-1111-1111-1111-111111111111';
const tirap = '22222222-2222-2222-2222-222222222222';
const changlangPwd = '33333333-3333-3333-3333-333333333333';
const tirapPwd = '55555555-5555-5555-5555-555555555555';
const changlangProject = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
const tirapProject = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1';

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

function projectRow(id: string, districtId: string, departmentId: string, code: string) {
  return {
    id,
    code,
    name: code,
    description: null,
    districtId,
    departmentId,
    implementingAgencyId: null,
    executingAgencyId: null,
    financialYear: 2026,
    sanctionedAmount: null,
    status: 'ACTIVE',
    startDate: null,
    endDate: null,
    locationText: null,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('Works isolation (e2e)', () => {
  let app: INestApplication<App>;
  let currentAuth: AuthContext = districtAdmin();
  const rows = [
    projectRow(changlangProject, changlang, changlangPwd, 'CHANGLANG-PWD-2026-00001'),
    projectRow(tirapProject, tirap, tirapPwd, 'TIRAP-PWD-2026-00001'),
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WorksModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
        $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
        project: {
          count: jest.fn().mockImplementation(({ where }: { where?: { districtId?: string | { in?: string[] } } }) => {
            const allowed = where?.districtId && typeof where.districtId === 'object' ? where.districtId.in : undefined;
            const data = allowed ? rows.filter((row) => allowed.includes(row.districtId)) : rows;
            return Promise.resolve(data.length);
          }),
          findMany: jest.fn().mockImplementation(({ where }: { where?: { districtId?: string | { in?: string[] } } }) => {
            const allowed = where?.districtId && typeof where.districtId === 'object' ? where.districtId.in : undefined;
            const data = allowed ? rows.filter((row) => allowed.includes(row.districtId)) : rows;
            return Promise.resolve(data);
          }),
          findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
            return Promise.resolve(rows.find((row) => row.id === where.id) ?? null);
          }),
        },
      })
      .overrideProvider(TokenVerifierService)
      .useValue({
        verify: jest.fn().mockResolvedValue({
          sub: 'sub-1',
          iss: 'http://localhost:8080/realms/changlang',
          email: 'da.changlang@ddwmd.local',
        }),
      })
      .overrideProvider(USER_DIRECTORY)
      .useValue({
        map: jest.fn().mockImplementation(async () => currentAuth),
      })
      .overrideProvider(OrganizationCatalogClient)
      .useValue({
        getDepartment: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('lists only the caller district projects', async () => {
    currentAuth = districtAdmin();
    const response = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .set('Authorization', 'Bearer test')
      .expect(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].code).toBe('CHANGLANG-PWD-2026-00001');
  });

  it('denies Changlang district admin access to a Tirap project by id', async () => {
    currentAuth = districtAdmin();
    await request(app.getHttpServer())
      .get(`/api/v1/projects/${tirapProject}`)
      .set('Authorization', 'Bearer test')
      .expect(403);
  });
});
