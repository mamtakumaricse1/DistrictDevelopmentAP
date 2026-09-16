import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CurrentUser, IsUuidLike, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { DepartmentsService } from './departments.service';

class DepartmentQueryDto {
  @IsOptional()
  @IsUuidLike()
  districtId?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeInactive?: boolean;
}

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get()
  @RequirePermissions('district:read')
  @ApiOperation({ summary: 'List departments in the caller scope' })
  list(@CurrentUser() auth: AuthContext, @Query() query: DepartmentQueryDto) {
    return this.departments.list(auth, query.districtId, query.includeInactive);
  }

  @Post()
  @RequirePermissions('department:manage')
  create(@CurrentUser() auth: AuthContext, @Body() body: CreateDepartmentDto) {
    return this.departments.create(auth, body);
  }

  @Get(':id')
  @RequirePermissions('district:read')
  getById(@CurrentUser() auth: AuthContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.departments.getById(auth, id);
  }

  @Patch(':id')
  @RequirePermissions('department:manage')
  update(
    @CurrentUser() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateDepartmentDto,
  ) {
    return this.departments.update(auth, id, body);
  }
}
