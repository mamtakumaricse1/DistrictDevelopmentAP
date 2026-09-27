import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { eventName, formatEventLog, requestPath } from '@ddwmd/common';
import { NextFunction, Request, Response } from 'express';
import { GatewayService } from './gateway.service';

const HOP_BY_HOP = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade', 'host', 'content-length']);

@Injectable()
export class GatewayProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Event');

  constructor(private readonly gateway: GatewayService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const path = req.originalUrl.split('?')[0] ?? '';
    if (path.includes('/health') || path.includes('/docs')) {
      next();
      return;
    }

    const hasBody = !['GET', 'HEAD'].includes(req.method);
    let body: Buffer | undefined;
    if (hasBody) {
      try {
        body = await this.readBody(req);
      } catch {
        this.logGatewayFailure(req, 413);
        res.status(413).json({
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'The request body exceeds the upload limit.',
            details: [],
            requestId: req.header('x-request-id'),
          },
        });
        return;
      }
    }

    const timeoutMs = Number(process.env.GATEWAY_PROXY_TIMEOUT_MS ?? 120000);
    const origins = this.rotate(this.gateway.targetsFor(path));

    for (let i = 0; i < origins.length; i += 1) {
      const url = `${origins[i]}${req.originalUrl}`;
      try {
        const response = await fetch(url, {
          method: req.method,
          headers: this.forwardHeaders(req),
          body: body ? new Uint8Array(body) : undefined,
          signal: AbortSignal.timeout(timeoutMs),
        });
        res.status(response.status);
        response.headers.forEach((value, name) => {
          if (HOP_BY_HOP.has(name.toLowerCase())) {
            return;
          }
          res.setHeader(name, value);
        });
        const buffer = Buffer.from(await response.arrayBuffer());
        res.send(buffer.length ? buffer : undefined);
        return;
      } catch {
        const retryGet = ['GET', 'HEAD'].includes(req.method) && i < origins.length - 1;
        if (!retryGet) {
          break;
        }
      }
    }

    this.logGatewayFailure(req, 502);
    res.status(502).json({
      error: {
        code: 'BAD_GATEWAY',
        message: 'An upstream service is unavailable.',
        details: [],
        requestId: req.header('x-request-id'),
      },
    });
  }

  private logGatewayFailure(req: Request, status: number): void {
    const path = requestPath(req);
    this.logger.warn(
      formatEventLog({
        event: eventName(req.method, path),
        outcome: 'error',
        status,
        method: req.method,
        path,
        actor: 'gateway',
        requestId: req.header('x-request-id') ?? undefined,
      }),
    );
  }

  private forwardHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(req.headers)) {
      if (!value || HOP_BY_HOP.has(name.toLowerCase())) {
        continue;
      }
      headers[name] = Array.isArray(value) ? value.join(',') : value;
    }
    return headers;
  }

  private rotate(urls: string[]): string[] {
    if (urls.length <= 1) {
      return urls;
    }
    const start = Math.floor(Math.random() * urls.length);
    return [...urls.slice(start), ...urls.slice(0, start)];
  }

  private readBody(req: Request): Promise<Buffer> {
    const max = Number(process.env.UPLOAD_MAX_BYTES ?? 12 * 1024 * 1024);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let total = 0;
      req.on('data', (chunk: Buffer) => {
        total += chunk.length;
        if (total > max) {
          req.destroy();
          reject(new Error('payload too large'));
        } else {
          chunks.push(chunk);
        }
      });
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }
}
