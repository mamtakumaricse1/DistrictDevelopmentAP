export const DISTRICT_ISSUER_STORE = 'DISTRICT_ISSUER_STORE';
export const USER_DIRECTORY = 'USER_DIRECTORY';
export const DATABASE_PING = 'DATABASE_PING';

export type DistrictIssuerRecord = {
  issuer: string;
  districtId: string;
  districtCode: string;
};

export type DistrictIssuerStore = {
  findByIssuer(issuer: string): Promise<DistrictIssuerRecord | null>;
};

export type DatabasePing = {
  $queryRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
};
