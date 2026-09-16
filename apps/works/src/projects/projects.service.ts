import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectStatus } from '../generated/prisma';
import { AuthzService, paginated, type AuthContext } from '@ddwmd/common';
import { OrganizationCatalogClient } from '../auth/organization-catalog.client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly catalog: OrganizationCatalogClient,
  ) {}

  async list(
    auth: AuthContext,
    query: {
      districtId?: string;
      departmentId?: string;
      status?: ProjectStatus;
      search?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    this.authz.assertPermission(auth, 'project:read');
    if (query.districtId) {
      this.authz.assertDistrictAccess(auth, query.districtId);
    }
    const allowedDepartments = this.authz.visibleDepartmentIds(auth);
    if (query.departmentId && allowedDepartments && !allowedDepartments.includes(query.departmentId)) {
      throw new ForbiddenException('You are not allowed to access this department.');
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? Math.min(query.pageSize, 100) : 20;
    const districtIds = this.authz.visibleDistrictIds(auth);
    const departmentIds = this.authz.visibleDepartmentIds(auth);
    const where: Prisma.ProjectWhereInput = {
      isActive: true,
      ...(query.districtId
        ? { districtId: query.districtId }
        : districtIds
          ? { districtId: { in: districtIds } }
          : {}),
      ...(query.departmentId
        ? { departmentId: query.departmentId }
        : departmentIds
          ? { departmentId: { in: departmentIds } }
          : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search.toUpperCase(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        orderBy: { code: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: this.select(),
      }),
    ]);
    return paginated(
      data.map((row) => this.serialize(row)),
      page,
      pageSize,
      total,
    );
  }

  async getById(auth: AuthContext, id: string) {
    this.authz.assertPermission(auth, 'project:read');
    const project = await this.prisma.project.findUnique({ where: { id }, select: this.select() });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    this.authz.assertDistrictAccess(auth, project.districtId);
    this.authz.assertDepartmentAccess(auth, { id: project.departmentId, districtId: project.districtId });
    return this.serialize(project);
  }

  async create(auth: AuthContext, dto: CreateProjectDto) {
    this.authz.assertPermission(auth, 'project:create');
    const department = await this.catalog.getDepartment(dto.departmentId);
    this.authz.assertDistrictAccess(auth, department.districtId);
    this.authz.assertDepartmentAccess(auth, { id: department.id, districtId: department.districtId });
    const year = dto.financialYear ?? new Date().getFullYear();
    const created = await this.prisma.$transaction(async (tx) => {
      const seq = await tx.projectSequence.upsert({
        where: {
          districtId_departmentId_year: {
            districtId: department.districtId,
            departmentId: department.id,
            year,
          },
        },
        update: { lastValue: { increment: 1 } },
        create: {
          districtId: department.districtId,
          departmentId: department.id,
          year,
          lastValue: 1,
        },
      });
      const code = `${department.district.code}-${department.code}-${year}-${String(seq.lastValue).padStart(5, '0')}`;
      return tx.project.create({
        data: {
          code,
          name: dto.name.trim(),
          description: dto.description?.trim(),
          districtId: department.districtId,
          departmentId: department.id,
          implementingAgencyId: dto.implementingAgencyId,
          executingAgencyId: dto.executingAgencyId,
          financialYear: year,
          sanctionedAmount:
            dto.sanctionedAmount === undefined ? undefined : new Prisma.Decimal(dto.sanctionedAmount),
          locationText: dto.locationText?.trim(),
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          createdById: auth.userId,
          updatedById: auth.userId,
        },
        select: this.select(),
      });
    });
    return this.serialize(created);
  }

  async update(auth: AuthContext, id: string, dto: UpdateProjectDto) {
    this.authz.assertPermission(auth, 'project:update');
    const current = await this.prisma.project.findUnique({ where: { id }, select: this.select() });
    if (!current) {
      throw new NotFoundException('Project not found.');
    }
    this.authz.assertDistrictAccess(auth, current.districtId);
    this.authz.assertDepartmentAccess(auth, { id: current.departmentId, districtId: current.districtId });
    if (dto.status === ProjectStatus.CLOSED) {
      this.authz.assertPermission(auth, 'project:delete');
    }
    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description === undefined ? undefined : dto.description?.trim() ?? null,
        implementingAgencyId: dto.implementingAgencyId === undefined ? undefined : dto.implementingAgencyId,
        executingAgencyId: dto.executingAgencyId === undefined ? undefined : dto.executingAgencyId,
        sanctionedAmount:
          dto.sanctionedAmount === undefined
            ? undefined
            : dto.sanctionedAmount === null
              ? null
              : new Prisma.Decimal(dto.sanctionedAmount),
        status: dto.status,
        locationText: dto.locationText === undefined ? undefined : dto.locationText?.trim() ?? null,
        startDate: dto.startDate === undefined ? undefined : dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate === undefined ? undefined : dto.endDate ? new Date(dto.endDate) : null,
        updatedById: auth.userId,
      },
      select: this.select(),
    });
    return this.serialize(updated);
  }

  private serialize<T extends {
    sanctionedAmount: { toString(): string } | null;
    startDate: Date | null;
    endDate: Date | null;
  }>(row: T) {
    return {
      ...row,
      sanctionedAmount: row.sanctionedAmount === null ? null : row.sanctionedAmount.toString(),
      startDate: row.startDate ? row.startDate.toISOString().slice(0, 10) : null,
      endDate: row.endDate ? row.endDate.toISOString().slice(0, 10) : null,
    };
  }

  private select() {
    return {
      id: true,
      code: true,
      name: true,
      description: true,
      districtId: true,
      departmentId: true,
      implementingAgencyId: true,
      executingAgencyId: true,
      financialYear: true,
      sanctionedAmount: true,
      status: true,
      startDate: true,
      endDate: true,
      locationText: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }
}
