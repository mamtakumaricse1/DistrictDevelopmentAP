import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CurrentUser, IsUuidLike, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { ProjectStatus } from '../generated/prisma';
import { SetReportingFrequencyDto } from '../lib/reporting-frequency.dto';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectsService } from './projects.service';

class ProjectQueryDto {
  @IsOptional()
  @IsUuidLike()
  districtId?: string;

  @IsOptional()
  @IsUuidLike()
  departmentId?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @RequirePermissions('project:read')
  @ApiOperation({ summary: 'List projects in the caller scope' })
  list(@CurrentUser() auth: AuthContext, @Query() query: ProjectQueryDto) {
    return this.projects.list(auth, query);
  }

  @Post()
  @RequirePermissions('project:create')
  @ApiOperation({ summary: 'Create a project and assign a district-department-year code' })
  create(@CurrentUser() auth: AuthContext, @Body() body: CreateProjectDto) {
    return this.projects.create(auth, body);
  }

  @Get(':id')
  @RequirePermissions('project:read')
  @ApiOperation({ summary: 'Get one project if the caller is in scope' })
  getById(@CurrentUser() auth: AuthContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.projects.getById(auth, id);
  }

  @Patch(':id/frequency')
  @RequirePermissions('frequency:manage')
  @ApiOperation({ summary: 'Set how often this project is reported' })
  setFrequency(
    @CurrentUser() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SetReportingFrequencyDto,
  ) {
    return this.projects.setReportingFrequency(auth, id, body.frequency);
  }

  @Patch(':id')
  @RequirePermissions('project:update')
  @ApiOperation({ summary: 'Update a project (closing requires project:delete)' })
  update(
    @CurrentUser() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.projects.update(auth, id, body);
  }
}
