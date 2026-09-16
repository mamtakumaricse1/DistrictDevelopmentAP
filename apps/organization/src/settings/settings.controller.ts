import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CurrentUser, IsUuidLike, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { UpsertSettingDto } from './dto/setting.dto';
import { SettingsService } from './settings.service';

class SettingsQueryDto {
  @IsOptional()
  @IsUuidLike()
  districtId?: string;
}

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @RequirePermissions('master:manage')
  list(@CurrentUser() auth: AuthContext, @Query() query: SettingsQueryDto) {
    return this.settings.list(auth, query.districtId);
  }

  @Put()
  @RequirePermissions('master:manage')
  upsert(@CurrentUser() auth: AuthContext, @Body() body: UpsertSettingDto) {
    return this.settings.upsert(auth, body);
  }
}
