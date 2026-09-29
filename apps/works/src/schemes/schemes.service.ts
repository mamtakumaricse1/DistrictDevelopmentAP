import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { KpiFrequency, Prisma, SchemeDomain } from '../generated/prisma';
import { AuthzService, type AuthContext } from '@ddwmd/common';
import { OrganizationCatalogClient } from '../auth/organization-catalog.client';
import { asNumber, ragStatus } from '../lib/rag';
import { acceptedReportingFrequency, assertCanSetReportingFrequency } from '../lib/reporting-frequency';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKpiDto, CreateSchemeDto, SubmitKpiProgressDto, UpdateSchemeDto } from './dto/scheme.dto';

@Injectable()
export class SchemesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly catalog: OrganizationCatalogClient,
  ) {}

  async list(
    auth: AuthContext,
    query: { districtId?: string; departmentId?: string; domain?: SchemeDomain },
  ) {
    this.authz.assertPermission(auth, 'project:read');
    const where = this.schemeWhere(auth, query);
    const schemes = await this.prisma.scheme.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { kpis: { where: { isActive: true }, include: { progress: { orderBy: { periodYm: 'desc' }, take: 1 } } } },
    });
    return schemes.map((scheme) => this.serializeScheme(scheme));
  }

  async getById(auth: AuthContext, id: string) {
    this.authz.assertPermission(auth, 'project:read');
    const scheme = await this.prisma.scheme.findUnique({
      where: { id },
      include: {
        kpis: { where: { isActive: true }, include: { progress: { orderBy: { periodYm: 'desc' }, take: 4 } } },
        beneficiaries: { orderBy: { periodYm: 'desc' } },
        projects: { where: { isActive: true }, select: { id: true, code: true, name: true, status: true, locationId: true } },
      },
    });
    if (!scheme) {
      throw new NotFoundException('Scheme not found.');
    }
    this.authz.assertDistrictAccess(auth, scheme.districtId);
    this.authz.assertDepartmentAccess(auth, { id: scheme.departmentId, districtId: scheme.districtId });
    const latestPeriod = scheme.beneficiaries[0]?.periodYm;
    const blockWise = scheme.beneficiaries
      .filter((row) => row.periodYm === latestPeriod && row.locationId)
      .map((row) => ({
        locationId: row.locationId,
        target: asNumber(row.target),
        beneficiaries: asNumber(row.beneficiaries),
        progress: asNumber(row.target) > 0 ? Math.round((asNumber(row.beneficiaries) / asNumber(row.target)) * 1000) / 10 : 0,
      }));
    return { ...this.serializeScheme(scheme), blockWise, projects: scheme.projects };
  }

  async create(auth: AuthContext, dto: CreateSchemeDto) {
    this.authz.assertPermission(auth, 'project:create');
    const department = await this.catalog.getDepartment(dto.departmentId);
    this.authz.assertDistrictAccess(auth, department.districtId);
    this.authz.assertDepartmentAccess(auth, { id: department.id, districtId: department.districtId });
    try {
      const created = await this.prisma.scheme.create({
        data: {
          districtId: department.districtId,
          departmentId: department.id,
          code: dto.code.trim().toUpperCase(),
          name: dto.name.trim(),
          funding: dto.funding,
          domain: dto.domain,
          officerName: dto.officerName?.trim(),
          remarks: dto.remarks?.trim(),
          targetValue: dto.targetValue === undefined ? undefined : new Prisma.Decimal(dto.targetValue),
          targetUnit: dto.targetUnit?.trim(),
          reportingFrequency: acceptedReportingFrequency(this.authz, auth, dto.reportingFrequency),
          createdById: auth.userId,
          updatedById: auth.userId,
        },
        include: { kpis: true },
      });
      return this.serializeScheme(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A scheme with this code already exists in the district.');
      }
      throw error;
    }
  }

  async update(auth: AuthContext, id: string, dto: UpdateSchemeDto) {
    this.authz.assertPermission(auth, 'project:update');
    const current = await this.prisma.scheme.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('Scheme not found.');
    }
    this.authz.assertDistrictAccess(auth, current.districtId);
    this.authz.assertDepartmentAccess(auth, { id: current.departmentId, districtId: current.districtId });
    const updated = await this.prisma.scheme.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        funding: dto.funding,
        domain: dto.domain,
        officerName: dto.officerName === undefined ? undefined : dto.officerName?.trim() ?? null,
        remarks: dto.remarks === undefined ? undefined : dto.remarks?.trim() ?? null,
        targetValue:
          dto.targetValue === undefined
            ? undefined
            : dto.targetValue === null
              ? null
              : new Prisma.Decimal(dto.targetValue),
        targetUnit: dto.targetUnit === undefined ? undefined : dto.targetUnit?.trim() ?? null,
        updatedById: auth.userId,
      },
      include: { kpis: { where: { isActive: true }, include: { progress: { orderBy: { periodYm: 'desc' }, take: 1 } } } },
    });
    return this.serializeScheme(updated);
  }

  async setReportingFrequency(auth: AuthContext, id: string, frequency: KpiFrequency) {
    assertCanSetReportingFrequency(this.authz, auth);
    const current = await this.prisma.scheme.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('Scheme not found.');
    }
    this.authz.assertDistrictAccess(auth, current.districtId);
    this.authz.assertDepartmentAccess(auth, { id: current.departmentId, districtId: current.districtId });
    const [, updated] = await this.prisma.$transaction([
      this.prisma.schemeKpi.updateMany({ where: { schemeId: id }, data: { frequency } }),
      this.prisma.scheme.update({
        where: { id },
        data: { reportingFrequency: frequency, updatedById: auth.userId },
        include: { kpis: { where: { isActive: true }, include: { progress: { orderBy: { periodYm: 'desc' }, take: 1 } } } },
      }),
    ]);
    return this.serializeScheme(updated);
  }

  async addKpi(auth: AuthContext, schemeId: string, dto: CreateKpiDto) {
    this.authz.assertPermission(auth, 'project:update');
    const scheme = await this.prisma.scheme.findUnique({ where: { id: schemeId } });
    if (!scheme) {
      throw new NotFoundException('Scheme not found.');
    }
    this.authz.assertDistrictAccess(auth, scheme.districtId);
    this.authz.assertDepartmentAccess(auth, { id: scheme.departmentId, districtId: scheme.districtId });
    const frequency = acceptedReportingFrequency(this.authz, auth, dto.frequency) ?? scheme.reportingFrequency;
    return this.prisma.schemeKpi.create({
      data: {
        schemeId,
        name: dto.name.trim(),
        unit: dto.unit.trim(),
        target: new Prisma.Decimal(dto.target),
        frequency,
        greenThreshold: dto.greenThreshold === undefined ? undefined : new Prisma.Decimal(dto.greenThreshold),
        amberThreshold: dto.amberThreshold === undefined ? undefined : new Prisma.Decimal(dto.amberThreshold),
      },
    });
  }

  async submitProgress(auth: AuthContext, kpiId: string, dto: SubmitKpiProgressDto) {
    this.authz.assertPermission(auth, 'progress:submit');
    const kpi = await this.prisma.schemeKpi.findUnique({ where: { id: kpiId }, include: { scheme: true } });
    if (!kpi) {
      throw new NotFoundException('KPI not found.');
    }
    this.authz.assertDistrictAccess(auth, kpi.scheme.districtId);
    this.authz.assertDepartmentAccess(auth, { id: kpi.scheme.departmentId, districtId: kpi.scheme.districtId });
    return this.prisma.schemeProgress.upsert({
      where: { kpiId_periodYm: { kpiId, periodYm: dto.periodYm } },
      update: {
        target: new Prisma.Decimal(dto.target),
        achievement: new Prisma.Decimal(dto.achievement),
        physicalPercent: new Prisma.Decimal(dto.physicalPercent),
        financialPercent: dto.financialPercent === undefined ? undefined : new Prisma.Decimal(dto.financialPercent),
        fundAllocated: dto.fundAllocated === undefined ? undefined : new Prisma.Decimal(dto.fundAllocated),
        fundReleased: dto.fundReleased === undefined ? undefined : new Prisma.Decimal(dto.fundReleased),
        expenditure: dto.expenditure === undefined ? undefined : new Prisma.Decimal(dto.expenditure),
      },
      create: {
        kpiId,
        periodYm: dto.periodYm,
        target: new Prisma.Decimal(dto.target),
        achievement: new Prisma.Decimal(dto.achievement),
        physicalPercent: new Prisma.Decimal(dto.physicalPercent),
        financialPercent: dto.financialPercent === undefined ? undefined : new Prisma.Decimal(dto.financialPercent),
        fundAllocated: dto.fundAllocated === undefined ? undefined : new Prisma.Decimal(dto.fundAllocated),
        fundReleased: dto.fundReleased === undefined ? undefined : new Prisma.Decimal(dto.fundReleased),
        expenditure: dto.expenditure === undefined ? undefined : new Prisma.Decimal(dto.expenditure),
        createdById: auth.userId,
      },
    });
  }

  private schemeWhere(
    auth: AuthContext,
    query: { districtId?: string; departmentId?: string; domain?: SchemeDomain },
  ): Prisma.SchemeWhereInput {
    if (query.districtId) {
      this.authz.assertDistrictAccess(auth, query.districtId);
    }
    const allowedDepartments = this.authz.visibleDepartmentIds(auth);
    if (query.departmentId && allowedDepartments && !allowedDepartments.includes(query.departmentId)) {
      throw new ForbiddenException('You are not allowed to access this department.');
    }
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
      ...(query.domain ? { domain: query.domain } : {}),
    };
  }

  private serializeScheme(scheme: {
    targetValue: { toString(): string } | null;
    kpis?: Array<{
      target: { toString(): string };
      greenThreshold: { toString(): string };
      amberThreshold: { toString(): string };
      progress?: Array<{
        target: { toString(): string };
        achievement: { toString(): string };
        physicalPercent: { toString(): string };
        financialPercent: { toString(): string } | null;
        fundAllocated: { toString(): string } | null;
        fundReleased: { toString(): string } | null;
        expenditure: { toString(): string } | null;
        periodYm: string;
      }>;
    }>;
    [key: string]: unknown;
  }) {
    const primary = scheme.kpis?.[0];
    const latest = primary?.progress?.[0];
    const target = latest ? asNumber(latest.target) : asNumber(scheme.targetValue);
    const achievement = latest ? asNumber(latest.achievement) : 0;
    const progress = target > 0 ? Math.round((achievement / target) * 1000) / 10 : asNumber(latest?.physicalPercent);
    return {
      ...scheme,
      targetValue: scheme.targetValue === null ? null : scheme.targetValue?.toString() ?? null,
      target,
      achievement,
      progress,
      status: ragStatus(progress, asNumber(primary?.greenThreshold) || 90, asNumber(primary?.amberThreshold) || 70),
      lastUpdated: latest?.periodYm ?? null,
    };
  }
}
