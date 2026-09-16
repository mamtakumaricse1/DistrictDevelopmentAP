import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { CreateProgressDto } from './dto/progress.dto';
import { ProgressService } from './progress.service';

@ApiTags('progress')
@ApiBearerAuth()
@Controller('projects/:projectId/progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get()
  @RequirePermissions('progress:read')
  @ApiOperation({ summary: 'List append-only progress versions for a project' })
  list(@CurrentUser() auth: AuthContext, @Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.progress.list(auth, projectId);
  }

  @Post()
  @RequirePermissions('progress:submit')
  @ApiOperation({ summary: 'Submit a new progress version (never overwrites history)' })
  submit(
    @CurrentUser() auth: AuthContext,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: CreateProgressDto,
  ) {
    return this.progress.submit(auth, projectId, body);
  }
}
