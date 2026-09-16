import { apiGet } from './client';

export type LoginOption = {
  kind: 'system' | 'district';
  label: string;
  code: string;
  issuer: string;
  realm: string;
  clientId: string;
  districtId: string | null;
};

export type MeResponse = {
  userId: string;
  email: string;
  displayName: string;
  isSuperAdmin: boolean;
  issuer: string;
  roles: Array<{ code: string; districtId: string | null }>;
  districtIds: string[];
  departmentIds: string[];
  agencyIds: string[];
  permissions: string[];
};

export function fetchLoginOptions(): Promise<LoginOption[]> {
  return apiGet<LoginOption[]>('/auth/login-options', { anonymous: true });
}

export function fetchMe(): Promise<MeResponse> {
  return apiGet<MeResponse>('/auth/me');
}
