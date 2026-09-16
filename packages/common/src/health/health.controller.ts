import { Controller, Get, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { HealthService, LivenessResponse, ReadinessResponse } from './health.service';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'Process is running' })
  liveness(): LivenessResponse {
    return this.health.liveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (includes database)' })
  @ApiOkResponse({ description: 'Database connectivity check' })
  async readiness(@Res({ passthrough: true }) res: Response): Promise<ReadinessResponse> {
    const result = await this.health.readiness();
    if (result.status !== 'ready') {
      res.status(503);
    }
    return result;
  }
}
