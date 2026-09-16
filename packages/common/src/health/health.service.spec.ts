import { HealthService } from './health.service';
import type { DatabasePing } from '../auth/tokens';

describe('HealthService', () => {
  it('reports degraded when the database query fails', async () => {
    const db = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('unavailable')),
    } as unknown as DatabasePing;
    const service = new HealthService(db);

    const result = await service.readiness();

    expect(result.status).toBe('degraded');
    expect(result.checks.database).toBe('down');
  });

  it('reports ready when the database query succeeds', async () => {
    const db = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as DatabasePing;
    const service = new HealthService(db);

    const result = await service.readiness();

    expect(result.status).toBe('ready');
    expect(result.checks.database).toBe('up');
  });
});
