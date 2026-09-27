import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { AuthzService, CurrentUser, IsUuidLike, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';

class ReportQueryDto {
  @IsOptional()
  @IsUuidLike()
  districtId?: string;

  @IsOptional()
  @IsUuidLike()
  departmentId?: string;
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly access: ProjectAccessService,
  ) {}

  @Get('projects.csv')
  @RequirePermissions('report:export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="projects.csv"')
  @ApiOperation({ summary: 'CSV export of projects in the caller scope' })
  async projectsCsv(@CurrentUser() auth: AuthContext, @Query() query: ReportQueryDto) {
    this.authz.assertPermission(auth, 'report:export');
    if (query.districtId) {
      this.authz.assertDistrictAccess(auth, query.districtId);
    }
    this.access.assertDepartmentFilter(auth, query.departmentId);
    const districtIds = this.authz.visibleDistrictIds(auth);
    const departmentIds = this.authz.visibleDepartmentIds(auth);
    const rows = await this.prisma.project.findMany({
      where: {
        isActive: true,
        ...(query.districtId ? { districtId: query.districtId } : districtIds ? { districtId: { in: districtIds } } : {}),
        ...(query.departmentId
          ? { departmentId: query.departmentId }
          : departmentIds
            ? { departmentId: { in: departmentIds } }
            : {}),
      },
      include: { progress: { orderBy: { version: 'desc' }, take: 1 } },
      orderBy: { code: 'asc' },
    });
    const header = [
      'projectId',
      'projectName',
      'department',
      'location',
      'sanctionedAmount',
      'releasedAmount',
      'expenditure',
      'physicalProgress',
      'startDate',
      'completionDate',
      'status',
    ];
    const lines = [
      header.join(','),
      ...rows.map((row) =>
        [
          row.code,
          row.name,
          row.departmentId,
          row.locationText ?? '',
          row.sanctionedAmount?.toString() ?? '',
          row.releasedAmount?.toString() ?? '',
          row.progress[0]?.financialAmount?.toString() ?? '',
          row.progress[0]?.physicalPercent?.toString() ?? '',
          row.startDate ? row.startDate.toISOString().slice(0, 10) : '',
          row.expectedCompletion ? row.expectedCompletion.toISOString().slice(0, 10) : row.endDate ? row.endDate.toISOString().slice(0, 10) : '',
          row.progress[0]?.status ?? row.status,
        ]
          .map(csvCell)
          .join(','),
      ),
    ];
    return lines.join('\n');
  }

  @Get('schemes.csv')
  @RequirePermissions('report:export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="schemes.csv"')
  async schemesCsv(@CurrentUser() auth: AuthContext) {
    const rows = await this.prisma.scheme.findMany({ where: this.scope(auth), orderBy: { code: 'asc' } });
    const header = ['schemeId', 'departmentId', 'schemeName', 'schemeType', 'centralState'];
    return [
      header.join(','),
      ...rows.map((row) => [row.code, row.departmentId, row.name, row.domain, row.funding].map(csvCell).join(',')),
    ].join('\n');
  }

  @Get('kpis.csv')
  @RequirePermissions('report:export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="kpis.csv"')
  async kpisCsv(@CurrentUser() auth: AuthContext) {
    const rows = await this.prisma.schemeKpi.findMany({
      where: { scheme: this.scope(auth) },
      include: { scheme: { select: { code: true } } },
      orderBy: { name: 'asc' },
    });
    const header = ['kpiId', 'schemeId', 'kpiName', 'unit', 'target', 'frequency'];
    return [
      header.join(','),
      ...rows.map((row) => [row.id, row.scheme.code, row.name, row.unit, row.target.toString(), row.frequency].map(csvCell).join(',')),
    ].join('\n');
  }

  @Get('progress.csv')
  @RequirePermissions('report:export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="progress.csv"')
  async progressCsv(@CurrentUser() auth: AuthContext) {
    const rows = await this.prisma.schemeProgress.findMany({
      where: { kpi: { scheme: this.scope(auth) } },
      include: { kpi: { select: { id: true } } },
      orderBy: { periodYm: 'desc' },
    });
    const header = ['kpiId', 'year', 'month', 'target', 'achievement', 'physicalPercent', 'financialPercent'];
    return [
      header.join(','),
      ...rows.map((row) =>
        [
          row.kpiId,
          row.periodYm.slice(0, 4),
          row.periodYm.slice(5, 7),
          row.target.toString(),
          row.achievement.toString(),
          row.physicalPercent.toString(),
          row.financialPercent?.toString() ?? '',
        ]
          .map(csvCell)
          .join(','),
      ),
    ].join('\n');
  }

  @Get('beneficiaries.csv')
  @RequirePermissions('report:export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="beneficiaries.csv"')
  async beneficiariesCsv(@CurrentUser() auth: AuthContext) {
    const rows = await this.prisma.beneficiarySnapshot.findMany({
      where: { scheme: this.scope(auth) },
      include: { scheme: { select: { code: true } } },
    });
    const header = ['scheme', 'locationId', 'target', 'beneficiaries', 'male', 'female', 'others'];
    return [
      header.join(','),
      ...rows.map((row) =>
        [
          row.scheme.code,
          row.locationId ?? '',
          row.target.toString(),
          row.beneficiaries.toString(),
          row.male?.toString() ?? '',
          row.female?.toString() ?? '',
          row.others?.toString() ?? '',
        ]
          .map(csvCell)
          .join(','),
      ),
    ].join('\n');
  }

  private scope(auth: AuthContext) {
    const districtIds = this.authz.visibleDistrictIds(auth);
    const departmentIds = this.authz.visibleDepartmentIds(auth);
    return {
      isActive: true,
      ...(districtIds ? { districtId: { in: districtIds } } : {}),
      ...(departmentIds ? { departmentId: { in: departmentIds } } : {}),
    };
  }
}
