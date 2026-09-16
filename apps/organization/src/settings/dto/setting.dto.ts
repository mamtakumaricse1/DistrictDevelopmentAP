import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SettingValueType } from '../../generated/prisma';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsUuidLike } from '@ddwmd/common';

export class UpsertSettingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLike()
  districtId?: string;

  @ApiProperty({ example: 'project.code_pattern' })
  @IsString()
  @MaxLength(100)
  key!: string;

  @ApiProperty()
  @IsString()
  value!: string;

  @ApiProperty({ enum: SettingValueType })
  @IsEnum(SettingValueType)
  valueType!: SettingValueType;
}
