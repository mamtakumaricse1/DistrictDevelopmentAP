export function withPrismaPool(databaseUrl: string): string {
  const parsed = new URL(databaseUrl);
  if (!parsed.searchParams.has('connection_limit')) {
    parsed.searchParams.set('connection_limit', process.env.PRISMA_CONNECTION_LIMIT ?? '10');
  }
  if (!parsed.searchParams.has('pool_timeout')) {
    parsed.searchParams.set('pool_timeout', process.env.PRISMA_POOL_TIMEOUT ?? '10');
  }
  return parsed.toString();
}

export function prismaClientOptions(databaseUrl: string | undefined): { datasources: { db: { url: string } } } | Record<string, never> {
  if (!databaseUrl) {
    return {};
  }
  return { datasources: { db: { url: withPrismaPool(databaseUrl) } } };
}
