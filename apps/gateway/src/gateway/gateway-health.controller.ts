import { Controller, Get, Res } from '@nestjs/common';
import { Public } from '@ddwmd/common';
import { Response } from 'express';
import { GatewayService } from './gateway.service';

@Public()
@Controller('health')
export class GatewayHealthController {
  constructor(private readonly gateway: GatewayService) {}

  @Get()
  liveness() {
    return { status: 'ok', service: 'gateway', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async readiness(@Res({ passthrough: true }) res: Response) {
    const checks = {
      identity: await this.pingAll(this.gateway.identityUrls()),
      organization: await this.pingAll(this.gateway.organizationUrls()),
      works: await this.pingAll(this.gateway.worksUrls()),
      governance: await this.pingAll(this.gateway.governanceUrls()),
      notify: await this.pingAll(this.gateway.notifyUrls()),
    };
    const requiredUp = checks.identity === 'up' && checks.organization === 'up';
    const allUp = Object.values(checks).every((status) => status === 'up');
    if (!requiredUp) {
      res.status(503);
    }
    return {
      status: requiredUp ? (allUp ? 'ready' : 'degraded') : 'unavailable',
      service: 'gateway',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async pingAll(urls: string[]): Promise<'up' | 'down'> {
    const results = await Promise.all(urls.map((url) => this.ping(`${url}/api/v1/health`)));
    return results.some((status) => status === 'up') ? 'up' : 'down';
  }

  private async ping(url: string): Promise<'up' | 'down'> {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      return response.ok ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
