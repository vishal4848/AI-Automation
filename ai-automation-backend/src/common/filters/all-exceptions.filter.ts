import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error. Please try again later.';
    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      let msg = typeof resp === 'string' ? resp : (resp as any).message || 'Request failed';
      message = Array.isArray(msg) ? msg.join(', ') : msg;
      
      // Sanitize internal details if any leaked into HttpException message
      if (typeof message === 'string' && (message.includes('prisma') || message.includes('SELECT') || message.includes('INSERT') || message.includes('postgresql://'))) {
        message = 'A database error occurred. Please try again.';
      }
    }

    this.logger.error(`${request.method} ${request.url} - ${status}`, exception instanceof Error ? exception.stack : '');

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
