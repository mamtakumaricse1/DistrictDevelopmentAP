import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';

@Injectable()
export class AgenciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async list(auth: AuthContext, districtId?: string) {
    if (districtId) {
      this.authz.assertDistrictAccess(auth, districtId);
    }
    const districtIds = this.authz.visibleDistrictIds(auth);
    return this.prisma.agency.findMany({
      where: {
        isActive: true,
        ...(districtId ? { districtId } : {}),
        ...(districtIds ? { districtId: { in: districtIds } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async getById(auth: AuthContext, id: string) {
    const agency = await this.prisma.agency.findUnique({ where: { id } });
    if (!agency) {
      throw new NotFoundException('Agency not found.');
    }
    this.authz.assertDistrictAccess(auth, agency.districtId);
    return agency;
  }

  async create(auth: AuthContext, dto: CreateAgencyDto) {
    this.authz.assertPermission(auth, 'agency:manage');
    this.authz.assertDistrictAccess(auth, dto.districtId);
    try {
      return await this.prisma.agency.create({
        data: {
          districtId: dto.districtId,
          departmentId: dto.departmentId,
          code: dto.code.trim().toUpperCase(),
          name: dto.name.trim(),
          agencyType: dto.agencyType,
          createdById: auth.userId,
          updatedById: auth.userId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An agency with this code already exists in the district.');
      }
      throw error;
    }
  }

  async update(auth: AuthContext, id: string, dto: UpdateAgencyDto) {
    this.authz.assertPermission(auth, 'agency:manage');
    await this.getById(auth, id);
    return this.prisma.agency.update({
      where: { id },
      data: {
        departmentId: dto.departmentId,
        name: dto.name?.trim(),
        agencyType: dto.agencyType,
        isActive: dto.isActive,
        updatedById: auth.userId,
      },
    });
  }
}
