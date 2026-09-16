import { Controller, Get, UseGuards } from '@nestjs/common';
import { InternalKeyGuard, Public } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';

@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal/district-realms')
export class InternalDistrictRealmsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.district.findMany({
      where: { isActive: true, keycloakIssuer: { not: null }, keycloakRealm: { not: null } },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, keycloakIssuer: true, keycloakRealm: true },
    });
  }
}
