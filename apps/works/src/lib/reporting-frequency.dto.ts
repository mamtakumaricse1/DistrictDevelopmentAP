import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { KpiFrequency } from '../generated/prisma';

export class SetReportingFrequencyDto {
  @ApiProperty({ enum: KpiFrequency, example: KpiFrequency.MONTHLY })
  @IsEnum(KpiFrequency)
  frequency!: KpiFrequency;
}
