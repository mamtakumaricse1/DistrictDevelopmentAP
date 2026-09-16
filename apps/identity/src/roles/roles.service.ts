import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.role.findMany({
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
        permissions: {
          select: { permission: { select: { code: true, name: true, module: true } } },
        },
      },
    });
  }

  permissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
      select: { id: true, code: true, name: true, module: true },
    });
  }
}
