import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsUuidLike } from '@ddwmd/common';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  displayName!: string;

  @ApiProperty({ description: 'Keycloak issuer URL for this identity' })
  @IsString()
  @MaxLength(300)
  keycloakIssuer!: string;

  @ApiProperty({ example: 'DISTRICT_ADMIN' })
  @IsString()
  roleCode!: string;

  @ApiPropertyOptional({ description: 'Required except for SUPER_ADMIN' })
  @IsOptional()
  @IsUuidLike()
  districtId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUuidLike({ each: true })
  departmentIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidLike()
  districtId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUuidLike({ each: true })
  departmentIds?: string[];
}
