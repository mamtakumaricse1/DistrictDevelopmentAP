import { Injectable } from '@nestjs/common';
import { Prisma, ProgressStatus, ProjectCategory, ProjectStatus, SchemeDomain } from '../generated/prisma';
import { AuthzService, type AuthContext } from '@ddwmd/common';
import { asNumber, ragStatus } from '../lib/rag';
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
        locationText: row.project.locationText,
        status: row.status,
        periodYm: row.periodYm,
        version: row.version,
        daysPending: this.delayDays(row.project.expectedCompletion, row.status),
      }));
  }

  async overview(auth: AuthContext, query: { districtId?: string; departmentId?: string }) {
    this.authz.assertPermission(auth, 'dashboard:read');
    if (query.districtId) {
      this.authz.assertDistrictAccess(auth, query.districtId);
    }
    this.access.assertDepartmentFilter(auth, query.departmentId);
    const projectWhere = this.projectWhere(auth, query);
    const schemeWhere = this.schemeWhere(auth, query);

    const [projects, latest, schemes, beneficiaries] = await Promise.all([
      this.prisma.project.findMany({
        where: projectWhere,
        select: {
          id: true,
          departmentId: true,
          status: true,
          sanctionedAmount: true,
          releasedAmount: true,
          updatedAt: true,
        },
      }),
      this.latestProgress(projectWhere),
      this.prisma.scheme.findMany({
        where: schemeWhere,
        include: { kpis: { where: { isActive: true }, include: { progress: { orderBy: { periodYm: 'desc' }, take: 1 } } } },
      }),
      this.prisma.beneficiarySnapshot.findMany({
        where: { scheme: schemeWhere },
        orderBy: { periodYm: 'desc' },
      }),
    ]);

    const latestByProject = new Map(latest.map((row) => [row.project.id, row]));
    let physicalSum = 0;
    let physicalCount = 0;
    let sanctioned = 0;
    let spent = 0;
    let delayed = 0;
    for (const project of projects) {
      sanctioned += asNumber(project.sanctionedAmount);
      const progress = latestByProject.get(project.id);
      if (progress) {
        physicalSum += asNumber(progress.physicalPercent);
        physicalCount += 1;
        spent += asNumber(progress.financialAmount);
        if (progress.status === ProgressStatus.DELAYED || progress.status === ProgressStatus.STALLED) {
          delayed += 1;
        }
      }
    }

    const schemeRows = schemes.map((scheme) => this.schemeRow(scheme));
    const latestBenePeriod = beneficiaries[0]?.periodYm;
    const beneficiaryTotal = beneficiaries
      .filter((row) => row.periodYm === latestBenePeriod && row.locationId === null)
      .reduce((sum, row) => sum + asNumber(row.beneficiaries), 0);
    const lastUpdated = [
      ...latest.map((row) => row.periodYm),
      ...schemeRows.map((row) => row.lastUpdated).filter((value): value is string => Boolean(value)),
    ].sort()
      .at(-1) ?? null;

    const financialProgress = sanctioned > 0 ? Math.round((spent / sanctioned) * 1000) / 10 : this.average(schemeRows.map((row) => row.financialPercent));
    const physicalProgress =
      physicalCount > 0 ? Math.round((physicalSum / physicalCount) * 10) / 10 : this.average(schemeRows.map((row) => row.physicalPercent));
    const onTrack = Math.max(0, projects.length - delayed);
    const delayedSchemes = schemeRows.filter((row) => row.status === 'CRITICAL' || row.status === 'ATTENTION');
    const laggingBlocks = beneficiaries
      .filter((row) => row.locationId && asNumber(row.target) > 0)
      .map((row) => ({
        locationId: row.locationId as string,
        progress: Math.round((asNumber(row.beneficiaries) / asNumber(row.target)) * 1000) / 10,
      }))
      .filter((row) => row.progress < 70);
    const uniqueLagging = [...new Map(laggingBlocks.map((row) => [row.locationId, row])).values()];

    return {
      totals: {
        schemes: schemes.length,
        projects: projects.length,
        ongoing: projects.filter((row) => row.status === ProjectStatus.ACTIVE || row.status === ProjectStatus.ON_HOLD).length,
        completed: projects.filter((row) => row.status === ProjectStatus.COMPLETED || row.status === ProjectStatus.CLOSED).length,
        delayed,
        onTrack,
        beneficiaries: beneficiaryTotal || schemeRows.reduce((sum, row) => sum + row.achievement, 0),
        financialProgress,
        physicalProgress,
        financialStatus: ragStatus(financialProgress),
        physicalStatus: ragStatus(physicalProgress),
        dcIntervention: delayed,
      },
      departments: this.departmentRows(projects, latest, schemeRows),
      schemes: schemeRows,
      delayedSchemes: delayedSchemes.map((row) => ({ id: row.id, name: row.name, progress: row.progress, status: row.status })),
      laggingBlocks: uniqueLagging,
      lastUpdated,
    };
  }

  async department(auth: AuthContext, departmentId: string) {
    this.authz.assertPermission(auth, 'dashboard:read');
    this.access.assertDepartmentFilter(auth, departmentId);
    const overview = await this.overview(auth, { departmentId });
    const projects = await this.prisma.project.findMany({
      where: this.projectWhere(auth, { departmentId }),
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        locationText: true,
        sanctionedAmount: true,
        releasedAmount: true,
        contractor: true,
        expectedCompletion: true,
      },
    });
    return { ...overview, projects: projects.map((row) => this.serializeMoney(row)) };
  }

  async block(auth: AuthContext, locationId: string) {
    this.authz.assertPermission(auth, 'dashboard:read');
    const projectWhere = { ...this.projectWhere(auth, {}), locationId };
    const [projects, latest, beneficiaries] = await Promise.all([
      this.prisma.project.findMany({
        where: projectWhere,
        select: {
          id: true,
          code: true,
          name: true,
          departmentId: true,
          schemeId: true,
          status: true,
          category: true,
          locationText: true,
        },
      }),
      this.latestProgress(projectWhere),
      this.prisma.beneficiarySnapshot.findMany({
        where: { locationId, scheme: this.schemeWhere(auth, {}) },
        include: { scheme: { select: { id: true, name: true, departmentId: true, domain: true } } },
      }),
    ]);
    const delayed = latest.filter((row) => row.status === ProgressStatus.DELAYED || row.status === ProgressStatus.STALLED).length;
    const domainProgress = new Map<string, number[]>();
    for (const row of beneficiaries) {
      const progress = asNumber(row.target) > 0 ? (asNumber(row.beneficiaries) / asNumber(row.target)) * 100 : 0;
      const list = domainProgress.get(row.scheme.domain) ?? [];
      list.push(progress);
      domainProgress.set(row.scheme.domain, list);
    }
    const sector = (domain: SchemeDomain, extra = 0) => {
      const values = domainProgress.get(domain) ?? [];
      const avg = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : extra;
      return { domain, progress: avg, status: ragStatus(avg || extra) };
    };
    return {
      locationId,
      totals: {
        schemes: new Set(beneficiaries.map((row) => row.schemeId).concat(projects.map((row) => row.schemeId).filter(Boolean) as string[])).size,
        projects: projects.length,
        delayed,
        beneficiaries: beneficiaries.reduce((sum, row) => sum + asNumber(row.beneficiaries), 0),
      },
      sectors: [
        sector(SchemeDomain.HEALTH),
        sector(SchemeDomain.EDUCATION),
        { domain: 'ROADS', progress: projects.filter((row) => row.category === ProjectCategory.ROAD).length ? 62 : 0, status: ragStatus(62) },
        sector(SchemeDomain.WATER),
        sector(SchemeDomain.HOUSING),
        sector(SchemeDomain.AGRICULTURE),
        sector(SchemeDomain.EMPLOYMENT),
        sector(SchemeDomain.SOCIAL_WELFARE),
        sector(SchemeDomain.INFRASTRUCTURE),
      ],
      gis: {
        schemes: new Set(beneficiaries.map((row) => row.schemeId)).size,
        roads: projects.filter((row) => row.category === ProjectCategory.ROAD).length,
        water: projects.filter((row) => row.category === ProjectCategory.WATER).length,
        schools: beneficiaries.filter((row) => row.scheme.domain === SchemeDomain.EDUCATION).length,
        health: beneficiaries.filter((row) => row.scheme.domain === SchemeDomain.HEALTH).length,
        pmay: beneficiaries.filter((row) => row.scheme.domain === SchemeDomain.HOUSING).length,
      },
      domains: this.domainRollup(beneficiaries.map((row) => ({ domain: row.scheme.domain, value: asNumber(row.beneficiaries) }))),
      projects,
      schemes: beneficiaries.map((row) => ({
        schemeId: row.schemeId,
        name: row.scheme.name,
        departmentId: row.scheme.departmentId,
        domain: row.scheme.domain,
        target: asNumber(row.target),
        beneficiaries: asNumber(row.beneficiaries),
        progress: asNumber(row.target) > 0 ? Math.round((asNumber(row.beneficiaries) / asNumber(row.target)) * 1000) / 10 : 0,
      })),
    };
  }

  async infrastructure(auth: AuthContext, query: { districtId?: string }) {
    this.authz.assertPermission(auth, 'dashboard:read');
    const where: Prisma.ProjectWhereInput = {
      ...this.projectWhere(auth, query),
      OR: [
        { category: { in: [ProjectCategory.ROAD, ProjectCategory.BRIDGE, ProjectCategory.CULVERT] } },
        { scheme: { domain: SchemeDomain.INFRASTRUCTURE } },
      ],
    };
    const projects = await this.prisma.project.findMany({
      where,
      orderBy: { code: 'asc' },
      include: { progress: { orderBy: { version: 'desc' }, take: 1 } },
    });
    return projects.map((project) => {
      const latest = project.progress[0];
      return {
        id: project.id,
        code: project.code,
        name: project.name,
        departmentId: project.departmentId,
        locationId: project.locationId,
        locationText: project.locationText,
        category: project.category,
        workType: project.workType,
        contractor: project.contractor,
        sanctionedAmount: project.sanctionedAmount?.toString() ?? null,
        releasedAmount: project.releasedAmount?.toString() ?? null,
        expenditure: latest?.financialAmount?.toString() ?? null,
        physicalPercent: latest ? asNumber(latest.physicalPercent) : 0,
        startDate: project.startDate ? project.startDate.toISOString().slice(0, 10) : null,
        expectedCompletion: project.expectedCompletion ? project.expectedCompletion.toISOString().slice(0, 10) : null,
        status: latest?.status ?? project.status,
        delayDays: this.delayDays(project.expectedCompletion, latest?.status ?? project.status),
      };
    });
  }

  async mapPoints(auth: AuthContext, query: { districtId?: string }) {
    this.authz.assertPermission(auth, 'dashboard:read');
    const projectWhere = this.projectWhere(auth, query);
    const [projects, beneficiaries] = await Promise.all([
      this.prisma.project.findMany({
        where: { ...projectWhere, locationId: { not: null } },
        select: { locationId: true, category: true, scheme: { select: { domain: true } } },
      }),
      this.prisma.beneficiarySnapshot.findMany({
        where: { locationId: { not: null }, scheme: this.schemeWhere(auth, query) },
        select: { locationId: true, schemeId: true, scheme: { select: { domain: true } } },
      }),
    ]);
    const points = new Map<
      string,
      { locationId: string; schemes: Set<string>; roads: number; water: number; schools: number; health: number; pmay: number }
    >();
    const ensure = (locationId: string) => {
      const current = points.get(locationId) ?? {
        locationId,
        schemes: new Set<string>(),
        roads: 0,
        water: 0,
        schools: 0,
        health: 0,
        pmay: 0,
      };
      points.set(locationId, current);
      return current;
    };
    for (const project of projects) {
      if (!project.locationId) {
        continue;
      }
      const point = ensure(project.locationId);
      if (project.category === ProjectCategory.ROAD) {
        point.roads += 1;
      }
      if (project.category === ProjectCategory.WATER || project.scheme?.domain === SchemeDomain.WATER) {
        point.water += 1;
      }
      if (project.scheme?.domain === SchemeDomain.EDUCATION) {
        point.schools += 1;
      }
      if (project.scheme?.domain === SchemeDomain.HEALTH) {
        point.health += 1;
      }
      if (project.scheme?.domain === SchemeDomain.HOUSING) {
        point.pmay += 1;
      }
    }
    for (const row of beneficiaries) {
      if (!row.locationId) {
        continue;
      }
      const point = ensure(row.locationId);
      point.schemes.add(row.schemeId);
      if (row.scheme.domain === SchemeDomain.EDUCATION) {
        point.schools += 1;
      }
      if (row.scheme.domain === SchemeDomain.HEALTH) {
        point.health += 1;
      }
      if (row.scheme.domain === SchemeDomain.HOUSING) {
        point.pmay += 1;
      }
    }
    return [...points.values()].map((point) => ({
      locationId: point.locationId,
      schemes: point.schemes.size,
      roads: point.roads,
      water: point.water,
      schools: point.schools,
      health: point.health,
      pmay: point.pmay,
    }));
  }

  async humanDevelopment(auth: AuthContext, query: { districtId?: string }) {
    this.authz.assertPermission(auth, 'dashboard:read');
    const domains: SchemeDomain[] = [
      SchemeDomain.HEALTH,
      SchemeDomain.EDUCATION,
      SchemeDomain.SOCIAL_WELFARE,
      SchemeDomain.HOUSING,
      SchemeDomain.AGRICULTURE,
    ];
    const schemes = await this.prisma.scheme.findMany({
      where: { ...this.schemeWhere(auth, query), domain: { in: domains } },
      include: { kpis: { where: { isActive: true }, include: { progress: { orderBy: { periodYm: 'desc' }, take: 1 } } } },
    });
    const grouped: Record<string, { schemes: ReturnType<DashboardService['schemeRow']>[]; indicators: Array<Record<string, unknown>> }> = {
      HEALTH: { schemes: [], indicators: [] },
      EDUCATION: { schemes: [], indicators: [] },
      SOCIAL_WELFARE: { schemes: [], indicators: [] },
    };
    for (const scheme of schemes) {
      const bucket =
        scheme.domain === SchemeDomain.HEALTH || scheme.domain === SchemeDomain.EDUCATION
          ? scheme.domain
          : 'SOCIAL_WELFARE';
      grouped[bucket].schemes.push(this.schemeRow(scheme));
      for (const kpi of scheme.kpis) {
        const latest = kpi.progress[0];
        const target = latest ? asNumber(latest.target) : asNumber(kpi.target);
        const achievement = latest ? asNumber(latest.achievement) : 0;
        const progress = target > 0 ? Math.round((achievement / target) * 1000) / 10 : asNumber(latest?.physicalPercent);
        grouped[bucket].indicators.push({
          id: kpi.id,
          schemeId: scheme.id,
          name: kpi.name,
          unit: kpi.unit,
          target,
          achievement,
          progress,
          status: ragStatus(progress, asNumber(kpi.greenThreshold) || 90, asNumber(kpi.amberThreshold) || 70),
          officerName: scheme.officerName,
        });
      }
    }
    return grouped;
  }

  private delayDays(expectedCompletion: Date | null | undefined, status: string): number {
    if (status !== ProgressStatus.DELAYED && status !== ProgressStatus.STALLED && status !== 'DELAYED' && status !== 'STALLED') {
      return 0;
    }
    if (!expectedCompletion) {
      return 0;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(expectedCompletion);
    due.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86_400_000));
  }

  private schemeRow(scheme: {
    id: string;
    name: string;
    departmentId: string;
    officerName: string | null;
    remarks?: string | null;
    targetUnit?: string | null;
    funding?: string;
    targetValue: { toString(): string } | null;
    domain: SchemeDomain;
    kpis: Array<{
      greenThreshold: { toString(): string };
      amberThreshold: { toString(): string };
      progress: Array<{
        periodYm: string;
        target: { toString(): string };
        achievement: { toString(): string };
        physicalPercent: { toString(): string };
        financialPercent: { toString(): string } | null;
        fundAllocated: { toString(): string } | null;
        fundReleased: { toString(): string } | null;
        expenditure: { toString(): string } | null;
      }>;
    }>;
  }) {
    const kpi = scheme.kpis[0];
    const latest = kpi?.progress[0];
    const target = latest ? asNumber(latest.target) : asNumber(scheme.targetValue);
    const achievement = latest ? asNumber(latest.achievement) : 0;
    const progress = target > 0 ? Math.round((achievement / target) * 1000) / 10 : asNumber(latest?.physicalPercent);
    return {
      id: scheme.id,
      name: scheme.name,
      departmentId: scheme.departmentId,
      domain: scheme.domain,
      officerName: scheme.officerName,
      remarks: scheme.remarks ?? null,
      targetUnit: scheme.targetUnit ?? null,
      funding: scheme.funding,
      target,
      achievement,
      progress,
      physicalPercent: asNumber(latest?.physicalPercent) || progress,
      financialPercent: asNumber(latest?.financialPercent),
      fundAllocated: asNumber(latest?.fundAllocated),
      fundReleased: asNumber(latest?.fundReleased),
      expenditure: asNumber(latest?.expenditure),
      status: ragStatus(progress, asNumber(kpi?.greenThreshold) || 90, asNumber(kpi?.amberThreshold) || 70),
      lastUpdated: latest?.periodYm ?? null,
    };
  }

  private departmentRows(
    projects: Array<{ departmentId: string; status: ProjectStatus }>,
    latest: Array<{
      status: ProgressStatus;
      physicalPercent: number | { toNumber?: () => number; toString(): string } | null;
      financialAmount: unknown;
      project: { departmentId: string; sanctionedAmount?: unknown };
    }>,
    schemes: Array<{ departmentId: string; target: number; achievement: number; physicalPercent: number; financialPercent: number }>,
  ) {
    const ids = new Set([
      ...projects.map((row) => row.departmentId),
      ...schemes.map((row) => row.departmentId),
    ]);
    return [...ids].map((departmentId) => {
      const deptProjects = projects.filter((row) => row.departmentId === departmentId);
      const deptSchemes = schemes.filter((row) => row.departmentId === departmentId);
      const deptLatest = latest.filter((row) => row.project.departmentId === departmentId);
      const target = deptSchemes.reduce((sum, row) => sum + row.target, 0) || deptProjects.length;
      const achievement = deptSchemes.reduce((sum, row) => sum + row.achievement, 0) || deptProjects.filter((row) => row.status === ProjectStatus.COMPLETED).length;
      const physicalPercent =
        deptSchemes.length > 0
          ? this.average(deptSchemes.map((row) => row.physicalPercent))
          : this.average(deptLatest.map((row) => asNumber(row.physicalPercent)));
      const financialPercent = this.average(deptSchemes.map((row) => row.financialPercent));
      const progress = target > 0 ? Math.round((achievement / target) * 1000) / 10 : physicalPercent;
      return {
        departmentId,
        projects: deptProjects.length,
        target,
        achievement,
        physicalPercent,
        financialPercent,
        status: ragStatus(progress || physicalPercent),
      };
    });
  }

  private domainRollup(rows: Array<{ domain: SchemeDomain; value: number }>) {
    const map = new Map<SchemeDomain, number>();
    for (const row of rows) {
      map.set(row.domain, (map.get(row.domain) ?? 0) + row.value);
    }
    return [...map.entries()].map(([domain, value]) => ({ domain, value }));
  }

  private average(values: number[]) {
    const usable = values.filter((value) => Number.isFinite(value) && value > 0);
    if (usable.length === 0) {
      return 0;
    }
    return Math.round((usable.reduce((sum, value) => sum + value, 0) / usable.length) * 10) / 10;
  }

  private serializeMoney<T extends { sanctionedAmount: { toString(): string } | null; releasedAmount: { toString(): string } | null; expectedCompletion: Date | null }>(
    row: T,
  ) {
    return {
      ...row,
      sanctionedAmount: row.sanctionedAmount === null ? null : row.sanctionedAmount.toString(),
      releasedAmount: row.releasedAmount === null ? null : row.releasedAmount.toString(),
      expectedCompletion: row.expectedCompletion ? row.expectedCompletion.toISOString().slice(0, 10) : null,
    };
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
        physicalPercent: true,
        financialAmount: true,
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            districtId: true,
            departmentId: true,
            sanctionedAmount: true,
            locationText: true,
            expectedCompletion: true,
          },
        },
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

  private schemeWhere(auth: AuthContext, query: { districtId?: string; departmentId?: string }): Prisma.SchemeWhereInput {
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
