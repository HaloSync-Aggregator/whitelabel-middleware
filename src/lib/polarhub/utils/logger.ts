/**
 * PolarHub Request/Response Logger
 *
 * Logs all PolarHub API calls to files.
 *
 * Log file path format:
 * logs/{transactionId}/{SEQ}.{ApiName}{RQ|RS}.json
 */

import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Logger } from '@nestjs/common';

export interface RequestLoggerOptions {
  baseDir?: string;
  enabled?: boolean;
}

export class RequestLogger {
  private readonly baseDir: string;
  private readonly enabled: boolean;
  private readonly logger = new Logger(RequestLogger.name);

  constructor(options?: RequestLoggerOptions) {
    this.baseDir = options?.baseDir || 'logs';
    // Enabled by default in non-production environments
    this.enabled = options?.enabled ?? process.env.NODE_ENV !== 'production';
  }

  /**
   * Extract API name
   * /hub/polarpie/v2/airShopping -> AirShopping
   */
  private extractApiName(endpoint: string): string {
    const parts = endpoint.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  }

  /**
   * Get next sequence number
   */
  private getNextSequence(transactionDir: string): number {
    if (!existsSync(transactionDir)) return 1;

    try {
      const files = readdirSync(transactionDir);
      const sequences = files
        .map((f) => parseInt(f.match(/^(\d+)\./)?.[1] || '0', 10))
        .filter((n) => n > 0);
      return sequences.length > 0 ? Math.max(...sequences) + 1 : 1;
    } catch {
      return 1;
    }
  }

  /**
   * Log request
   */
  async logRequest(
    transactionId: string,
    endpoint: string,
    data: unknown,
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      const dir = join(this.baseDir, transactionId);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const seq = this.getNextSequence(dir).toString().padStart(3, '0');
      const apiName = this.extractApiName(endpoint);
      const filename = `${seq}.${apiName}RQ.json`;

      const logEntry = {
        timestamp: new Date().toISOString(),
        transactionId,
        apiName,
        type: 'RQ',
        endpoint,
        data,
      };

      writeFileSync(join(dir, filename), JSON.stringify(logEntry, null, 2));
      this.logger.debug(`Logged request: ${filename}`);
    } catch (error) {
      this.logger.warn(`Failed to log request: ${error}`);
    }
  }

  /**
   * Log response
   */
  async logResponse(
    transactionId: string,
    endpoint: string,
    data: unknown,
    durationMs?: number,
    error?: Error,
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      const dir = join(this.baseDir, transactionId);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const seq = this.getNextSequence(dir).toString().padStart(3, '0');
      const apiName = this.extractApiName(endpoint);
      const filename = `${seq}.${apiName}RS.json`;

      const logEntry = {
        timestamp: new Date().toISOString(),
        transactionId,
        apiName,
        type: 'RS',
        endpoint,
        durationMs,
        ...(error
          ? {
              error: {
                name: error.name,
                message: error.message,
              },
            }
          : { data }),
      };

      writeFileSync(join(dir, filename), JSON.stringify(logEntry, null, 2));
      this.logger.debug(`Logged response: ${filename} (${durationMs}ms)`);
    } catch (error) {
      this.logger.warn(`Failed to log response: ${error}`);
    }
  }
}

// Singleton instance
let requestLoggerInstance: RequestLogger | null = null;

/**
 * Return RequestLogger singleton instance
 */
export function getRequestLogger(options?: RequestLoggerOptions): RequestLogger {
  if (!requestLoggerInstance) {
    requestLoggerInstance = new RequestLogger(options);
  }
  return requestLoggerInstance;
}

/**
 * Console logging utility
 */
export const consoleLogger = {
  request: (apiName: string, transactionId: string, data?: unknown) => {
    const logger = new Logger('PolarHub');
    logger.log(`[${transactionId}] >>> ${apiName} Request`);
    if (data && process.env.NODE_ENV !== 'production') {
      logger.debug(JSON.stringify(data, null, 2));
    }
  },

  response: (
    apiName: string,
    transactionId: string,
    durationMs: number,
    success: boolean,
  ) => {
    const logger = new Logger('PolarHub');
    const status = success ? 'SUCCESS' : 'ERROR';
    logger.log(`[${transactionId}] <<< ${apiName} Response (${durationMs}ms) [${status}]`);
  },
};
