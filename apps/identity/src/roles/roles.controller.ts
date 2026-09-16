import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '@ddwmd/common';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller()
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('roles')
  @RequirePermissions('user:manage')
  list() {
    return this.roles.list();
  }

  @Get('permissions')
  @RequirePermissions('role:manage')
  permissions() {
    return this.roles.permissions();
  }
}
