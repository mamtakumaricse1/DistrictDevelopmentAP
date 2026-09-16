import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { requestId?: string }>();
    const response = http.getResponse<Response>();
    const incoming = request.header('x-request-id');
    const requestId = incoming && incoming.length <= 64 ? incoming : uuidv4();
    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);
    return next.handle();
  }
}
