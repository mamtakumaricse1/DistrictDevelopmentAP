import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async list(auth: AuthContext, districtId?: string) {
    if (districtId) {
      this.authz.assertDistrictAccess(auth, districtId);
    }
    const districtIds = this.authz.visibleDistrictIds(auth);
    const scopedDistrict = districtId
      ? { roles: { some: { districtId } } }
      : districtIds
        ? { roles: { some: { districtId: { in: districtIds } } } }
        : {};
    return this.prisma.user.findMany({
      where: scopedDistrict,
      orderBy: { displayName: 'asc' },
      select: this.select(),
    });
  }

  async getById(auth: AuthContext, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.select(),
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    this.assertCanManage(auth, user.roles);
    return user;
  }

  async create(auth: AuthContext, dto: CreateUserDto) {
    this.authz.assertPermission(auth, 'user:manage');
    if (dto.roleCode === 'SUPER_ADMIN' && !auth.isSuperAdmin) {
      throw new BadRequestException('Only a system administrator can create SUPER_ADMIN users.');
    }
    if (dto.roleCode !== 'SUPER_ADMIN') {
      if (!dto.districtId) {
        throw new BadRequestException('districtId is required for this role.');
      }
      this.authz.assertDistrictAccess(auth, dto.districtId);
    }

    const role = await this.prisma.role.findUnique({ where: { code: dto.roleCode } });
    if (!role) {
      throw new BadRequestException('Unknown role.');
    }

    const email = dto.email.trim().toLowerCase();
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            displayName: dto.displayName.trim(),
            phone: dto.phone,
            keycloakIssuer: dto.keycloakIssuer.trim(),
            keycloakSub: `pending:${dto.keycloakIssuer.trim()}:${email}`,
          },
        });
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
            districtId: dto.roleCode === 'SUPER_ADMIN' ? null : dto.districtId,
            createdById: auth.userId,
          },
        });
        if (dto.departmentIds?.length) {
          await tx.userDepartment.createMany({
            data: dto.departmentIds.map((departmentId) => ({ userId: user.id, departmentId })),
          });
        }
        return tx.user.findUniqueOrThrow({ where: { id: user.id }, select: this.select() });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A user with this email already exists for that Keycloak realm.');
      }
      throw error;
    }
  }

  async update(auth: AuthContext, id: string, dto: UpdateUserDto) {
    this.authz.assertPermission(auth, 'user:manage');
    const current = await this.getById(auth, id);

    if (dto.roleCode === 'SUPER_ADMIN' && !auth.isSuperAdmin) {
      throw new BadRequestException('Only a system administrator can assign SUPER_ADMIN.');
    }
    if (dto.districtId) {
      this.authz.assertDistrictAccess(auth, dto.districtId);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          displayName: dto.displayName?.trim(),
          phone: dto.phone,
          isActive: dto.isActive,
        },
      });

      if (dto.roleCode) {
        const role = await tx.role.findUnique({ where: { code: dto.roleCode } });
        if (!role) {
          throw new BadRequestException('Unknown role.');
        }
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.create({
          data: {
            userId: id,
            roleId: role.id,
            districtId: dto.roleCode === 'SUPER_ADMIN' ? null : (dto.districtId ?? current.roles[0]?.districtId),
            createdById: auth.userId,
          },
        });
      }

      if (dto.departmentIds) {
        await tx.userDepartment.deleteMany({ where: { userId: id } });
        if (dto.departmentIds.length) {
          await tx.userDepartment.createMany({
            data: dto.departmentIds.map((departmentId) => ({ userId: id, departmentId })),
          });
        }
      }

      return tx.user.findUniqueOrThrow({ where: { id }, select: this.select() });
    });
  }

  private assertCanManage(
    auth: AuthContext,
    roles: Array<{ districtId: string | null; role: { code: string } }>,
  ): void {
    if (auth.isSuperAdmin) {
      return;
    }
    const districtIds = roles.map((item) => item.districtId).filter((id): id is string => Boolean(id));
    if (!districtIds.some((id) => auth.districtIds.includes(id))) {
      throw new NotFoundException('User not found.');
    }
  }

  private select() {
    return {
      id: true,
      email: true,
      displayName: true,
      phone: true,
      isActive: true,
      keycloakIssuer: true,
      lastLoginAt: true,
      roles: {
        select: {
          districtId: true,
          role: { select: { code: true, name: true } },
        },
      },
      departments: {
        select: { departmentId: true, department: { select: { code: true, name: true } } },
      },
    };
  }
}
