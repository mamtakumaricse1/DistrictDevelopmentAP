import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CurrentUser, IsUuidLike, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';
import { MeetingsService } from './meetings.service';

class MeetingQueryDto {
  @IsOptional()
  @IsUuidLike()
  districtId?: string;
}

@ApiTags('meetings')
@ApiBearerAuth()
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @Get()
  @RequirePermissions('meeting:manage')
  @ApiOperation({ summary: 'List review meetings in the caller district scope' })
  list(@CurrentUser() auth: AuthContext, @Query() query: MeetingQueryDto) {
    return this.meetings.list(auth, query.districtId);
  }

  @Get(':id')
  @RequirePermissions('meeting:manage')
  @ApiOperation({ summary: 'DC review meeting with actions grouped by department' })
  getById(@CurrentUser() auth: AuthContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.meetings.getById(auth, id);
  }

  @Post()
  @RequirePermissions('meeting:manage')
  create(@CurrentUser() auth: AuthContext, @Body() body: CreateMeetingDto) {
    return this.meetings.create(auth, body);
  }

  @Patch(':id')
  @RequirePermissions('meeting:manage')
  update(
    @CurrentUser() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMeetingDto,
  ) {
    return this.meetings.update(auth, id, body);
  }
}
