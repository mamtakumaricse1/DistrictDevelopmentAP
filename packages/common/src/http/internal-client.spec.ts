import { bearerGet, internalGet, internalPost, parseServiceUrls } from './internal-client';

describe('parseServiceUrls', () => {
  it('splits comma-separated origins and strips trailing slashes', () => {
    expect(parseServiceUrls('http://a:1/,http://b:2', 'http://fallback')).toEqual(['http://a:1', 'http://b:2']);
  });

  it('uses the fallback when empty', () => {
    expect(parseServiceUrls('  ', 'http://fallback/')).toEqual(['http://fallback']);
  });
});

describe('internal HTTP client', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('returns JSON from the first healthy origin', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: 'd1' }],
    });
    await expect(internalGet('http://org:3002', '/api/v1/internal/district-realms', 'key')).resolves.toEqual([
      { id: 'd1' },
    ]);
  });

  it('fails over GET to the next origin after a 503', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });

    await expect(internalGet('http://a:1,http://b:2', '/x', 'key')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('http://b:2/x');
  });

  it('does not retry POST after a 503 (avoids duplicate writes)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    await expect(internalPost('http://a:1,http://b:2', '/x', 'key', { n: 1 })).rejects.toThrow(/503/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('forwards the bearer token', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ userId: 'u1' }) });
    await bearerGet('http://identity:3001', '/api/v1/auth/me', 'token-1');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer token-1');
  });
});
