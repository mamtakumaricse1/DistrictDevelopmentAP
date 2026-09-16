import { GatewayService } from './gateway.service';

describe('GatewayService', () => {
  const service = new GatewayService({
    get: (key: string) => {
      const urls: Record<string, string> = {
        IDENTITY_URL: 'http://127.0.0.1:3001',
        ORGANIZATION_URL: 'http://127.0.0.1:3002',
        WORKS_URL: 'http://127.0.0.1:3003',
        GOVERNANCE_URL: 'http://127.0.0.1:3004',
        NOTIFY_URL: 'http://127.0.0.1:3005',
      };
      return urls[key];
    },
  } as never);

  it('routes identity paths to the identity service', () => {
    expect(service.targetFor('/api/v1/auth/me')).toBe('http://127.0.0.1:3001');
    expect(service.targetFor('/api/v1/users')).toBe('http://127.0.0.1:3001');
  });

  it('routes organization paths to the organization service', () => {
    expect(service.targetFor('/api/v1/districts')).toBe('http://127.0.0.1:3002');
    expect(service.targetFor('/api/v1/settings')).toBe('http://127.0.0.1:3002');
  });

  it('routes works paths to the works service', () => {
    expect(service.targetFor('/api/v1/projects')).toBe('http://127.0.0.1:3003');
    expect(service.targetFor('/api/v1/documents/x/file')).toBe('http://127.0.0.1:3003');
    expect(service.targetFor('/api/v1/dashboard/summary')).toBe('http://127.0.0.1:3003');
    expect(service.targetFor('/api/v1/reports/projects.csv')).toBe('http://127.0.0.1:3003');
  });

  it('routes governance and notify paths', () => {
    expect(service.targetFor('/api/v1/meetings')).toBe('http://127.0.0.1:3004');
    expect(service.targetFor('/api/v1/actions')).toBe('http://127.0.0.1:3004');
    expect(service.targetFor('/api/v1/governance/summary')).toBe('http://127.0.0.1:3004');
    expect(service.targetFor('/api/v1/notifications')).toBe('http://127.0.0.1:3005');
  });
});

describe('GatewayService replica URLs', () => {
  const service = new GatewayService({
    get: (key: string) => {
      const urls: Record<string, string> = {
        IDENTITY_URL: 'http://identity-a:3001,http://identity-b:3001',
        ORGANIZATION_URL: 'http://127.0.0.1:3002',
        WORKS_URL: 'http://works-a:3003,http://works-b:3003',
        GOVERNANCE_URL: 'http://127.0.0.1:3004',
        NOTIFY_URL: 'http://127.0.0.1:3005',
      };
      return urls[key];
    },
  } as never);

  it('round-robins works replicas', () => {
    expect(service.targetFor('/api/v1/projects')).toBe('http://works-a:3003');
    expect(service.targetFor('/api/v1/projects')).toBe('http://works-b:3003');
    expect(service.targetFor('/api/v1/projects')).toBe('http://works-a:3003');
  });

  it('lists every identity replica for failover', () => {
    expect(service.targetsFor('/api/v1/auth/me')).toEqual(['http://identity-a:3001', 'http://identity-b:3001']);
  });
});
