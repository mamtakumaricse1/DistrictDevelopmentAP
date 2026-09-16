import { apiGet, apiPatch, apiPost, apiPut } from './client';

export type DistrictRecord = {
  id: string;
  code: string;
  name: string;
  stateCode: string;
  stateName: string;
  headquarters: string | null;
  timezone: string;
  isActive: boolean;
  keycloakRealm: string | null;
  keycloakIssuer: string | null;
};

export type DepartmentRecord = {
  id: string;
  districtId: string;
  code: string;
  name: string;
  shortName: string | null;
  isActive: boolean;
};

export type AgencyRecord = {
  id: string;
  districtId: string;
  departmentId: string | null;
  code: string;
  name: string;
  agencyType: 'IMPLEMENTING' | 'EXECUTING' | 'BOTH';
  isActive: boolean;
};

export type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  isActive: boolean;
  keycloakIssuer: string;
  lastLoginAt: string | null;
  roles: Array<{ districtId: string | null; role: { code: string; name: string } }>;
  departments: Array<{ departmentId: string; department: { code: string; name: string } }>;
};

export type RoleRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Array<{ permission: { code: string; name: string; module: string } }>;
};

export type MasterCategory = { id: string; code: string; name: string };

export type MasterItem = {
  id: string;
  categoryId: string;
  districtId: string | null;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  category: { code: string; name: string };
};

export type SettingRecord = {
  id: string;
  districtId: string | null;
  key: string;
  value: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
};

const inactive = 'includeInactive=true';

export const adminApi = {
  districts: () => apiGet<DistrictRecord[]>(`/districts?${inactive}`),
  createDistrict: (body: unknown) => apiPost<DistrictRecord>('/districts', body),
  updateDistrict: (id: string, body: unknown) => apiPatch<DistrictRecord>(`/districts/${id}`, body),

  departments: (districtId?: string) =>
    apiGet<DepartmentRecord[]>(`/departments?${inactive}${districtId ? `&districtId=${districtId}` : ''}`),
  createDepartment: (body: unknown) => apiPost<DepartmentRecord>('/departments', body),
  updateDepartment: (id: string, body: unknown) => apiPatch<DepartmentRecord>(`/departments/${id}`, body),

  agencies: (districtId?: string) =>
    apiGet<AgencyRecord[]>(`/agencies${districtId ? `?districtId=${districtId}` : ''}`),
  createAgency: (body: unknown) => apiPost<AgencyRecord>('/agencies', body),
  updateAgency: (id: string, body: unknown) => apiPatch<AgencyRecord>(`/agencies/${id}`, body),

  users: (districtId?: string) =>
    apiGet<UserRecord[]>(`/users${districtId ? `?districtId=${districtId}` : ''}`),
  createUser: (body: unknown) => apiPost<UserRecord>('/users', body),
  updateUser: (id: string, body: unknown) => apiPatch<UserRecord>(`/users/${id}`, body),

  roles: () => apiGet<RoleRecord[]>('/roles'),

  categories: () => apiGet<MasterCategory[]>('/master-data/categories'),
  createCategory: (body: unknown) => apiPost<MasterCategory>('/master-data/categories', body),
  items: (categoryId?: string) =>
    apiGet<MasterItem[]>(`/master-data/items${categoryId ? `?categoryId=${categoryId}` : ''}`),
  createItem: (body: unknown) => apiPost<MasterItem>('/master-data/items', body),
  updateItem: (id: string, body: unknown) => apiPatch<MasterItem>(`/master-data/items/${id}`, body),

  settings: (districtId?: string) =>
    apiGet<SettingRecord[]>(`/settings${districtId ? `?districtId=${districtId}` : ''}`),
  upsertSetting: (body: unknown) => apiPut<SettingRecord>('/settings', body),
};
