import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { IsUuidLike } from '@ddwmd/common';
import { KpiFrequency, SchemeDomain, SchemeFunding } from '../../generated/prisma';

export class CreateSchemeDto {
  @ApiProperty()
  @IsUuidLike()
  departmentId!: string;

  @ApiProperty({ example: 'JJM' })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  name!: string;

  @ApiPropertyOptional({ enum: SchemeFunding })
  @IsOptional()
  @IsEnum(SchemeFunding)
  funding?: SchemeFunding;

  @ApiPropertyOptional({ enum: SchemeDomain })
  @IsOptional()
  @IsEnum(SchemeDomain)
  domain?: SchemeDomain;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  officerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  targetUnit?: string;

  @ApiPropertyOptional({ enum: KpiFrequency, description: 'Only the DC or an administrator may set this.' })
  @IsOptional()
  @IsEnum(KpiFrequency)
  reportingFrequency?: KpiFrequency;
}

export class UpdateSchemeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  name?: string;

  @ApiPropertyOptional({ enum: SchemeFunding })
  @IsOptional()
  @IsEnum(SchemeFunding)
  funding?: SchemeFunding;

  @ApiPropertyOptional({ enum: SchemeDomain })
  @IsOptional()
  @IsEnum(SchemeDomain)
  domain?: SchemeDomain;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  officerName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetValue?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  targetUnit?: string | null;
}

export class CreateKpiDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(40)
  unit!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  target!: number;

  @ApiPropertyOptional({ enum: KpiFrequency })
  @IsOptional()
  @IsEnum(KpiFrequency)
  frequency?: KpiFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  greenThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  amberThreshold?: number;
}

export class SubmitKpiProgressDto {
  @ApiProperty({ example: '2026-09' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  periodYm!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  target!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  achievement!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  physicalPercent!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  financialPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fundAllocated?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fundReleased?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  expenditure?: number;
}
