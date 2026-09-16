import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsUuidLike } from '@ddwmd/common';
import { ActionStatus } from '../../generated/prisma';

export class CreateActionDto {
  @ApiProperty()
  @IsUuidLike()
  districtId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLike()
  meetingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLike()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLike()
  projectId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLike()
  assigneeUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ enum: ActionStatus })
  @IsOptional()
  @IsEnum(ActionStatus)
  status?: ActionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}
