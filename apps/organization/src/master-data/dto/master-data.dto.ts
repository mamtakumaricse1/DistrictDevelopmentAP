import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { IsUuidLike } from '@ddwmd/common';

export class CreateMasterCategoryDto {
  @ApiProperty({ example: 'DOCUMENT_CATEGORY' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;
}

export class CreateMasterItemDto {
  @ApiProperty()
  @IsUuidLike()
  categoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLike()
  districtId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateMasterItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
