import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthContext } from './types/auth-context';

@Injectable()
export class AuthzService {
  hasPermission(auth: AuthContext, permission: string): boolean {
    return auth.permissions.includes(permission);
  }

  assertPermission(auth: AuthContext, permission: string): void {
    if (!this.hasPermission(auth, permission)) {
      throw new ForbiddenException('You are not allowed to perform this action.');
    }
  }

  assertDistrictAccess(auth: AuthContext, districtId: string): void {
    if (auth.isSuperAdmin) {
      return;
    }
    if (!auth.districtIds.includes(districtId)) {
      throw new ForbiddenException('You are not allowed to access this district.');
    }
  }

  assertDepartmentAccess(auth: AuthContext, department: { id: string; districtId: string }): void {
    this.assertDistrictAccess(auth, department.districtId);
    if (auth.isSuperAdmin) {
      return;
    }
    if (auth.departmentIds.length === 0) {
      return;
    }
    if (!auth.departmentIds.includes(department.id)) {
      throw new ForbiddenException('You are not allowed to access this department.');
    }
  }

  visibleDistrictIds(auth: AuthContext): string[] | null {
    return auth.isSuperAdmin ? null : auth.districtIds;
  }

  visibleDepartmentIds(auth: AuthContext): string[] | null {
    if (auth.isSuperAdmin) {
      return null;
    }
    return auth.departmentIds.length > 0 ? auth.departmentIds : null;
  }
}
