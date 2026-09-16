import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthContext, UserDirectory, VerifiedAccessToken } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdentityUserDirectory implements UserDirectory {
  constructor(private readonly prisma: PrismaService) {}

  async map(token: VerifiedAccessToken, _rawAccessToken: string): Promise<AuthContext> {
    if (!token.email) {
      throw new UnauthorizedException('Token does not include an email claim.');
    }

    let user = await this.prisma.user.findUnique({
      where: {
        keycloakIssuer_keycloakSub: {
          keycloakIssuer: token.iss,
          keycloakSub: token.sub,
        },
      },
      include: this.includeGraph(),
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: {
          keycloakIssuer_email: {
            keycloakIssuer: token.iss,
            email: token.email.toLowerCase(),
          },
        },
        include: this.includeGraph(),
      });
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { keycloakSub: token.sub, lastLoginAt: new Date() },
          include: this.includeGraph(),
        });
      }
    }

    if (!user) {
      throw new ForbiddenException('This account has not been provisioned.');
    }
    if (!user.isActive) {
      throw new ForbiddenException('This account is disabled.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        displayName: token.name ?? user.displayName,
        email: token.email.toLowerCase(),
      },
    });

    const roles = user.roles.map((assignment) => ({
      code: assignment.role.code,
      districtId: assignment.districtId,
    }));
    const isSuperAdmin = roles.some((role) => role.code === 'SUPER_ADMIN');
    const districtIds = [
      ...new Set(roles.map((role) => role.districtId).filter((id): id is string => Boolean(id))),
    ];
    const departmentIds = user.departments.map((item) => item.departmentId);
    const agencyIds = user.agencies.map((item) => item.agencyId);
    const permissions = [
      ...new Set(user.roles.flatMap((assignment) => assignment.role.permissions.map((p) => p.permission.code))),
    ];

    return {
      userId: user.id,
      email: user.email,
      displayName: token.name ?? user.displayName,
      isSuperAdmin,
      isActive: user.isActive,
      issuer: token.iss,
      roles,
      districtIds,
      departmentIds,
      agencyIds,
      permissions,
    };
  }

  private includeGraph() {
    return {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
      departments: true,
      agencies: true,
    } as const;
  }
}
