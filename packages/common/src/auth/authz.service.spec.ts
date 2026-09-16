import { ForbiddenException } from '@nestjs/common';
import { AuthzService } from './authz.service';
import { AuthContext } from './types/auth-context';

function ctx(partial: Partial<AuthContext>): AuthContext {
  return {
    userId: 'u1',
    email: 'user@example.gov.in',
    displayName: 'User',
    isSuperAdmin: false,
    isActive: true,
    issuer: 'http://localhost:8080/realms/changlang',
    roles: [],
    districtIds: [],
    departmentIds: [],
    agencyIds: [],
    permissions: [],
    ...partial,
  };
}

const changlang = '11111111-1111-1111-1111-111111111111';
const tirap = '22222222-2222-2222-2222-222222222222';
const pwdChanglang = '33333333-3333-3333-3333-333333333333';
const eduChanglang = '44444444-4444-4444-4444-444444444444';
const pwdTirap = '55555555-5555-5555-5555-555555555555';

describe('AuthzService', () => {
  const authz = new AuthzService();

  const districtAdmin = ctx({
    roles: [{ code: 'DISTRICT_ADMIN', districtId: changlang }],
    districtIds: [changlang],
    permissions: ['district:read', 'project:create', 'project:read'],
  });

  const departmentUser = ctx({
    roles: [{ code: 'DEPARTMENT_USER', districtId: changlang }],
    districtIds: [changlang],
    departmentIds: [pwdChanglang],
    permissions: ['district:read', 'project:read', 'progress:submit'],
  });

  const viewer = ctx({
    roles: [{ code: 'VIEWER', districtId: changlang }],
    districtIds: [changlang],
    permissions: ['district:read', 'project:read'],
  });

  const superAdmin = ctx({
    isSuperAdmin: true,
    issuer: 'http://localhost:8080/realms/system',
    roles: [{ code: 'SUPER_ADMIN', districtId: null }],
    permissions: ['district:manage', 'project:create', 'project:read'],
  });

  it('allows a district admin in their own district', () => {
    expect(() => authz.assertDistrictAccess(districtAdmin, changlang)).not.toThrow();
  });

  it('denies a district admin from another district', () => {
    expect(() => authz.assertDistrictAccess(districtAdmin, tirap)).toThrow(ForbiddenException);
  });

  it('denies a Changlang department user access to a Tirap department', () => {
    expect(() =>
      authz.assertDepartmentAccess(departmentUser, { id: pwdTirap, districtId: tirap }),
    ).toThrow(ForbiddenException);
  });

  it('denies a PWD user access to Education in the same district', () => {
    expect(() =>
      authz.assertDepartmentAccess(departmentUser, { id: eduChanglang, districtId: changlang }),
    ).toThrow(ForbiddenException);
  });

  it('allows a PWD user their own department', () => {
    expect(() =>
      authz.assertDepartmentAccess(departmentUser, { id: pwdChanglang, districtId: changlang }),
    ).not.toThrow();
  });

  it('denies a viewer creating a project', () => {
    expect(() => authz.assertPermission(viewer, 'project:create')).toThrow(ForbiddenException);
  });

  it('allows a super admin any district', () => {
    expect(() => authz.assertDistrictAccess(superAdmin, tirap)).not.toThrow();
  });
});
