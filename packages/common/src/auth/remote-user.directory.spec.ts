import { ConfigService } from '@nestjs/config';
import { RemoteUserDirectory } from './remote-user.directory';

describe('RemoteUserDirectory', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('maps via Identity and reuses the cache', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ userId: 'u1', permissions: ['project:read'] }),
    });
    const directory = new RemoteUserDirectory({
      get: (key: string) => {
        if (key === 'IDENTITY_URL') {
          return 'http://identity:3001';
        }
        if (key === 'AUTH_CACHE_TTL_MS') {
          return '15000';
        }
        return undefined;
      },
    } as ConfigService);

    const token = { sub: 's' } as never;
    await expect(directory.map(token, 'jwt-1')).resolves.toEqual({ userId: 'u1', permissions: ['project:read'] });
    await expect(directory.map(token, 'jwt-1')).resolves.toEqual({ userId: 'u1', permissions: ['project:read'] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws unauthorized when Identity is down', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    const directory = new RemoteUserDirectory({
      get: () => undefined,
    } as unknown as ConfigService);

    await expect(directory.map({} as never, 'jwt-2')).rejects.toThrow('Identity service could not map this access token.');
  });
});
