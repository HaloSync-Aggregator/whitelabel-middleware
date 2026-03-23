/**
 * PolarHub Module Exports
 *
 * Defines all exports available for external use.
 */

// Module
export { PolarHubModule } from './polarhub.module';

// Service
export { PolarHubService } from './polarhub.service';

// Client
export { PolarHubClient } from './client';

// Types
export * from './types';

// Controllers
export { OrderQuoteController } from './controllers/order-quote.controller';

// DTOs
export * from './dto/order-quote.dto';

// Utils
export {
  buildHmacHeaders,
  getOrGenerateAuthHeaders,
  isCompleteAuthHeaders,
} from './utils/auth';
export type { HmacAuthParams, HmacHeaders } from './utils/auth';

export {
  PolarHubError,
  SUCCESS_CODES,
  ERROR_CODE_MAP,
  isSuccessCode,
  checkResultMessage,
  toHttpException,
  formatErrorMessage,
} from './utils/error-handler';

// Filters
export { PolarHubExceptionFilter } from './filters/polarhub-exception.filter';

export {
  RequestLogger,
  getRequestLogger,
  consoleLogger,
} from './utils/logger';
export type { RequestLoggerOptions } from './utils/logger';
