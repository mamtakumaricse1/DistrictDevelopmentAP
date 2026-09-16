import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async list(auth: AuthContext, districtId?: string, includeInactive = false) {
    if (districtId) {
      this.authz.assertDistrictAccess(auth, districtId);
    }
    const districtIds = this.authz.visibleDistrictIds(auth);
    const departmentIds = this.authz.visibleDepartmentIds(auth);
    return this.prisma.department.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(districtId ? { districtId } : {}),
        ...(districtIds ? { districtId: { in: districtIds } } : {}),
        ...(departmentIds ? { id: { in: departmentIds } } : {}),
      },
      orderBy: { name: 'asc' },
      select: this.select(),
    });
  }

  async getById(auth: AuthContext, id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      select: this.select(),
    });
    if (!department) {
      throw new NotFoundException('Department not found.');
    }
    this.authz.assertDepartmentAccess(auth, department);
    return department;
  }

  async create(auth: AuthContext, dto: CreateDepartmentDto) {
    this.authz.assertPermission(auth, 'department:manage');
    this.authz.assertDistrictAccess(auth, dto.districtId);
    try {
      return await this.prisma.department.create({
        data: {
          districtId: dto.districtId,
          code: dto.code.trim().toUpperCase(),
          name: dto.name.trim(),
          shortName: dto.shortName?.trim(),
          createdById: auth.userId,
          updatedById: auth.userId,
        },
        select: this.select(),
      });
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async update(auth: AuthContext, id: string, dto: UpdateDepartmentDto) {
    this.authz.assertPermission(auth, 'department:manage');
    const current = await this.getById(auth, id);
    this.authz.assertDistrictAccess(auth, current.districtId);
    try {
      return await this.prisma.department.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          shortName: dto.shortName?.trim(),
          isActive: dto.isActive,
          updatedById: auth.userId,
        },
        select: this.select(),
      });
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  private rethrowUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A department with this code already exists in the district.');
    }
    throw error;
  }

  private select() {
    return {
      id: true,
      districtId: true,
      code: true,
      name: true,
      shortName: true,
      isActive: true,
    };
  }
}
