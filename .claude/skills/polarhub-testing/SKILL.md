---
name: polarhub-testing
description: PolarHub API testing strategy. Use when writing Unit/Integration tests. Includes HMAC authentication, Transaction ID, and Zod schema test patterns.
---

# PolarHub Testing Strategy

Guide for writing PolarHub API tests.

## Unit Tests

### HMAC Authentication Tests

```typescript
// tests/unit/auth.test.ts
import { buildHmacHeaders } from '@/lib/polarhub/auth';

describe('HMAC Authentication', () => {
  const mockParams = {
    tenant: 'YOUR_TENANT_ID',
    secretBase64: 'dGVzdHNlY3JldA==', // 'testsecret' in base64
    bodyRaw: JSON.stringify({ test: 'data' }),
  };

  it('should generate valid headers', () => {
    const headers = buildHmacHeaders(mockParams);

    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Accept']).toBe('application/json');
    expect(headers['x-date']).toMatch(/^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/);
    expect(headers['Digest']).toMatch(/^SHA-512=.+$/);
    expect(headers['Authorization']).toMatch(
      /^hmac username="YOUR_TENANT_ID", algorithm="hmac-sha512", headers="x-date digest", signature=".+"$/
    );
    expect(headers['X-Tide-Tenant-Id']).toBe('YOUR_TENANT_ID');
  });

  it('should generate consistent digest for same input', () => {
    const headers1 = buildHmacHeaders(mockParams);
    const headers2 = buildHmacHeaders(mockParams);

    // Note: x-date will differ, so digest will differ
    // This test validates the algorithm is deterministic
    expect(headers1['Authorization']).toContain('hmac username="YOUR_TENANT_ID"');
    expect(headers2['Authorization']).toContain('hmac username="YOUR_TENANT_ID"');
  });

  it('should include AgencyID in digest calculation', () => {
    const headers = buildHmacHeaders(mockParams);

    // Digest should be based on { AgencyID, Request }
    expect(headers['Digest']).toBeTruthy();
    expect(headers['Digest'].startsWith('SHA-512=')).toBe(true);
  });
});
```

### Transaction ID Tests

**NOTE: generateTransactionId should only be used on the FE side.**
**Middleware code should not call this function; it should pass through the transactionId received from the FE.**

```typescript
// tests/unit/transaction-id.test.ts
// This test validates the behavior of the FE utility function
import { generateTransactionId, generateSecureTransactionId } from '@/lib/polarhub/utils/transaction-id';

describe('Transaction ID', () => {
  it('should generate 32-character ID', () => {
    const id = generateTransactionId();
    expect(id).toHaveLength(32);
  });

  it('should generate unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateTransactionId());
    }
    expect(ids.size).toBe(1000);
  });

  it('should contain valid hex characters', () => {
    const id = generateTransactionId();
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should generate secure ID using crypto', () => {
    const id = generateSecureTransactionId();
    expect(id).toHaveLength(32);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });
});
```

### Zod Schema Tests

```typescript
// tests/unit/schemas.test.ts
import { AirShoppingRequestSchema } from '@/lib/polarhub/schemas/air-shopping.schema';

describe('AirShoppingRequestSchema', () => {
  it('should validate valid request', () => {
    const validRequest = {
      originDest: [
        { origin: 'ICN', destination: 'SIN', departureDate: '2025-09-10' },
      ],
      passengers: [{ type: 'ADT', count: 2 }],
      cabin: 'Y',
    };

    expect(() => AirShoppingRequestSchema.parse(validRequest)).not.toThrow();
  });

  it('should reject invalid IATA code', () => {
    const invalidRequest = {
      originDest: [
        { origin: 'icn', destination: 'SIN', departureDate: '2025-09-10' }, // lowercase
      ],
      passengers: [{ type: 'ADT', count: 1 }],
    };

    expect(() => AirShoppingRequestSchema.parse(invalidRequest)).toThrow();
  });

  it('should reject if infants exceed adults', () => {
    const invalidRequest = {
      originDest: [
        { origin: 'ICN', destination: 'SIN', departureDate: '2025-09-10' },
      ],
      passengers: [
        { type: 'ADT', count: 1 },
        { type: 'INF', count: 2 }, // More infants than adults
      ],
    };

    expect(() => AirShoppingRequestSchema.parse(invalidRequest)).toThrow(
      'Number of infants cannot exceed number of adults'
    );
  });

  it('should reject if total passengers exceed 9', () => {
    const invalidRequest = {
      originDest: [
        { origin: 'ICN', destination: 'SIN', departureDate: '2025-09-10' },
      ],
      passengers: [
        { type: 'ADT', count: 5 },
        { type: 'CHD', count: 5 }, // Total: 10
      ],
    };

    expect(() => AirShoppingRequestSchema.parse(invalidRequest)).toThrow(
      'Total passengers cannot exceed 9'
    );
  });
});
```

## Integration Tests

### AirShopping Integration Test

```typescript
// tests/integration/air-shopping.test.ts
import { PolarHubClient } from '@/lib/polarhub/client';

describe('AirShopping Integration', () => {
  const client = new PolarHubClient({
    baseUrl: process.env.POLARHUB_API_BASE_URL!,
    tenant: process.env.POLARHUB_TENANT_ID!,
    secretBase64: process.env.POLARHUB_API_SECRET!,
  });

  it('should search for round-trip flights', async () => {
    const response = await client.airShopping({
      OriginDestList: [
        { OriginCode: 'ICN', DestCode: 'SIN', DepartureDate: '2025-09-10' },
        { OriginCode: 'SIN', DestCode: 'ICN', DepartureDate: '2025-10-10' },
      ],
      PaxList: [
        { PaxID: 'PAX1', Ptc: 'ADT', LoyaltyProgramAccount: [] },
      ],
      Cabin: 'Y',
      Criteria: {
        Direct: false,
        AirlinePreference: { AirlineID: ['SQ'] },
      },
    });

    expect(response.ResultMessage.Code).toBe('0');
    expect(response.Offer).toBeDefined();
    expect(response.Offer!.length).toBeGreaterThan(0);
  }, 30000); // 30-second timeout

  it('should return offers with price info', async () => {
    const response = await client.airShopping({
      OriginDestList: [
        { OriginCode: 'ICN', DestCode: 'NRT', DepartureDate: '2025-09-15' },
      ],
      PaxList: [
        { PaxID: 'PAX1', Ptc: 'ADT', LoyaltyProgramAccount: [] },
      ],
    });

    const offer = response.Offer?.[0];
    expect(offer).toBeDefined();
    expect(offer!.TotalPrice.TotalAmount.Amount).toBeGreaterThan(0);
    expect(offer!.TotalPrice.TotalAmount.CurCode).toBeTruthy();
  }, 30000);
});
```

### E2E Booking Flow Test

**NOTE: Integration tests use generateTransactionId().**
**In production, the FE generates the transactionId and sends it to the middleware.**
**This test simulates the FE role to verify the entire flow.**

```typescript
// tests/integration/booking-flow.test.ts
import { PolarHubClient } from '@/lib/polarhub/client';
import { generateTransactionId } from '@/lib/polarhub/utils/transaction-id';

describe('Booking Flow Integration', () => {
  const client = new PolarHubClient({
    baseUrl: process.env.POLARHUB_API_BASE_URL!,
    tenant: process.env.POLARHUB_TENANT_ID!,
    secretBase64: process.env.POLARHUB_API_SECRET!,
  });

  it('should complete search -> price -> book flow', async () => {
    // 1. AirShopping - Simulating FE role
    const transactionId = generateTransactionId();  // Simulating FE-side generation
    const searchResponse = await client.airShopping(
      {
        OriginDestList: [
          { OriginCode: 'ICN', DestCode: 'SIN', DepartureDate: '2025-09-10' },
        ],
        PaxList: [{ PaxID: 'PAX1', Ptc: 'ADT', LoyaltyProgramAccount: [] }],
      },
      { transactionId }
    );

    expect(searchResponse.ResultMessage.Code).toBe('0');
    const offer = searchResponse.Offer?.[0];
    expect(offer).toBeDefined();

    // 2. OfferPrice (same transactionId)
    const priceResponse = await client.offerPrice(
      {
        Offer: [{
          ResponseID: offer!.ResponseID,
          OfferID: offer!.OfferID,
          Owner: offer!.Owner,
          OfferItemIDs: offer!.OfferItem.map(i => i.OfferItemID),
        }],
      },
      { transactionId }
    );

    expect(priceResponse.ResultMessage.Code).toBe('0');

    // Note: OrderCreate triggers actual payment, so use caution in test environments
  }, 60000);
});
```

## Test Configuration

### Jest Configuration

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFilesAfterEnv: ['./tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### Environment Variable Setup

```typescript
// tests/setup.ts
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Required environment variable validation
const requiredEnvVars = [
  'POLARHUB_API_BASE_URL',
  'POLARHUB_TENANT_ID',
  'POLARHUB_API_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

## Mock Data

```typescript
// tests/mocks/responses.ts
export const mockAirShoppingResponse = {
  ResultMessage: { Code: '0', Message: 'Success' },
  TransactionID: 'abc123def456789012345678901234',
  Offer: [
    {
      OfferID: 'OFFER1',
      ResponseID: 'RESP1',
      Owner: 'SQ',
      TotalPrice: {
        TotalAmount: { Amount: 500000, CurCode: 'KRW' },
        TotalBaseAmount: { Amount: 450000, CurCode: 'KRW' },
        TotalTaxAmount: { Amount: 50000, CurCode: 'KRW' },
      },
      OfferItem: [
        { OfferItemID: 'ITEM1', Mandatory: true },
      ],
    },
  ],
};
```

## PolarHubExceptionFilter Tests

### Unit Test

```typescript
// tests/unit/polarhub-exception-filter.test.ts
import { PolarHubExceptionFilter } from '@/lib/polarhub/filters/polarhub-exception.filter';
import { PolarHubError } from '@/lib/polarhub/utils/error-handler';
import { ArgumentsHost } from '@nestjs/common';

describe('PolarHubExceptionFilter', () => {
  let filter: PolarHubExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new PolarHubExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({}),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should return 400 for error code 50101', () => {
    const error = new PolarHubError('Invalid request', '50101', {
      Errors: [{ Owner: 'SQ', Message: 'No flights' }],
    });

    filter.catch(error, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Invalid request',
      ResultMessage: {
        Code: '50101',
        Message: 'Invalid request',
        MessageDetail: { Errors: [{ Owner: 'SQ', Message: 'No flights' }] },
      },
    });
  });

  it('should return 200 for BA 50202 booking success', () => {
    const error = new PolarHubError(
      'booking has been created with warnings',
      '50202',
    );

    filter.catch(error, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 200,
        ResultMessage: expect.objectContaining({ Code: '50202' }),
      }),
    );
  });

  it('should return 500 for unknown error codes', () => {
    const error = new PolarHubError('Unknown error', '99999');

    filter.catch(error, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(500);
  });
});
```
