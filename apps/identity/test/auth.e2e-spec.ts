import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { IdentityModule } from '../src/identity.module';
import { AuthContext, TokenVerifierService, USER_DIRECTORY } from '@ddwmd/common';
import { PrismaService } from '../src/prisma/prisma.service';

const changlang = '11111111-1111-1111-1111-111111111111';

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

describe('Auth and isolation (e2e)', () => {
  let app: INestApplication<App>;
  let currentAuth: AuthContext = districtAdmin();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [IdentityModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
        district: {
          findMany: jest.fn().mockResolvedValue([
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
          ]),
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

  it('rejects unauthenticated /auth/me', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('exposes login options without a token', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/auth/login-options').expect(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('returns the mapped user for a valid token', async () => {
    currentAuth = districtAdmin();
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer test')
      .expect(200);
    expect(response.body.email).toBe('da.changlang@ddwmd.local');
  });
});
