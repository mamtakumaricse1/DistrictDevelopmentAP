import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { AuthzService, type AuthContext } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';

const HEADER =
  'Department,Scheme,KPI,Location,Target,Achievement,FinancialProgress,PhysicalProgress,Status,LastUpdated';

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  template(departmentCode = 'DEPARTMENT') {
    const samples: Record<string, string> = {
      PWD: 'PWD,PMGSY,Road length completed,Changlang,40,29,64,72,ATTENTION,2026-09',
      PHED: 'PHED,JJM,FHTC Provided,Changlang,5000,4600,72,92,ON_TRACK,2026-09',
      HEALTH: 'HLT,NHM,Institutional deliveries,Changlang,100,88,81,88,ATTENTION,2026-09',
      HLT: 'HLT,NHM,Institutional deliveries,Changlang,100,88,81,88,ATTENTION,2026-09',
      EDUCATION: 'EDU,SCHOOL-INFRA,Schools upgraded,Changlang,120,95,71,79,ATTENTION,2026-09',
      EDU: 'EDU,SCHOOL-INFRA,Schools upgraded,Changlang,120,95,71,79,ATTENTION,2026-09',
      RD: 'RD,PMAY,Houses completed,Jairampur,800,544,61,68,ATTENTION,2026-09',
    };
    return [HEADER, samples[departmentCode.toUpperCase()] ?? samples.PHED].join('\n');
  }

  async validate(auth: AuthContext, csv: string) {
    this.authz.assertPermission(auth, 'progress:submit');
    const parsed = this.parseRows(csv);
    const issues: string[] = [];
    for (const row of parsed) {
      const physical = Number(row.physical);
      if (!Number.isFinite(physical) || physical < 0 || physical > 100) {
        issues.push(`${row.scheme}/${row.kpi}: physical progress must be 0–100`);
      }
      if (Number(row.target) <= 0) {
        issues.push(`${row.scheme}/${row.kpi}: target must be greater than 0`);
      }
      if (Number(row.achievement) > Number(row.target) * 1.2) {
        issues.push(`${row.scheme}/${row.kpi}: achievement is more than 120% of target — review before publication`);
      }
    }
    return { rows: parsed.length, valid: issues.length === 0, issues };
  }

  async importProgress(auth: AuthContext, csv: string) {
    this.authz.assertPermission(auth, 'progress:submit');
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length < 2) {
      throw new BadRequestException('CSV must include a header and at least one data row.');
    }
    const header = lines[0].replace(/^\uFEFF/, '');
    if (header !== HEADER) {
      throw new BadRequestException(`CSV header must be: ${HEADER}`);
    }
    const districtIds = this.authz.visibleDistrictIds(auth);
    const departmentIds = this.authz.visibleDepartmentIds(auth);
    let imported = 0;
    for (const line of lines.slice(1)) {
      const cols = line.split(',').map((cell) => cell.trim());
      if (cols.length < 10) {
        continue;
      }
      const [departmentCode, schemeCode, kpiName, , target, achievement, financial, physical, , periodYm] = cols;
      const scheme = await this.prisma.scheme.findFirst({
        where: {
          code: schemeCode.toUpperCase(),
          isActive: true,
          ...(districtIds ? { districtId: { in: districtIds } } : {}),
          ...(departmentIds ? { departmentId: { in: departmentIds } } : {}),
        },
        include: { kpis: { where: { isActive: true } } },
      });
      if (!scheme) {
        continue;
      }
      this.authz.assertDistrictAccess(auth, scheme.districtId);
      this.authz.assertDepartmentAccess(auth, { id: scheme.departmentId, districtId: scheme.districtId });
      const kpi =
        scheme.kpis.find((item) => item.name.toLowerCase() === kpiName.toLowerCase()) ?? scheme.kpis[0];
      if (!kpi) {
        continue;
      }
      await this.prisma.schemeProgress.upsert({
        where: { kpiId_periodYm: { kpiId: kpi.id, periodYm } },
        update: {
          target: new Prisma.Decimal(Number(target) || 0),
          achievement: new Prisma.Decimal(Number(achievement) || 0),
          physicalPercent: new Prisma.Decimal(Number(physical) || 0),
          financialPercent: financial ? new Prisma.Decimal(Number(financial)) : undefined,
        },
        create: {
          kpiId: kpi.id,
          periodYm,
          target: new Prisma.Decimal(Number(target) || 0),
          achievement: new Prisma.Decimal(Number(achievement) || 0),
          physicalPercent: new Prisma.Decimal(Number(physical) || 0),
          financialPercent: financial ? new Prisma.Decimal(Number(financial)) : undefined,
          createdById: auth.userId,
        },
      });
      imported += 1;
      void departmentCode;
    }
    return { imported };
  }

  private parseRows(csv: string) {
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length < 2) {
      throw new BadRequestException('CSV must include a header and at least one data row.');
    }
    if (lines[0].replace(/^\uFEFF/, '') !== HEADER) {
      throw new BadRequestException(`CSV header must be: ${HEADER}`);
    }
    return lines.slice(1).flatMap((line) => {
      const cols = line.split(',').map((cell) => cell.trim());
      if (cols.length < 10) {
        return [];
      }
      const [department, scheme, kpi, location, target, achievement, financial, physical, status, periodYm] = cols;
      return [{ department, scheme, kpi, location, target, achievement, financial, physical, status, periodYm }];
    });
  }
}
