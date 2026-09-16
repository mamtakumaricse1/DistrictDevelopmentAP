import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthContext, TokenVerifierService, USER_DIRECTORY } from '@ddwmd/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrganizationModule } from '../src/organization.module';

const changlang = '11111111-1111-1111-1111-111111111111';
const tirap = '22222222-2222-2222-2222-222222222222';

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
    permissions: ['district:read', 'project:create'],
  };
}

describe('Organization isolation (e2e)', () => {
  let app: INestApplication<App>;
  let currentAuth: AuthContext = districtAdmin();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OrganizationModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
        district: {
          findMany: jest.fn().mockImplementation(({ where }: { where?: { id?: { in?: string[] } } }) => {
            const rows = [
              {
                id: changlang,
                code: 'CHANGLANG',
                name: 'Changlang',
                stateCode: 'AR',
                stateName: 'Arunachal Pradesh',
                headquarters: 'Changlang',
                isActive: true,
                keycloakRealm: 'changlang',
                keycloakIssuer: 'http://localhost:8080/realms/changlang',
              },
              {
                id: tirap,
                code: 'TIRAP',
                name: 'Tirap',
                stateCode: 'AR',
                stateName: 'Arunachal Pradesh',
                headquarters: 'Khonsa',
                isActive: true,
                keycloakRealm: 'tirap',
                keycloakIssuer: 'http://localhost:8080/realms/tirap',
              },
            ];
            const allowed = where?.id?.in;
            return Promise.resolve(allowed ? rows.filter((row) => allowed.includes(row.id)) : rows);
          }),
          findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
            if (where.id === changlang) {
              return Promise.resolve({
                id: changlang,
                code: 'CHANGLANG',
                name: 'Changlang',
                stateCode: 'AR',
                stateName: 'Arunachal Pradesh',
                headquarters: 'Changlang',
                isActive: true,
                keycloakRealm: 'changlang',
              });
            }
            if (where.id === tirap) {
              return Promise.resolve({
                id: tirap,
                code: 'TIRAP',
                name: 'Tirap',
                stateCode: 'AR',
                stateName: 'Arunachal Pradesh',
                headquarters: 'Khonsa',
                isActive: true,
                keycloakRealm: 'tirap',
              });
            }
            return Promise.resolve(null);
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
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('lists only the caller district', async () => {
    currentAuth = districtAdmin();
    const response = await request(app.getHttpServer())
      .get('/api/v1/districts')
      .set('Authorization', 'Bearer test')
      .expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].code).toBe('CHANGLANG');
  });

  it('denies Changlang district admin access to Tirap by id', async () => {
    currentAuth = districtAdmin();
    await request(app.getHttpServer())
      .get(`/api/v1/districts/${tirap}`)
      .set('Authorization', 'Bearer test')
      .expect(403);
  });

  it('denies a district administrator creating a district', async () => {
    currentAuth = districtAdmin();
    await request(app.getHttpServer())
      .post('/api/v1/districts')
      .set('Authorization', 'Bearer test')
      .send({
        code: 'LONGDING',
        name: 'Longding',
        stateCode: 'AR',
        stateName: 'Arunachal Pradesh',
      })
      .expect(403);
  });
});
