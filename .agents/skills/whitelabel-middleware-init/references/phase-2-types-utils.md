# Phase 2: Types & Utilities

## Files to Create (4 files)

| # | File | Path |
|---|------|------|
| 5 | types/index.ts | src/lib/polarhub/types/index.ts |
| 6 | error-handler.ts | src/lib/polarhub/utils/error-handler.ts |
| 7 | auth.ts | src/lib/polarhub/utils/auth.ts |
| 8 | logger.ts | src/lib/polarhub/utils/logger.ts |

## File 5: types/index.ts
**Path**: `src/lib/polarhub/types/index.ts`
````typescript
/**
 * PolarHub API Types
 *
 * Common type definitions.
 * Defined based on the OpenAPI spec (spec/polarhub.openapi.json).
 */

// ==============================================
// Common Types
// ==============================================

/**
 * HMAC authentication headers provided by FE
 * All 3 headers must be present for pass-through.
 */
export interface FEAuthHeaders {
  'x-date'?: string;
  Digest?: string;
  Authorization?: string;
}

/**
 * Sender - Travel Agency information
 * FE-provided value takes priority, environment variable as fallback
 */
export interface Sender {
  TravelAgency: {
    AgencyID: string;
    SiteCode?: string;
    AgencyName?: string;
    ContactInfoRefID?: string[];
  };
}

/**
 * API request options (common to all APIs)
 * CRITICAL: transactionId must be provided by FE!
 */
export interface RequestOptions {
  transactionId: string; // Must be provided by FE (do not generate in middleware!)
  pointOfSale?: string;
  sender?: Sender;
  feAuthHeaders?: FEAuthHeaders;
}

/**
 * Common response result message
 */
export interface ResultMessage {
  Code: string;
  Message?: string;
  MessageDetail?: {
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
  };
}

// ==============================================
// AirShopping Types
// ==============================================

export interface OriginDest {
  OriginCode: string;
  DestCode: string;
  DepartureDate: string;
}

export interface LoyaltyProgramAccount {
  AccountNumber?: string;
  ProgramOwner?: string;
}

export interface PaxSimple {
  PaxID: string;
  Ptc: string; // ADT | CHD | INF
  BirthDate?: string;
  PaxRefID?: string;
  LoyaltyProgramAccount?: LoyaltyProgramAccount[];
}

export interface Criteria {
  Direct?: boolean;
  AirlinePreference?: {
    AirlineID: string[];
  };
  ProgramCriteria?: Array<{
    AirlineID: string;
    ContractID?: string;
    AccountID?: string[];
    TypeCode?: string;
  }>;
  PromotionCriteria?: Array<{
    AirlineID: string;
    PromotionID?: string;
  }>;
  SpecialFareCriteria?: Array<{
    AirlineID?: string;
    AccountID?: string;
    TypeCode?: string;
  }>;
  ExistingOrderCriteria?: {
    OrderID: string;
    PaxRefID?: string[];
  };
}

export interface ResponseParameter {
  CurrencyCode?: string;
  LanguageUsage?: {
    LangCode: string;
    LangUsageType?: string;
  };
}

export interface FopPromotion {
  PromotionCode: string;
  PaymentType?: string;
  CardCode?: string;
  CardName?: string;
}

export interface AirShoppingQuery {
  OriginDestList: OriginDest[];
  PaxList: PaxSimple[];
  Cabin?: string; // Y | W | C | F
  Criteria?: Criteria;
}

export interface AirShoppingRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  ShoppingResponseID?: string;
  Offer?: unknown[];
  DataLists?: unknown;
}

// ==============================================
// OfferPrice Types
// ==============================================

export interface SeatSelection {
  Column: string;
  Row: string;
}

export interface BookingInstructions {
  Text?: string[];
  Ositext?: string[];
}

export interface OfferItem {
  OfferItemID: string;
  PaxRefID: string[];
  SeatSelection?: SeatSelection;
  BookingInstructions?: BookingInstructions;
}

export interface OfferSelection {
  ResponseID: string;
  OfferID: string;
  Owner: string;
  OfferItems: OfferItem[];
}

export interface OfferPriceQuery {
  Offers: OfferSelection[];
  PaxList: PaxSimple[];
  Criteria?: Criteria;
  ResponseParameter?: ResponseParameter;
  FopPromotion?: FopPromotion[];
}

export interface OfferPriceRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  PricedOffer?: unknown[];
  DataLists?: unknown;
}

// ==============================================
// OrderCreate Types
// ==============================================

export interface Individual {
  NameTitle?: string;
  GivenName: string[];
  Surname: string;
  Birthdate: string;
  Gender?: string; // MALE | FEMALE | UNSPECIFIED
}

export interface IdentityDoc {
  IdentityDocumentType: string; // PT (Passport), etc.
  IdentityDocumentNumber: string;
  ExpiryDate?: string;
  IssuingCountryCode?: string;
  CitizenshipCountryCode?: string;
  ResidenceCountryCode?: string;
  Gender?: string;
}

export interface Phone {
  Label?: string;
  CountryDialingCode?: string;
  PhoneNumber: string;
}

export interface PostalAddress {
  Street?: string[];
  CityName?: string;
  PostalCode?: string;
  CountryCode?: string;
}

export interface ContactInfo {
  ContactInfoID: string;
  EmailAddress?: string[];
  Phone?: Phone[];
  PostalAddress?: PostalAddress[];
  ContactRefusedInd?: boolean;
}

export interface PaxDetail {
  PaxID: string;
  Ptc: string;
  Individual: Individual;
  IdentityDoc?: IdentityDoc[];
  ContactInfoRefID?: string[];
  Gender?: string;
  CitizenshipCountryCode?: string;
  ResidenceCountryCode?: string;
}

export interface OrderItem {
  ResponseID: string;
  OfferID: string;
  Owner: string;
  OfferItems: OfferItem[];
}

export interface PaymentCardMethod {
  CardCode: string;
  CardNumber: string;
  CardHolderName: string;
  EffectiveExpireDate: {
    Expiration: string;
  };
  SeriesCode?: string;
}

export interface Payment {
  Type: string; // Cash | Card | Ag
  Amount: number;
  CurCode: string;
  PaymentCardMethod?: PaymentCardMethod;
  OrderItemID?: string[];
  OfferItemID?: string[];
  PaxRefID?: string[];
}

export interface OrderCreateQuery {
  Order: OrderItem[];
  PaxList: PaxDetail[];
  ContactInfoList?: ContactInfo[];
  PaymentList?: Payment[];
}

export interface OrderViewRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  OrderID?: string;
  Order?: unknown;
  DataLists?: unknown;
}

// ==============================================
// OrderRetrieve Types
// ==============================================

export interface OrderRetrieveQuery {
  OrderID: string;
}

// ==============================================
// OrderCancel Types
// ==============================================

export interface OrderCancelQuery {
  OrderID: string;
  OrderItemRefID?: string[];
  PaxRefID?: string[];
}

export interface OrderCancelRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  OrderID?: string;
  TicketDocInfoList?: unknown[];
}

// ==============================================
// OrderChange Types
// ==============================================

export interface SelectedPricedOffer {
  OfferID: string;
  Owner: string;
  ResponseID?: string;
  OfferItems: OfferItem[];
}

export interface AcceptSelectedQuotedOfferList {
  SelectedPricedOffer: SelectedPricedOffer[];
}

export interface AcceptOrderItemList {
  Owner: string;
  OfferItemRefID?: string[];
}

export interface AcceptRepricedOrder {
  OfferRefID: string[];
}

export interface UpdatePax {
  CurrentPaxRefID?: string;
  NewPaxRefID?: string;
}

export interface AcceptChange {
  OrderItemRefID: string[];
}

export interface ChangeOrderChoice {
  AcceptSelectedQuotedOfferList?: AcceptSelectedQuotedOfferList;
  AcceptOrderItemList?: AcceptOrderItemList;
  AcceptRepricedOrder?: AcceptRepricedOrder;
  UpdatePax?: UpdatePax[];
  AcceptChange?: AcceptChange;
}

export interface OrderChangeQuery {
  OrderID: string;
  ReasonCode?: string;
  ChangeOrderChoice: ChangeOrderChoice;
  PaxList?: PaxDetail[];
  PaymentList?: Payment[];
  ContactInfoList?: ContactInfo[];
  Criteria?: Criteria;
  ResponseParameter?: ResponseParameter;
  FopPromotion?: FopPromotion[];
}

// ==============================================
// ServiceList Types
// ==============================================

export interface ServiceListQuery {
  // Prime Booking (Offer-based)
  Offers?: Array<{
    ResponseID: string;
    OfferID: string;
    Owner: string;
    OfferItems: OfferItem[];
  }>;
  // Post-Booking (Order-based)
  OrderID?: string;
  PaxList: PaxSimple[];
}

export interface ServiceListRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  ALaCarteOffer?: unknown[];
  DataLists?: unknown;
}

// ==============================================
// SeatAvailability Types
// ==============================================

export interface SeatAvailabilityQuery {
  // Prime Booking (Offer-based)
  Offers?: Array<{
    ResponseID: string;
    OfferID: string;
    Owner: string;
    OfferItems: OfferItem[];
  }>;
  // Post-Booking (Order-based)
  OrderID?: string;
  PaxList: PaxSimple[];
}

export interface SeatAvailabilityRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  SeatMap?: unknown[];
  DataLists?: unknown;
}

// ==============================================
// OrderReshop Types
// ==============================================

export interface ReshopServiceOrderDelete {
  OrderItemRefID: string;
  RetainServiceID?: string[];
}

export interface ReshopServiceOrderAdd {
  OriginDestList: OriginDest[];
  Cabin?: string;
}

export interface ReshopServiceOrder {
  Delete?: ReshopServiceOrderDelete[];
  Add?: ReshopServiceOrderAdd;
}

export interface ReshopOrder {
  ServiceOrder: ReshopServiceOrder;
}

export interface UpdateOrder {
  ReshopOrder?: ReshopOrder;
  CancelOrderRefID?: string; // String! Not an object!
  RepricedOrderRefID?: string; // String! For deferred ticketing (LH, EK, etc.)
}

export interface OrderReshopQuery {
  OrderID: string;
  ActionContext?: string; // '8' = Voluntary, '9' = Involuntary
  UpdateOrder: UpdateOrder;
  Criteria?: Criteria;
  ResponseParameter?: ResponseParameter;
}

export interface OrderReshopRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  ReshopOffers?: unknown[];
  DataLists?: unknown;
}

// ==============================================
// OrderQuote Types
// ==============================================

export interface OrderQuoteQuery {
  // Mode 1: SelectedOffer (Seat/Service Quote)
  SelectedOffer?: Array<{
    OfferID: string;
    Owner: string;
    OfferItems: OfferItem[];
  }>;
  // Mode 2: RepricedOrderID (Hold confirmation Quote)
  RepricedOrderID?: string;
  OrderID?: string;
  PaxList?: PaxSimple[];
  Criteria?: Criteria;
  ResponseParameter?: ResponseParameter;
  FopPromotion?: FopPromotion[];
}

export interface OrderQuoteRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  QuotedOffer?: unknown[];
  DataLists?: unknown;
}

// ==============================================
// Client Config Types
// ==============================================

export interface PolarHubConfig {
  baseUrl: string;
  tenant: string;
  secretBase64: string;
  siteCode?: string;
  agencyName?: string;
  agencyContactId?: string;
  timeout?: number;
  retryCount?: number;
  loggingEnabled?: boolean;
}

// ==============================================
// Generic API Response
// ==============================================

export interface PolarHubResponse<T = unknown> {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  [key: string]: T | ResultMessage | string | undefined;
}
````

## File 6: error-handler.ts
**Path**: `src/lib/polarhub/utils/error-handler.ts`
````typescript
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
````

## File 7: auth.ts
**Path**: `src/lib/polarhub/utils/auth.ts`
````typescript
/**
 * PolarHub HMAC-SHA512 Authentication
 *
 * CRITICAL: This file is based on the /polarhub-hmac-auth skill.
 * Do not arbitrarily change the authentication format! (Do not use other formats such as AWS SigV4)
 *
 * Authentication headers:
 * - x-date: RFC1123 format timestamp
 * - Digest: SHA-512={base64_hash}
 * - Authorization: hmac username="...", algorithm="hmac-sha512", headers="x-date digest", signature="..."
 */

import * as crypto from 'crypto';
import { FEAuthHeaders } from '../types';

export interface HmacAuthParams {
  tenant: string;
  secretBase64: string;
  bodyRaw: string;
}

export interface HmacHeaders {
  'Content-Type': string;
  Accept: string;
  'x-date': string;
  Digest: string;
  Authorization: string;
  'X-Tide-Tenant-Id': string;
  [key: string]: string; // Index signature for fetch compatibility
}

/**
 * Generate SHA-512 hash and encode as Base64
 */
function sha512Base64(input: string): string {
  return crypto.createHash('sha512').update(input, 'utf8').digest('base64');
}

/**
 * Generate HMAC-SHA512 signature with Base64-encoded secret
 */
function hmacSha512Base64(message: string, secretBase64: string): string {
  const key = Buffer.from(secretBase64, 'base64');
  return crypto.createHmac('sha512', key).update(message, 'utf8').digest('base64');
}

/**
 * Build HMAC authentication headers for PolarHub API
 *
 * CRITICAL: The digest is computed over a JSON object containing:
 * - AgencyID: The tenant identifier
 * - Request: The raw request body as a string
 */
export function buildHmacHeaders({
  tenant,
  secretBase64,
  bodyRaw,
}: HmacAuthParams): HmacHeaders {
  // Step 1: Generate x-date in RFC1123 format
  const xDate = new Date().toUTCString();

  // Step 2: Create target data for digest
  // IMPORTANT: Request is the raw body string, not parsed JSON
  const targetData = JSON.stringify({
    AgencyID: tenant,
    Request: bodyRaw,
  });

  // Step 3: Compute SHA-512 digest
  const digest = `SHA-512=${sha512Base64(targetData)}`;

  // Step 4: Create signature string (must match header order)
  const sigString = `x-date: ${xDate}\ndigest: ${digest}`;

  // Step 5: Generate HMAC-SHA512 signature
  const signature = hmacSha512Base64(sigString, secretBase64);

  // Step 6: Build authorization header
  const authorization = `hmac username="${tenant}", algorithm="hmac-sha512", headers="x-date digest", signature="${signature}"`;

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'x-date': xDate,
    Digest: digest,
    Authorization: authorization,
    'X-Tide-Tenant-Id': tenant,
  };
}

/**
 * Check if FE auth headers are complete
 * All 3 headers must be present for pass-through
 */
export function isCompleteAuthHeaders(headers?: FEAuthHeaders): boolean {
  if (!headers) return false;
  return !!(headers['x-date'] && headers.Digest && headers.Authorization);
}

/**
 * Get auth headers - FE pass-through or generate new
 *
 * @param config - Tenant and secret for HMAC generation
 * @param bodyRaw - Raw request body string
 * @param feHeaders - Optional FE auth headers for pass-through
 * @returns HMAC headers (from FE or newly generated)
 */
export function getOrGenerateAuthHeaders(
  config: { tenant: string; secretBase64: string },
  bodyRaw: string,
  feHeaders?: FEAuthHeaders,
): HmacHeaders {
  // FE pass-through: Use as-is if all 3 headers are present
  if (isCompleteAuthHeaders(feHeaders)) {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-date': feHeaders!['x-date']!,
      Digest: feHeaders!.Digest!,
      Authorization: feHeaders!.Authorization!,
      'X-Tide-Tenant-Id': config.tenant,
    };
  }

  // Generate new headers using environment config
  return buildHmacHeaders({
    tenant: config.tenant,
    secretBase64: config.secretBase64,
    bodyRaw,
  });
}
````

## File 8: logger.ts
**Path**: `src/lib/polarhub/utils/logger.ts`
````typescript
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
````

## Phase 2 Completion
- [ ] 4 files created
- Report: "📦 Phase 2/7 완료 - Types & Utilities (4 files)"
