import { Controller, Get, Query } from '@nestjs/common';
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
}
