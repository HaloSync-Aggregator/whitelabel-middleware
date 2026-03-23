/**
 * PolarHub Global Exception Filter
 *
 * Catches PolarHubError thrown by the client and returns
 * FE-compatible error responses with ResultMessage format.
 *
 * Error flow:
 *   PolarHubClient → throws PolarHubError → Filter catches → FE response
 *
 * Other errors (network, timeout, etc.) fall through to NestJS default handler.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { PolarHubError } from '../utils/error-handler';
import { ERROR_CODE_MAP } from '../utils/error-handler';

@Catch(PolarHubError)
export class PolarHubExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PolarHubExceptionFilter.name);

  catch(exception: PolarHubError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = ERROR_CODE_MAP[exception.code] || 500;

    this.logger.warn(
      `PolarHubError [${exception.code}]: ${exception.message}`,
    );

    // BA 50202 special case: booking created with warnings → HTTP 200
    if (
      exception.code === '50202' &&
      exception.message.toLowerCase().includes('booking has been created')
    ) {
      response.status(200).json({
        statusCode: 200,
        message: exception.message,
        ResultMessage: {
          Code: exception.code,
          Message: exception.message,
          MessageDetail: exception.detail,
        },
      });
      return;
    }

    // FE-compatible error response format
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      ResultMessage: {
        Code: exception.code,
        Message: exception.message,
        MessageDetail: exception.detail,
      },
    });
  }
}
