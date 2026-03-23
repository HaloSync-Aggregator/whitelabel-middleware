/**
 * PolarHub Error Handling
 *
 * Error code mapping and special case handling
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Success code list
 * PolarHub API returns '0' or '00000' for success.
 */
export const SUCCESS_CODES = ['0', '00000'];

/**
 * PolarHub API error class
 */
export class PolarHubError extends Error {
  constructor(
    message: string,
    public code: string,
    public detail?: {
      Errors?: Array<{
        Owner?: string;
        Message?: string;
        Code?: string;
      }>;
      Warnings?: Array<{
        Owner?: string;
        Message?: string;
        Code?: string;
      }>;
    },
  ) {
    super(message);
    this.name = 'PolarHubError';
  }
}

/**
 * PolarHub error code to HTTP status code mapping
 */
export const ERROR_CODE_MAP: Record<string, number> = {
  '50101': HttpStatus.BAD_REQUEST, // Invalid request
  '50102': HttpStatus.UNAUTHORIZED, // Authentication failed
  '50103': HttpStatus.FORBIDDEN, // Forbidden
  '50201': HttpStatus.NOT_FOUND, // Not found
  '50202': HttpStatus.OK, // BA booking success (special case)
  '50301': HttpStatus.CONFLICT, // Conflict
  '50401': HttpStatus.REQUEST_TIMEOUT, // Timeout
  '50501': HttpStatus.INTERNAL_SERVER_ERROR, // Internal server error
};

/**
 * Check if response is successful
 */
export function isSuccessCode(code: string): boolean {
  return SUCCESS_CODES.includes(code);
}

/**
 * Check ResultMessage for errors and throw PolarHubError if found
 */
export function checkResultMessage(resultMessage?: {
  Code?: string;
  Message?: string;
  MessageDetail?: unknown;
}): void {
  if (!resultMessage?.Code) return;

  if (!isSuccessCode(resultMessage.Code)) {
    throw new PolarHubError(
      resultMessage.Message || 'Unknown API error',
      resultMessage.Code,
      resultMessage.MessageDetail as PolarHubError['detail'],
    );
  }
}

/**
 * Convert PolarHub error to HTTP exception
 */
export function toHttpException(error: unknown): HttpException {
  if (error instanceof PolarHubError) {
    const status = ERROR_CODE_MAP[error.code] || HttpStatus.INTERNAL_SERVER_ERROR;

    // BA booking success special case
    if (
      error.code === '50202' &&
      error.message.toLowerCase().includes('booking has been created')
    ) {
      return new HttpException(
        {
          success: true,
          warning: error.message,
          code: error.code,
        },
        HttpStatus.OK,
      );
    }

    return new HttpException(
      {
        error: error.message,
        code: error.code,
        details: error.detail?.Errors || error.detail?.Warnings,
      },
      status,
    );
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new HttpException(
        { error: 'Request timeout' },
        HttpStatus.REQUEST_TIMEOUT,
      );
    }

    return new HttpException(
      { error: error.message },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  return new HttpException(
    { error: 'Unknown error' },
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}

/**
 * Format error message
 */
export function formatErrorMessage(error: PolarHubError): string {
  const details = error.detail?.Errors?.map(
    (e) => `[${e.Owner || 'UNKNOWN'}] ${e.Message || e.Code}`,
  );

  if (details && details.length > 0) {
    return `${error.message}: ${details.join(', ')}`;
  }

  return error.message;
}
