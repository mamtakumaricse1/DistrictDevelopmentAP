import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CurrentUser } from '@ddwmd/common';
import { RequirePermissions } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';
import { CreateDistrictDto, UpdateDistrictDto } from './dto/district.dto';
import { DistrictsService } from './districts.service';

class DistrictQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeInactive?: boolean;
}

@ApiTags('districts')
@ApiBearerAuth()
@Controller('districts')
export class DistrictsController {
  constructor(private readonly districts: DistrictsService) {}

  @Get()
  @RequirePermissions('district:read')
  @ApiOperation({ summary: 'List districts the caller is allowed to see' })
  list(@CurrentUser() auth: AuthContext, @Query() query: DistrictQueryDto) {
    return this.districts.list(auth, query.includeInactive);
  }

  @Post()
  @RequirePermissions('district:manage')
  @ApiOperation({ summary: 'Create a district (SUPER_ADMIN)' })
  create(@CurrentUser() auth: AuthContext, @Body() body: CreateDistrictDto) {
    return this.districts.create(auth, body);
  }

  @Get(':id')
  @RequirePermissions('district:read')
  @ApiOperation({ summary: 'Get one district if the caller is in scope' })
  getById(@CurrentUser() auth: AuthContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.districts.getById(auth, id);
  }

  @Patch(':id')
  @RequirePermissions('district:manage')
  @ApiOperation({ summary: 'Update a district' })
  update(
    @CurrentUser() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateDistrictDto,
  ) {
    return this.districts.update(auth, id, body);
  }
}
