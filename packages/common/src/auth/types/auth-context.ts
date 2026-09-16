export type AuthRoleAssignment = {
  code: string;
  districtId: string | null;
};

export type AuthContext = {
  userId: string;
  email: string;
  displayName: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  issuer: string;
  roles: AuthRoleAssignment[];
  districtIds: string[];
  departmentIds: string[];
  agencyIds: string[];
  permissions: string[];
};

export type VerifiedAccessToken = {
  sub: string;
  iss: string;
  email?: string;
  name?: string;
  azp?: string;
  aud?: string | string[];
};
