import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CurrentUser, IsUuidLike, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';

class AgencyQueryDto {
  @IsOptional()
  @IsUuidLike()
  districtId?: string;
}

@ApiTags('agencies')
@ApiBearerAuth()
@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agencies: AgenciesService) {}

  @Get()
  @RequirePermissions('district:read')
  list(@CurrentUser() auth: AuthContext, @Query() query: AgencyQueryDto) {
    return this.agencies.list(auth, query.districtId);
  }

  @Post()
  @RequirePermissions('agency:manage')
  create(@CurrentUser() auth: AuthContext, @Body() body: CreateAgencyDto) {
    return this.agencies.create(auth, body);
  }

  @Get(':id')
  @RequirePermissions('district:read')
  getById(@CurrentUser() auth: AuthContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.agencies.getById(auth, id);
  }

  @Patch(':id')
  @RequirePermissions('agency:manage')
  update(
    @CurrentUser() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAgencyDto,
  ) {
    return this.agencies.update(auth, id, body);
  }
}
