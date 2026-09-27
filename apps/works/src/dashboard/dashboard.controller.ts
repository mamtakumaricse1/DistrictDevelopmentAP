import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CurrentUser, IsUuidLike, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { DashboardService } from './dashboard.service';

class DashboardQueryDto {
  @IsOptional()
  @IsUuidLike()
  districtId?: string;

  @IsOptional()
  @IsUuidLike()
  departmentId?: string;
}

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  @RequirePermissions('dashboard:read')
  @ApiOperation({ summary: 'Aggregated project and progress KPIs in the caller scope' })
  summary(@CurrentUser() auth: AuthContext, @Query() query: DashboardQueryDto) {
    return this.dashboard.summary(auth, query);
  }

  @Get('delayed')
  @RequirePermissions('dashboard:read')
  @ApiOperation({ summary: 'Projects whose latest progress version is delayed or stalled' })
  delayed(@CurrentUser() auth: AuthContext, @Query() query: DashboardQueryDto) {
    return this.dashboard.delayed(auth, query);
  }

  @Get('overview')
  @RequirePermissions('dashboard:read')
  @ApiOperation({ summary: 'DC home aggregates: KPIs, departments, and schemes' })
  overview(@CurrentUser() auth: AuthContext, @Query() query: DashboardQueryDto) {
    return this.dashboard.overview(auth, query);
  }

  @Get('departments/:departmentId')
  @RequirePermissions('dashboard:read')
  department(
    @CurrentUser() auth: AuthContext,
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
  ) {
    return this.dashboard.department(auth, departmentId);
  }

  @Get('blocks/:locationId')
  @RequirePermissions('dashboard:read')
  block(@CurrentUser() auth: AuthContext, @Param('locationId', ParseUUIDPipe) locationId: string) {
    return this.dashboard.block(auth, locationId);
  }

  @Get('infrastructure')
  @RequirePermissions('dashboard:read')
  infrastructure(@CurrentUser() auth: AuthContext, @Query() query: DashboardQueryDto) {
    return this.dashboard.infrastructure(auth, query);
  }

  @Get('human-development')
  @RequirePermissions('dashboard:read')
  humanDevelopment(@CurrentUser() auth: AuthContext, @Query() query: DashboardQueryDto) {
    return this.dashboard.humanDevelopment(auth, query);
  }

  @Get('map-points')
  @RequirePermissions('dashboard:read')
  @ApiOperation({ summary: 'GIS counts per block/village for the Changlang map popup' })
  mapPoints(@CurrentUser() auth: AuthContext, @Query() query: DashboardQueryDto) {
    return this.dashboard.mapPoints(auth, query);
  }
}
