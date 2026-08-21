import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request & { requestId?: string }>();
    const isHttp = error instanceof HttpException;
    const status = isHttp
      ? error.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const detail = isHttp ? error.getResponse() : 'Unexpected server error.';
    const message =
      typeof detail === 'string'
        ? detail
        : ((detail as { message?: string | string[] }).message ??
          'Request failed.');
    response.status(status).json({
      statusCode: status,
      message,
      requestId: request.requestId ?? 'unknown',
      timestamp: new Date().toISOString(),
    });
  }
}
