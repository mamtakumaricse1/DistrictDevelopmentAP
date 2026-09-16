import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CurrentUser, IsUuidLike, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

class UserQueryDto {
  @IsOptional()
  @IsUuidLike()
  districtId?: string;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions('user:manage')
  list(@CurrentUser() auth: AuthContext, @Query() query: UserQueryDto) {
    return this.users.list(auth, query.districtId);
  }

  @Post()
  @RequirePermissions('user:manage')
  create(@CurrentUser() auth: AuthContext, @Body() body: CreateUserDto) {
    return this.users.create(auth, body);
  }

  @Get(':id')
  @RequirePermissions('user:manage')
  getById(@CurrentUser() auth: AuthContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.users.getById(auth, id);
  }

  @Patch(':id')
  @RequirePermissions('user:manage')
  update(
    @CurrentUser() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.users.update(auth, id, body);
  }
}
