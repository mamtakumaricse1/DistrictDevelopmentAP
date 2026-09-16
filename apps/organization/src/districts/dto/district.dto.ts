import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDistrictDto {
  @ApiProperty({ example: 'CHANGLANG' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'AR' })
  @IsString()
  @MaxLength(16)
  stateCode!: string;

  @ApiProperty({ example: 'Arunachal Pradesh' })
  @IsString()
  @MaxLength(120)
  stateName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headquarters?: string;

  @ApiPropertyOptional({ example: 'changlang' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  keycloakRealm?: string;

  @ApiPropertyOptional({ example: 'http://localhost:8080/realms/changlang' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  keycloakIssuer?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}

export class UpdateDistrictDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(16)
  stateCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  stateName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headquarters?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  keycloakRealm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  keycloakIssuer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
