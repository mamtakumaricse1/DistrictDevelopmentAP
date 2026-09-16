import { ConfigService } from '@nestjs/config';
import { RemoteDistrictIssuerStore } from './remote-district-issuer.store';

describe('RemoteDistrictIssuerStore', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('caches the Organization district list', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: 'd1', code: 'CLG', keycloakIssuer: 'http://kc/realms/clg' }],
    });
    const store = new RemoteDistrictIssuerStore({
      get: (key: string) => {
        if (key === 'ORGANIZATION_URL') {
          return 'http://organization:3002';
        }
        if (key === 'INTERNAL_API_KEY') {
          return 'dev-internal-key';
        }
        if (key === 'ISSUER_CACHE_TTL_MS') {
          return '30000';
        }
        return undefined;
      },
    } as ConfigService);

    await expect(store.findByIssuer('http://kc/realms/clg')).resolves.toEqual({
      issuer: 'http://kc/realms/clg',
      districtId: 'd1',
      districtCode: 'CLG',
    });
    await expect(store.findByIssuer('http://kc/realms/missing')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
