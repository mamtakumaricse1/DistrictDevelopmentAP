import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CurrentUser, IsUuidLike, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { SchemeDomain } from '../generated/prisma';
import { SetReportingFrequencyDto } from '../lib/reporting-frequency.dto';
import { CreateKpiDto, CreateSchemeDto, SubmitKpiProgressDto, UpdateSchemeDto } from './dto/scheme.dto';
import { SchemesService } from './schemes.service';

class SchemeQueryDto {
  @IsOptional()
  @IsUuidLike()
  districtId?: string;

  @IsOptional()
  @IsUuidLike()
  departmentId?: string;

  @IsOptional()
  @IsEnum(SchemeDomain)
  domain?: SchemeDomain;
}

@ApiTags('schemes')
@ApiBearerAuth()
@Controller('schemes')
export class SchemesController {
  constructor(private readonly schemes: SchemesService) {}

  @Get()
  @RequirePermissions('project:read')
  @ApiOperation({ summary: 'List schemes in the caller scope' })
  list(@CurrentUser() auth: AuthContext, @Query() query: SchemeQueryDto) {
    return this.schemes.list(auth, query);
  }

  @Post()
  @RequirePermissions('project:create')
  create(@CurrentUser() auth: AuthContext, @Body() body: CreateSchemeDto) {
    return this.schemes.create(auth, body);
  }

  @Get(':id')
  @RequirePermissions('project:read')
  getById(@CurrentUser() auth: AuthContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.schemes.getById(auth, id);
  }

  @Patch(':id/frequency')
  @RequirePermissions('frequency:manage')
  @ApiOperation({ summary: 'Set how often this scheme and its KPIs are reported' })
  setFrequency(
    @CurrentUser() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SetReportingFrequencyDto,
  ) {
    return this.schemes.setReportingFrequency(auth, id, body.frequency);
  }

  @Patch(':id')
  @RequirePermissions('project:update')
  update(
    @CurrentUser() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSchemeDto,
  ) {
    return this.schemes.update(auth, id, body);
  }

  @Post(':id/kpis')
  @RequirePermissions('project:update')
  addKpi(
    @CurrentUser() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateKpiDto,
  ) {
    return this.schemes.addKpi(auth, id, body);
  }

  @Post('kpis/:kpiId/progress')
  @RequirePermissions('progress:submit')
  submitProgress(
    @CurrentUser() auth: AuthContext,
    @Param('kpiId', ParseUUIDPipe) kpiId: string,
    @Body() body: SubmitKpiProgressDto,
  ) {
    return this.schemes.submitProgress(auth, kpiId, body);
  }
}
