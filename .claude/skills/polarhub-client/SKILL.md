---
name: polarhub-client
description: PolarHub HTTP client implementation. Used when client configuration is needed for API calls. Includes retry logic, timeout, and error handling.
---

# PolarHub HTTP Client

The PolarHubClient class handles all PolarHub API calls.

## Auth Header Pass-through (CRITICAL)

All API methods optionally accept `FEAuthHeaders` for pass-through.

```typescript
// If FE sends HMAC headers, use them as-is
async airShopping(request: AirShoppingRequest, feAuthHeaders?: FEAuthHeaders)
async offerPrice(request: OfferPriceRequest, feAuthHeaders?: FEAuthHeaders)
async orderCreate(request: OrderCreateRequest, feAuthHeaders?: FEAuthHeaders)
// ... same for all APIs

// Internally uses getOrGenerateAuthHeaders()
const headers = getOrGenerateAuthHeaders(
  { tenantId, apiSecret },
  bodyString,
  feAuthHeaders,  // Headers sent from FE (optional)
);
```

## CRITICAL: Required Request Structure

**All PolarHub API request bodies must include the following fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `Sender` | **Required** | Contains tenant ID in `TravelAgency.AgencyID` |
| `PointOfSale` | **Required** | Country of sale code (e.g., "KR") |
| `TransactionID` | **Required** | 32-character UUID (hyphens removed) |
| `Query` | **Required** | Actual request data |

**All outbound HTTP requests include the `X-Tide-Tenant-Id` header** (value from `POLARHUB_TENANT_ID`) for whitelabel multi-tenant identification. This is added unconditionally in both HMAC-generated and FE pass-through auth paths.

**Error when Sender is missing:**
```json
{ "code": "", "message": "Sender is required" }
```

---

## Full Implementation Code

```typescript
// lib/polarhub/client.ts
import { buildHmacHeaders } from './auth';
import { PolarHubError } from './utils/error-handler';
// NOTE: generateTransactionId is only used by FE; do not import it in middleware!

export interface PolarHubConfig {
  baseUrl: string;
  tenant: string;
  secretBase64: string;
  siteCode?: string;
  timeout?: number;
  retryCount?: number;
}

export interface RequestOptions {
  transactionId?: string;
  pointOfSale?: string;
}

export class PolarHubClient {
  private config: Required<PolarHubConfig>;

  constructor(config: PolarHubConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      tenant: config.tenant,
      secretBase64: config.secretBase64,
      siteCode: config.siteCode || '01',
      timeout: config.timeout || 30000,
      retryCount: config.retryCount || 3,
    };
  }

  /**
   * Build common sender object for all requests
   */
  private buildSender(contactInfoRefId?: string[]) {
    return {
      TravelAgency: {
        AgencyID: this.config.tenant,
        SiteCode: this.config.siteCode,
        ...(contactInfoRefId && { ContactInfoRefID: contactInfoRefId }),
      },
    };
  }

  /**
   * Execute HTTP request with HMAC authentication
   * CRITICAL: transactionId must be provided by FE (middleware generation prohibited!)
   */
  private async request<TRequest, TResponse>(
    endpoint: string,
    body: TRequest,
    options: RequestOptions
  ): Promise<TResponse> {
    // CRITICAL: transactionId must be provided by FE
    if (!options.transactionId) {
      throw new Error('transactionId is required - must be provided by FE');
    }
    const transactionId = options.transactionId;
    const pointOfSale = options.pointOfSale || 'KR';

    const requestBody = {
      Sender: this.buildSender(),
      PointOfSale: pointOfSale,
      TransactionID: transactionId,
      ...body,
    };

    const bodyRaw = JSON.stringify(requestBody);
    const headers = buildHmacHeaders({
      tenant: this.config.tenant,
      secretBase64: this.config.secretBase64,
      bodyRaw,
    });

    const url = `${this.config.baseUrl}${endpoint}`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: bodyRaw,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        // Check for API-level errors
        if (data.ResultMessage?.Code && data.ResultMessage.Code !== '0') {
          throw new PolarHubError(
            data.ResultMessage.Message || 'Unknown API error',
            data.ResultMessage.Code,
            data.ResultMessage.MessageDetail
          );
        }

        return data as TResponse;

      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof PolarHubError) {
          throw error;
        }

        // Retry on network errors with exponential backoff
        if (attempt < this.config.retryCount) {
          await this.delay(Math.pow(2, attempt) * 1000);
          continue;
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // API ENDPOINTS
  // ============================================

  /**
   * Search for available flights
   * Endpoint: POST /hub/polarpie/v2/airShopping
   */
  async airShopping(query: AirShoppingQuery, options?: RequestOptions) {
    return this.request<{ Query: AirShoppingQuery }, AirShoppingRS>(
      '/hub/polarpie/v2/airShopping',
      { Query: query },
      options
    );
  }

  /**
   * Get detailed pricing for selected offer
   * Endpoint: POST /hub/polarpie/v2/offerPrice
   *
   * IMPORTANT: Use the SAME TransactionID from AirShopping
   */
  async offerPrice(query: OfferPriceQuery, options?: RequestOptions) {
    return this.request<{ Query: OfferPriceQuery }, OfferPriceRS>(
      '/hub/polarpie/v2/offerPrice',
      { Query: query },
      options
    );
  }

  /**
   * Create a new booking/order
   * Endpoint: POST /hub/polarpie/v2/order
   *
   * IMPORTANT: Use the SAME TransactionID from OfferPrice
   */
  async orderCreate(query: OrderCreateQuery, options?: RequestOptions) {
    return this.request<{ Query: OrderCreateQuery }, OrderViewRS>(
      '/hub/polarpie/v2/order',
      { Query: query },
      options
    );
  }

  /**
   * Retrieve existing order details
   * Endpoint: POST /hub/polarpie/v2/orderRetrieve
   *
   * CRITICAL: TransactionID must be provided by FE (middleware generation prohibited!)
   */
  async orderRetrieve(orderId: string, options: RequestOptions) {
    // transactionId must be provided by FE
    return this.request<{ Query: { OrderID: string } }, OrderViewRS>(
      '/hub/polarpie/v2/orderRetrieve',
      { Query: { OrderID: orderId } },
      options  // transactionId is received from FE
    );
  }

  /**
   * Cancel an existing order
   * Endpoint: POST /hub/polarpie/v2/orderCancel
   */
  async orderCancel(query: OrderCancelQuery, options?: RequestOptions) {
    return this.request<{ Query: OrderCancelQuery }, OrderCancelRS>(
      '/hub/polarpie/v2/orderCancel',
      { Query: query },
      options
    );
  }

  /**
   * Modify an existing order (add services, change passenger info)
   * Endpoint: POST /hub/polarpie/v2/orderChange
   */
  async orderChange(query: OrderChangeQuery, options?: RequestOptions) {
    return this.request<{ Query: OrderChangeQuery }, OrderViewRS>(
      '/hub/polarpie/v2/orderChange',
      { Query: query },
      options
    );
  }

  /**
   * Get available ancillary services for an order
   * Endpoint: POST /hub/polarpie/v2/serviceList
   */
  async serviceList(query: ServiceListQuery, options?: RequestOptions) {
    return this.request<{ Query: ServiceListQuery }, ServiceListRS>(
      '/hub/polarpie/v2/serviceList',
      { Query: query },
      options
    );
  }

  /**
   * Get seat map and availability
   * Endpoint: POST /hub/polarpie/v2/seatAvailability
   */
  async seatAvailability(query: SeatAvailabilityQuery, options?: RequestOptions) {
    return this.request<{ Query: SeatAvailabilityQuery }, SeatAvailabilityRS>(
      '/hub/polarpie/v2/seatAvailability',
      { Query: query },
      options
    );
  }

  /**
   * Search for alternative flights for rebooking
   * Endpoint: POST /hub/polarpie/v2/orderReshop
   */
  async orderReshop(query: OrderReshopQuery, options?: RequestOptions) {
    return this.request<{ Query: OrderReshopQuery }, OrderReshopRS>(
      '/hub/polarpie/v2/orderReshop',
      { Query: query },
      options
    );
  }

  /**
   * Get price quote for order changes
   * Endpoint: POST /hub/polarpie/v2/orderQuote
   */
  async orderQuote(query: OrderQuoteQuery, options?: RequestOptions) {
    return this.request<{ Query: OrderQuoteQuery }, OrderViewRS>(
      '/hub/polarpie/v2/orderQuote',
      { Query: query },
      options
    );
  }
}
```

## API Endpoint Summary

| Method | Path | Purpose |
|--------|------|---------|
| `airShopping` | `/hub/polarpie/v2/airShopping` | Flight search |
| `offerPrice` | `/hub/polarpie/v2/offerPrice` | Detailed pricing retrieval |
| `orderCreate` | `/hub/polarpie/v2/order` | Booking creation |
| `orderRetrieve` | `/hub/polarpie/v2/orderRetrieve` | Booking retrieval |
| `orderCancel` | `/hub/polarpie/v2/orderCancel` | Booking cancellation |
| `orderChange` | `/hub/polarpie/v2/orderChange` | Booking modification |
| `serviceList` | `/hub/polarpie/v2/serviceList` | Ancillary service list |
| `seatAvailability` | `/hub/polarpie/v2/seatAvailability` | Seat availability retrieval |
| `orderReshop` | `/hub/polarpie/v2/orderReshop` | Rebooking search |
| `orderQuote` | `/hub/polarpie/v2/orderQuote` | Change quote |

## Initialization Example

```typescript
const client = new PolarHubClient({
  baseUrl: process.env.POLARHUB_API_BASE_URL!,
  tenant: process.env.POLARHUB_TENANT_ID!,
  secretBase64: process.env.POLARHUB_API_SECRET!,
  timeout: 30000,
  retryCount: 3,
});
```

## Key Features

### 1. Exponential Backoff Retry
Waits 2^n seconds before retrying on network errors (default 3 attempts)

### 2. AbortController Timeout
Default 30-second timeout configured

### 3. Automatic Error Detection
Throws PolarHubError when `ResultMessage.Code !== '0'`

### 4. Error Flow to FE (Global Filter)

PolarHub errors flow automatically to the FE via the global exception filter:

```
PolarHubClient.request() → checkResultMessage() → throws PolarHubError
    → PolarHubExceptionFilter catches → FE response with ResultMessage
```

Controllers do not need manual error conversion. The `PolarHubExceptionFilter` registered in `main.ts` handles all `PolarHubError` instances globally.

---

## CRITICAL: Request/Response File Logging

**All PolarHub API calls must be logged to files.**

### Log File Path Format
```
logs/{transactionId}/{SEQ}.{ApiName}{RQ|RS}.json
```

### Example
```
logs/4ba5a0b50d2c45b3b5eb343b57ba8897/
├── 001.AirShoppingRQ.json
├── 002.AirShoppingRS.json
├── 003.OfferPriceRQ.json
├── 004.OfferPriceRS.json
├── 005.OrderCreateRQ.json
└── 006.OrderCreateRS.json
```

### RequestLogger Implementation Requirements

```typescript
// src/lib/polarhub/utils/request-logger.ts
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

export class RequestLogger {
  private readonly baseDir: string;
  private readonly enabled: boolean;

  constructor(options?: { baseDir?: string; enabled?: boolean }) {
    this.baseDir = options?.baseDir || 'logs';
    this.enabled = options?.enabled ?? process.env.NODE_ENV !== 'production';
  }

  // Extract API name: /hub/polarpie/v2/airShopping -> AirShopping
  private extractApiName(endpoint: string): string {
    const parts = endpoint.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  }

  // Get next sequence number
  private getNextSequence(transactionDir: string): number {
    if (!existsSync(transactionDir)) return 1;
    const files = readdirSync(transactionDir);
    const sequences = files
      .map(f => parseInt(f.match(/^(\d+)\./)?.[1] || '0', 10))
      .filter(n => n > 0);
    return sequences.length > 0 ? Math.max(...sequences) + 1 : 1;
  }

  async logRequest(transactionId: string, endpoint: string, data: unknown): Promise<void> {
    if (!this.enabled) return;
    const dir = join(this.baseDir, transactionId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const seq = this.getNextSequence(dir).toString().padStart(3, '0');
    const apiName = this.extractApiName(endpoint);
    writeFileSync(
      join(dir, `${seq}.${apiName}RQ.json`),
      JSON.stringify({ timestamp: new Date().toISOString(), data }, null, 2)
    );
  }

  async logResponse(transactionId: string, endpoint: string, data: unknown, duration?: number): Promise<void> {
    if (!this.enabled) return;
    const dir = join(this.baseDir, transactionId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const seq = this.getNextSequence(dir).toString().padStart(3, '0');
    const apiName = this.extractApiName(endpoint);
    writeFileSync(
      join(dir, `${seq}.${apiName}RS.json`),
      JSON.stringify({ timestamp: new Date().toISOString(), durationMs: duration, data }, null, 2)
    );
  }
}
```

### Usage in Client

```typescript
// Inside PolarHubClient class
private readonly requestLogger = getRequestLogger();

private async request<T>(...) {
  // Log before request
  await this.requestLogger.logRequest(transactionId, endpoint, requestBody);

  // API call...

  // Log after response
  await this.requestLogger.logResponse(transactionId, endpoint, data, duration);
}
```

### Log File JSON Structure

**Request (RQ):**
```json
{
  "timestamp": "2026-01-13T02:45:00.000Z",
  "transactionId": "4ba5a0b50d2c45b3b5eb343b57ba8897",
  "apiName": "AirShopping",
  "type": "RQ",
  "endpoint": "/hub/polarpie/v2/airShopping",
  "data": { ... }
}
```

**Response (RS):**
```json
{
  "timestamp": "2026-01-13T02:45:02.000Z",
  "transactionId": "4ba5a0b50d2c45b3b5eb343b57ba8897",
  "apiName": "AirShopping",
  "type": "RS",
  "endpoint": "/hub/polarpie/v2/airShopping",
  "durationMs": 2000,
  "data": { ... }
}
```
