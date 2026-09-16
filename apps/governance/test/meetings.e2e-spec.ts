import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthContext, TokenVerifierService, USER_DIRECTORY } from '@ddwmd/common';
import { GovernanceModule } from '../src/governance.module';
import { PrismaService } from '../src/prisma/prisma.service';

const changlang = '11111111-1111-1111-1111-111111111111';
const tirap = '22222222-2222-2222-2222-222222222222';
const tirapMeeting = 'dddddddd-dddd-dddd-dddd-ddddddddddd2';

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
    permissions: ['meeting:manage', 'action:manage', 'action:update', 'report:export'],
  };
}

describe('Governance isolation (e2e)', () => {
  let app: INestApplication<App>;
  const currentAuth: AuthContext = districtAdmin();

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [GovernanceModule] })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
        reviewMeeting: {
          findMany: jest.fn().mockImplementation(({ where }: { where?: { districtId?: { in?: string[] } } }) => {
            const rows = [
              { id: 'm-c', districtId: changlang, title: 'Changlang review', isActive: true, _count: { actions: 1 } },
              { id: tirapMeeting, districtId: tirap, title: 'Tirap review', isActive: true, _count: { actions: 0 } },
            ];
            const allowed = where?.districtId?.in;
            return Promise.resolve(allowed ? rows.filter((row) => allowed.includes(row.districtId)) : rows);
          }),
          findUnique: jest.fn().mockResolvedValue({ id: tirapMeeting, districtId: tirap, title: 'Tirap', isActive: true }),
        },
      })
      .overrideProvider(TokenVerifierService)
      .useValue({ verify: jest.fn().mockResolvedValue({ sub: 's', iss: 'http://localhost:8080/realms/changlang' }) })
      .overrideProvider(USER_DIRECTORY)
      .useValue({ map: jest.fn().mockImplementation(async () => currentAuth) })
      .compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('lists only Changlang meetings', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/meetings')
      .set('Authorization', 'Bearer t')
      .expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Changlang review');
  });

  it('denies patching a Tirap meeting', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/meetings/${tirapMeeting}`)
      .set('Authorization', 'Bearer t')
      .send({ title: 'Nope' })
      .expect(403);
  });
});
