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
      orderBy: { code: 'asc' },
    });
    const header = ['code', 'name', 'districtId', 'departmentId', 'status', 'financialYear', 'sanctionedAmount'];
    const lines = [
      header.join(','),
      ...rows.map((row) =>
        [
          row.code,
          row.name,
          row.districtId,
          row.departmentId,
          row.status,
          row.financialYear,
          row.sanctionedAmount?.toString() ?? '',
        ]
          .map(csvCell)
          .join(','),
      ),
    ];
    return lines.join('\n');
  }
}
