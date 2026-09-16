import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { InternalKeyGuard, Public } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';

@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal/departments')
export class InternalDepartmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        districtId: true,
        isActive: true,
        district: { select: { id: true, code: true, name: true, isActive: true } },
      },
    });
    if (!department || !department.isActive || !department.district.isActive) {
      throw new NotFoundException('Department not found.');
    }
    return department;
  }
}
