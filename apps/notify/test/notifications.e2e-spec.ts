import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthContext, TokenVerifierService, USER_DIRECTORY } from '@ddwmd/common';
import { NotifyModule } from '../src/notify.module';
import { PrismaService } from '../src/prisma/prisma.service';

const changlang = '11111111-1111-1111-1111-111111111111';

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

describe('Notify isolation (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [NotifyModule] })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
        notification: {
          findMany: jest.fn().mockImplementation(({ where }: { where?: { districtId?: { in?: string[] } } }) => {
            const rows = [
              {
                id: 'n1',
                districtId: changlang,
                departmentId: null,
                title: 'Changlang',
                body: 'b',
                type: 'SYSTEM',
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
      })
      .overrideProvider(TokenVerifierService)
      .useValue({ verify: jest.fn().mockResolvedValue({ sub: 's', iss: 'http://localhost:8080/realms/changlang' }) })
      .overrideProvider(USER_DIRECTORY)
      .useValue({ map: jest.fn().mockResolvedValue(admin()) })
      .compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('lists scoped notifications', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', 'Bearer t')
      .expect(200);
    expect(response.body[0].title).toBe('Changlang');
  });
});
