import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { actorFromRequest, entityIdFromPath, eventName, formatEventLog, requestPath, shouldLogFailure } from './event-log';

type ErrorBody = {
  error: {
    code: string;
    message: string;
    details: unknown[];
    requestId: string | undefined;
  };
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = request.requestId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';
    let details: unknown[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      code = this.codeForStatus(status);
      if (typeof payload === 'string') {
        message = payload;
      } else if (typeof payload === 'object' && payload !== null) {
        const body = payload as { message?: string | string[]; error?: string };
        if (Array.isArray(body.message)) {
          message = 'Validation failed.';
          details = body.message;
          code = 'VALIDATION_ERROR';
        } else if (typeof body.message === 'string') {
          message = body.message;
        }
      }
    }

    this.logFailure(request, status, exception);

    const body: ErrorBody = {
      error: { code, message, details, requestId },
    };
    response.status(status).json(body);
  }

  private logFailure(request: Request, status: number, exception: unknown): void {
    const method = request.method ?? 'GET';
    const path = requestPath(request);
    if (!shouldLogFailure(method, path, status)) {
      return;
    }
    const line = formatEventLog({
      event: eventName(method, path),
      outcome: 'error',
      status,
      method,
      path,
      actor: actorFromRequest(request),
      requestId: request.requestId,
      entityId: entityIdFromPath(path),
    });
    if (status >= 500) {
      this.logger.error(line, exception instanceof Error ? exception.stack : undefined);
      return;
    }
    this.logger.warn(line);
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return 'PAYLOAD_TOO_LARGE';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR';
    }
  }
}
