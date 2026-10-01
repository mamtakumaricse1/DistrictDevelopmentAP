import { Controller, Get, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { AuthzService } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';

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
export class OrganizationReportsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  @Get('departments.csv')
  @RequirePermissions('report:export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="departments.csv"')
  @ApiOperation({ summary: 'Department master sheet from dash.pdf' })
  async departments(@CurrentUser() auth: AuthContext) {
    this.authz.assertPermission(auth, 'report:export');
    const districtIds = this.authz.visibleDistrictIds(auth);
    const departmentIds = this.authz.visibleDepartmentIds(auth);
    const rows = await this.prisma.department.findMany({
      where: {
        isActive: true,
        ...(districtIds ? { districtId: { in: districtIds } } : {}),
        ...(departmentIds ? { id: { in: departmentIds } } : {}),
      },
      orderBy: { name: 'asc' },
    });
    return [
      'departmentId,departmentName,hodOfficer,contact',
      ...rows.map((row) => [row.code, row.name, row.hodName ?? '', row.hodContact ?? ''].map(csvCell).join(',')),
    ].join('\n');
  }

  @Get('locations.csv')
  @RequirePermissions('report:export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="locations.csv"')
  @ApiOperation({ summary: 'Location master sheet from dash.pdf' })
  async locations(@CurrentUser() auth: AuthContext) {
    this.authz.assertPermission(auth, 'report:export');
    const districtIds = this.authz.visibleDistrictIds(auth);
    const rows = await this.prisma.location.findMany({
      where: { isActive: true, ...(districtIds ? { districtId: { in: districtIds } } : {}) },
      include: { district: { select: { name: true } }, parent: { select: { name: true, type: true } } },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return [
      'district,block,circle,gramPanchayat,village,latitude,longitude',
      ...rows.map((row) => {
        const block = row.type === 'BLOCK' ? row.name : row.parent?.type === 'BLOCK' ? row.parent.name : '';
        const circle = row.type === 'CIRCLE' ? row.name : '';
        const village = row.type === 'VILLAGE' ? row.name : '';
        return [row.district.name, block, circle, '', village, row.latitude?.toString() ?? '', row.longitude?.toString() ?? '']
          .map(csvCell)
          .join(',');
      }),
    ].join('\n');
  }
}
