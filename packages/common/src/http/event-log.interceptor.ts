import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import {
  actorFromRequest,
  entityIdFromPath,
  eventName,
  formatEventLog,
  isImportantRequest,
  requestPath,
  successStatus,
} from './event-log';

@Injectable()
export class EventLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Event');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const method = request.method;
    const path = requestPath(request);
    if (!isImportantRequest(method, path)) {
      return next.handle();
    }
    const started = Date.now();
    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          formatEventLog({
            event: eventName(method, path),
            outcome: 'ok',
            status: successStatus(method, response.statusCode),
            method,
            path,
            actor: actorFromRequest(request),
            requestId: request.requestId,
            entityId: entityIdFromPath(path),
            durationMs: Date.now() - started,
          }),
        );
      }),
    );
  }
}
