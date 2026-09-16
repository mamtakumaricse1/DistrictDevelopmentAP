import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { InternalKeyGuard, IsUuidLike, Public } from '@ddwmd/common';
import { PrismaService } from '../prisma/prisma.service';

class UpsertIssuerDto {
  @IsUuidLike()
  districtId!: string;

  @IsString()
  @MaxLength(32)
  districtCode!: string;

  @IsString()
  @MaxLength(64)
  realm!: string;

  @IsString()
  @MaxLength(300)
  issuer!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal/issuers')
export class InternalIssuersController {
  constructor(private readonly prisma: PrismaService) {}

  @Put()
  async upsert(@Body() body: UpsertIssuerDto) {
    const issuer = body.issuer.replace(/\/+$/, '');
    const existing = await this.prisma.registeredIssuer.findFirst({
      where: { OR: [{ issuer }, { districtId: body.districtId }] },
    });
    if (existing) {
      return this.prisma.registeredIssuer.update({
        where: { id: existing.id },
        data: {
          issuer,
          realm: body.realm,
          districtId: body.districtId,
          districtCode: body.districtCode.trim().toUpperCase(),
          isActive: body.isActive ?? true,
        },
      });
    }
    return this.prisma.registeredIssuer.create({
      data: {
        issuer,
        realm: body.realm,
        districtId: body.districtId,
        districtCode: body.districtCode.trim().toUpperCase(),
        isActive: body.isActive ?? true,
      },
    });
  }
}
