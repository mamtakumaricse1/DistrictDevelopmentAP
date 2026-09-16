import { Injectable } from '@nestjs/common';
import { Prisma, ProgressStatus } from '../generated/prisma';
import { AuthzService, type AuthContext } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly access: ProjectAccessService,
  ) {}

  async summary(auth: AuthContext, query: { districtId?: string; departmentId?: string }) {
    this.authz.assertPermission(auth, 'dashboard:read');
    if (query.districtId) {
      this.authz.assertDistrictAccess(auth, query.districtId);
    }
    this.access.assertDepartmentFilter(auth, query.departmentId);
    const where = this.projectWhere(auth, query);

    const [total, byStatus, latest] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.latestProgress(where),
    ]);

    const progressCounts = { delayed: 0, stalled: 0, inProgress: 0, completed: 0, notStarted: 0 };
    const byDepartment = new Map<string, { departmentId: string; delayed: number; stalled: number; total: number }>();
    for (const row of latest) {
      if (row.status === ProgressStatus.DELAYED) {
        progressCounts.delayed += 1;
      } else if (row.status === ProgressStatus.STALLED) {
        progressCounts.stalled += 1;
      } else if (row.status === ProgressStatus.IN_PROGRESS) {
        progressCounts.inProgress += 1;
      } else if (row.status === ProgressStatus.COMPLETED) {
        progressCounts.completed += 1;
      } else {
        progressCounts.notStarted += 1;
      }
      const departmentId = row.project.departmentId;
      const current = byDepartment.get(departmentId) ?? { departmentId, delayed: 0, stalled: 0, total: 0 };
      current.total += 1;
      if (row.status === ProgressStatus.DELAYED) {
        current.delayed += 1;
      }
      if (row.status === ProgressStatus.STALLED) {
        current.stalled += 1;
      }
      byDepartment.set(departmentId, current);
    }

    return {
      totals: {
        projects: total,
        ...Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
      },
      latestProgress: progressCounts,
      byDepartment: [...byDepartment.values()],
    };
  }

  async delayed(auth: AuthContext, query: { districtId?: string; departmentId?: string }) {
    this.authz.assertPermission(auth, 'dashboard:read');
    if (query.districtId) {
      this.authz.assertDistrictAccess(auth, query.districtId);
    }
    this.access.assertDepartmentFilter(auth, query.departmentId);
    const latest = await this.latestProgress(this.projectWhere(auth, query));
    return latest
      .filter((row) => row.status === ProgressStatus.DELAYED || row.status === ProgressStatus.STALLED)
      .map((row) => ({
        projectId: row.project.id,
        code: row.project.code,
        name: row.project.name,
        districtId: row.project.districtId,
        departmentId: row.project.departmentId,
        status: row.status,
        periodYm: row.periodYm,
        version: row.version,
      }));
  }

  private latestProgress(projectWhere: Prisma.ProjectWhereInput) {
    return this.prisma.projectProgress.findMany({
      where: { project: projectWhere },
      distinct: ['projectId'],
      orderBy: [{ projectId: 'asc' }, { version: 'desc' }],
      select: {
        version: true,
        status: true,
        periodYm: true,
        project: { select: { id: true, code: true, name: true, districtId: true, departmentId: true } },
      },
    });
  }

  private projectWhere(auth: AuthContext, query: { districtId?: string; departmentId?: string }): Prisma.ProjectWhereInput {
    const districtIds = this.authz.visibleDistrictIds(auth);
    const departmentIds = this.authz.visibleDepartmentIds(auth);
    return {
      isActive: true,
      ...(query.districtId ? { districtId: query.districtId } : districtIds ? { districtId: { in: districtIds } } : {}),
      ...(query.departmentId
        ? { departmentId: query.departmentId }
        : departmentIds
          ? { departmentId: { in: departmentIds } }
          : {}),
    };
  }
}
