import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { ProgressStatus } from '../../generated/prisma';

export class CreateProgressDto {
  @ApiProperty({ example: '2026-09' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  periodYm!: string;

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
  financialAmount?: number;

  @ApiProperty({ enum: ProgressStatus })
  @IsEnum(ProgressStatus)
  status!: ProgressStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  remarks?: string;
}
