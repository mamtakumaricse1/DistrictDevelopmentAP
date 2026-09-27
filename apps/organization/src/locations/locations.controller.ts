import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CurrentUser, IsUuidLike, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { LocationType } from '../generated/prisma';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';
import { LocationsService } from './locations.service';

class LocationQueryDto {
  @IsOptional()
  @IsUuidLike()
  districtId?: string;

  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @IsOptional()
  @IsUuidLike()
  parentId?: string;
}

@ApiTags('locations')
@ApiBearerAuth()
@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get()
  @RequirePermissions('district:read')
  @ApiOperation({ summary: 'List blocks, circles, GPs, and villages in scope' })
  list(@CurrentUser() auth: AuthContext, @Query() query: LocationQueryDto) {
    return this.locations.list(auth, query);
  }

  @Post()
  @RequirePermissions('master:manage')
  create(@CurrentUser() auth: AuthContext, @Body() body: CreateLocationDto) {
    return this.locations.create(auth, body);
  }

  @Get(':id')
  @RequirePermissions('district:read')
  getById(@CurrentUser() auth: AuthContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.locations.getById(auth, id);
  }

  @Patch(':id')
  @RequirePermissions('master:manage')
  update(
    @CurrentUser() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLocationDto,
  ) {
    return this.locations.update(auth, id, body);
  }
}
