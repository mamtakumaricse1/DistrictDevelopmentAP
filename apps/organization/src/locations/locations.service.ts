import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { LocationType } from '../generated/prisma';
import { AuthzService, type AuthContext } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async list(auth: AuthContext, query: { districtId?: string; type?: LocationType; parentId?: string }) {
    if (query.districtId) {
      this.authz.assertDistrictAccess(auth, query.districtId);
    }
    const districtIds = this.authz.visibleDistrictIds(auth);
    return this.prisma.location.findMany({
      where: {
        isActive: true,
        ...(query.districtId ? { districtId: query.districtId } : districtIds ? { districtId: { in: districtIds } } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(query.parentId ? { parentId: query.parentId } : {}),
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      select: this.select(),
    });
  }

  async getById(auth: AuthContext, id: string) {
    const location = await this.prisma.location.findUnique({ where: { id }, select: this.select() });
    if (!location) {
      throw new NotFoundException('Location not found.');
    }
    this.authz.assertDistrictAccess(auth, location.districtId);
    return location;
  }

  async create(auth: AuthContext, dto: CreateLocationDto) {
    this.authz.assertPermission(auth, 'master:manage');
    this.authz.assertDistrictAccess(auth, dto.districtId);
    if (dto.parentId) {
      const parent = await this.prisma.location.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.districtId !== dto.districtId) {
        throw new NotFoundException('Parent location was not found in this district.');
      }
    }
    try {
      return await this.prisma.location.create({
        data: {
          districtId: dto.districtId,
          parentId: dto.parentId,
          type: dto.type,
          code: dto.code.trim().toUpperCase(),
          name: dto.name.trim(),
          population: dto.population,
          latitude: dto.latitude === undefined ? undefined : new Prisma.Decimal(dto.latitude),
          longitude: dto.longitude === undefined ? undefined : new Prisma.Decimal(dto.longitude),
        },
        select: this.select(),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A location with this code already exists in the district.');
      }
      throw error;
    }
  }

  async update(auth: AuthContext, id: string, dto: UpdateLocationDto) {
    this.authz.assertPermission(auth, 'master:manage');
    await this.getById(auth, id);
    return this.prisma.location.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        population: dto.population === undefined ? undefined : dto.population,
        latitude:
          dto.latitude === undefined
            ? undefined
            : dto.latitude === null
              ? null
              : new Prisma.Decimal(dto.latitude),
        longitude:
          dto.longitude === undefined
            ? undefined
            : dto.longitude === null
              ? null
              : new Prisma.Decimal(dto.longitude),
        isActive: dto.isActive,
      },
      select: this.select(),
    });
  }

  private select() {
    return {
      id: true,
      districtId: true,
      parentId: true,
      type: true,
      code: true,
      name: true,
      population: true,
      latitude: true,
      longitude: true,
      isActive: true,
    };
  }
}
