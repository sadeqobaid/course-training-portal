import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(
    request: Request & { requestId?: string },
    response: Response,
    next: NextFunction,
  ): void {
    request.requestId = request.header('x-request-id') ?? randomUUID();
    response.setHeader('x-request-id', request.requestId);
    next();
  }
}
