import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser, InternalKeyGuard, IsUuidLike, Public, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { NotificationsService } from './notifications.service';

class IngestDto {
  @IsUuidLike()
  districtId!: string;

  @IsOptional()
  @IsUuidLike()
  departmentId?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(300)
  title!: string;

  @IsString()
  @MinLength(1)
  body!: string;

  @IsString()
  @MaxLength(32)
  type!: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUuidLike()
  entityId?: string;
}

@ApiTags('notifications')
@Controller()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Public()
  @UseGuards(InternalKeyGuard)
  @Post('internal/notifications')
  ingest(@Body() body: IngestDto) {
    return this.notifications.ingest(body);
  }

  @ApiBearerAuth()
  @Get('notifications')
  @RequirePermissions('notification:read')
  @ApiOperation({ summary: 'List notifications in the caller district/department scope' })
  list(@CurrentUser() auth: AuthContext) {
    return this.notifications.list(auth);
  }

  @ApiBearerAuth()
  @Get('notifications/unread-count')
  @RequirePermissions('notification:read')
  unread(@CurrentUser() auth: AuthContext) {
    return this.notifications.unreadCount(auth);
  }

  @ApiBearerAuth()
  @Post('notifications/:id/read')
  @RequirePermissions('notification:read')
  markRead(@CurrentUser() auth: AuthContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.markRead(auth, id);
  }
}
