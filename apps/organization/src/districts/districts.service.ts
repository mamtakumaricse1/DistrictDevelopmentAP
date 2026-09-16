import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { AuthzService } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';
import { IdentityDirectoryClient } from '../auth/identity-directory.client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDistrictDto, UpdateDistrictDto } from './dto/district.dto';

@Injectable()
export class DistrictsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly identity: IdentityDirectoryClient,
  ) {}

  async list(auth: AuthContext, includeInactive = false) {
    const districtIds = this.authz.visibleDistrictIds(auth);
    return this.prisma.district.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(districtIds ? { id: { in: districtIds } } : {}),
      },
      orderBy: { name: 'asc' },
      select: this.select(),
    });
  }

  async getById(auth: AuthContext, id: string) {
    const district = await this.prisma.district.findUnique({
      where: { id },
      select: this.select(),
    });
    if (!district) {
      throw new NotFoundException('District not found.');
    }
    this.authz.assertDistrictAccess(auth, district.id);
    return district;
  }

  async create(auth: AuthContext, dto: CreateDistrictDto) {
    this.authz.assertPermission(auth, 'district:manage');
    try {
      const created = await this.prisma.district.create({
        data: {
          code: dto.code.trim().toUpperCase(),
          name: dto.name.trim(),
          stateCode: dto.stateCode.trim().toUpperCase(),
          stateName: dto.stateName.trim(),
          headquarters: dto.headquarters?.trim(),
          keycloakRealm: dto.keycloakRealm?.trim(),
          keycloakIssuer: dto.keycloakIssuer?.trim(),
          timezone: dto.timezone ?? 'Asia/Kolkata',
          createdById: auth.userId,
          updatedById: auth.userId,
        },
        select: this.select(),
      });
      await this.identity.syncIssuer({
        districtId: created.id,
        districtCode: created.code,
        realm: created.keycloakRealm,
        issuer: created.keycloakIssuer,
        isActive: created.isActive,
      });
      return created;
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async update(auth: AuthContext, id: string, dto: UpdateDistrictDto) {
    this.authz.assertPermission(auth, 'district:manage');
    await this.getById(auth, id);
    try {
      const updated = await this.prisma.district.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          stateCode: dto.stateCode?.trim().toUpperCase(),
          stateName: dto.stateName?.trim(),
          headquarters: dto.headquarters?.trim(),
          keycloakRealm: dto.keycloakRealm?.trim(),
          keycloakIssuer: dto.keycloakIssuer?.trim(),
          timezone: dto.timezone,
          isActive: dto.isActive,
          updatedById: auth.userId,
        },
        select: this.select(),
      });
      await this.identity.syncIssuer({
        districtId: updated.id,
        districtCode: updated.code,
        realm: updated.keycloakRealm,
        issuer: updated.keycloakIssuer,
        isActive: updated.isActive,
      });
      return updated;
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  private rethrowUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A district with this code or Keycloak realm already exists.');
    }
    throw error;
  }

  private select() {
    return {
      id: true,
      code: true,
      name: true,
      stateCode: true,
      stateName: true,
      headquarters: true,
      timezone: true,
      isActive: true,
      keycloakRealm: true,
      keycloakIssuer: true,
    };
  }
}
