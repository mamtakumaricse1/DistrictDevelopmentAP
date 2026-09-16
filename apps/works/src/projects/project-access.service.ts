import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthzService, type AuthContext } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async requireProject(auth: AuthContext, projectId: string, permission: string) {
    this.authz.assertPermission(auth, permission);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, code: true, name: true, districtId: true, departmentId: true, isActive: true },
    });
    if (!project || !project.isActive) {
      throw new NotFoundException('Project not found.');
    }
    this.authz.assertDistrictAccess(auth, project.districtId);
    this.authz.assertDepartmentAccess(auth, { id: project.departmentId, districtId: project.districtId });
    return project;
  }

  assertDepartmentFilter(auth: AuthContext, departmentId?: string): void {
    const allowed = this.authz.visibleDepartmentIds(auth);
    if (departmentId && allowed && !allowed.includes(departmentId)) {
      throw new ForbiddenException('You are not allowed to access this department.');
    }
  }
}
