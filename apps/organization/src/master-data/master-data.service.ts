import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';
import { CreateMasterCategoryDto, CreateMasterItemDto, UpdateMasterItemDto } from './dto/master-data.dto';

@Injectable()
export class MasterDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  categories() {
    return this.prisma.masterDataCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async createCategory(dto: CreateMasterCategoryDto) {
    try {
      return await this.prisma.masterDataCategory.create({
        data: { code: dto.code.trim().toUpperCase(), name: dto.name.trim() },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A master-data category with this code already exists.');
      }
      throw error;
    }
  }

  async items(auth: AuthContext, categoryId?: string, districtId?: string) {
    if (districtId) {
      this.authz.assertDistrictAccess(auth, districtId);
    }
    const districtIds = this.authz.visibleDistrictIds(auth);
    const districtScope =
      districtId != null
        ? [{ districtId: null }, { districtId }]
        : districtIds == null
          ? undefined
          : [{ districtId: null }, { districtId: { in: districtIds } }];
    return this.prisma.masterDataItem.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(districtScope ? { OR: districtScope } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { category: { select: { code: true, name: true } } },
    });
  }

  async createItem(auth: AuthContext, dto: CreateMasterItemDto) {
    if (dto.districtId) {
      this.authz.assertDistrictAccess(auth, dto.districtId);
    }
    try {
      return await this.prisma.masterDataItem.create({
        data: {
          categoryId: dto.categoryId,
          districtId: dto.districtId,
          code: dto.code.trim().toUpperCase(),
          name: dto.name.trim(),
          sortOrder: dto.sortOrder ?? 0,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This master-data item already exists.');
      }
      throw error;
    }
  }

  async updateItem(auth: AuthContext, id: string, dto: UpdateMasterItemDto) {
    const item = await this.prisma.masterDataItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Master-data item not found.');
    }
    if (item.districtId) {
      this.authz.assertDistrictAccess(auth, item.districtId);
    } else if (!auth.isSuperAdmin) {
      throw new NotFoundException('Master-data item not found.');
    }
    return this.prisma.masterDataItem.update({
      where: { id },
      data: { name: dto.name?.trim(), sortOrder: dto.sortOrder, isActive: dto.isActive },
    });
  }
}
