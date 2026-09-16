import { prismaClientOptions, withPrismaPool } from './prisma-url';

describe('withPrismaPool', () => {
  const previousLimit = process.env.PRISMA_CONNECTION_LIMIT;
  const previousTimeout = process.env.PRISMA_POOL_TIMEOUT;

  afterEach(() => {
    process.env.PRISMA_CONNECTION_LIMIT = previousLimit;
    process.env.PRISMA_POOL_TIMEOUT = previousTimeout;
  });

  it('adds pool params without dropping schema', () => {
    delete process.env.PRISMA_CONNECTION_LIMIT;
    delete process.env.PRISMA_POOL_TIMEOUT;
    const result = withPrismaPool('postgresql://dashboard:dashboard@localhost:5432/district_works?schema=public');
    expect(result).toContain('schema=public');
    expect(result).toContain('connection_limit=10');
    expect(result).toContain('pool_timeout=10');
  });

  it('does not override an existing connection_limit', () => {
    const result = withPrismaPool('postgresql://u:p@localhost:5432/db?connection_limit=3');
    expect(result).toContain('connection_limit=3');
    expect(result).not.toMatch(/connection_limit=3.*connection_limit=/);
  });

  it('returns empty options when the URL is missing', () => {
    expect(prismaClientOptions(undefined)).toEqual({});
  });
});
