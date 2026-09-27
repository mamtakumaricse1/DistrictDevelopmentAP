import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsUuidLike } from '@ddwmd/common';
import { ActionSeverity, ActionStatus } from '../../generated/prisma';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  dcDirection?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  officerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string;

  @ApiPropertyOptional({ enum: ActionSeverity })
  @IsOptional()
  @IsEnum(ActionSeverity)
  severity?: ActionSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextReviewAt?: string;
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dcDirection?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  officerName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string | null;

  @ApiPropertyOptional({ enum: ActionSeverity })
  @IsOptional()
  @IsEnum(ActionSeverity)
  severity?: ActionSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextReviewAt?: string | null;
}
