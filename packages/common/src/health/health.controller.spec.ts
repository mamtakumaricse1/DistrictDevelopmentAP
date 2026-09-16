import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            liveness: () => ({
              status: 'ok',
              service: 'test-api',
              timestamp: '2026-09-03T00:00:00.000Z',
            }),
            readiness: async () => ({
              status: 'ready',
              service: 'test-api',
              timestamp: '2026-09-03T00:00:00.000Z',
              checks: { database: 'up' },
            }),
          },
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns liveness payload', () => {
    const result = controller.liveness();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('test-api');
  });

  it('returns readiness payload', async () => {
    const res = { status: jest.fn() };
    const result = await controller.readiness(res as never);
    expect(result.status).toBe('ready');
    expect(result.checks.database).toBe('up');
    expect(res.status).not.toHaveBeenCalled();
  });

  it('sets HTTP 503 when the service is not ready', async () => {
    const moduleWithDownDb: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            liveness: () => ({ status: 'ok', service: 'test-api', timestamp: '2026-09-03T00:00:00.000Z' }),
            readiness: async () => ({
              status: 'degraded',
              service: 'test-api',
              timestamp: '2026-09-03T00:00:00.000Z',
              checks: { database: 'down' },
            }),
          },
        },
      ],
    }).compile();
    const degraded = moduleWithDownDb.get(HealthController);
    const res = { status: jest.fn() };
    await expect(degraded.readiness(res as never)).resolves.toMatchObject({ status: 'degraded' });
    expect(res.status).toHaveBeenCalledWith(503);
  });
});
