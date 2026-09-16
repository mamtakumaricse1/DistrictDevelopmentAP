import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgencyType } from '../../generated/prisma';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsUuidLike } from '@ddwmd/common';

export class CreateAgencyDto {
  @ApiProperty()
  @IsUuidLike()
  districtId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLike()
  departmentId?: string;

  @ApiProperty({ example: 'NBCC' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: AgencyType })
  @IsEnum(AgencyType)
  agencyType!: AgencyType;
}

export class UpdateAgencyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLike()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: AgencyType })
  @IsOptional()
  @IsEnum(AgencyType)
  agencyType?: AgencyType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
