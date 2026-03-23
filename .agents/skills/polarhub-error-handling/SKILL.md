---
name: polarhub-error-handling
description: PolarHub API error handling implementation. Includes error code mapping, BA special case handling, and ZodError handling.
---

# PolarHub Error Handling

Classes and utilities for PolarHub API error handling.

## CRITICAL: Success Codes

**PolarHub API success codes are `'0'` or `'00000'`.**

```typescript
const SUCCESS_CODES = ['0', '00000'];

function isSuccessResponse(resultMessage: ResultMessage): boolean {
  return SUCCESS_CODES.includes(resultMessage.Code);
}
```

## Error Code Mapping

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `0`, `00000` | 200 | **Success** |
| `50101` | 400 | Bad request |
| `50102` | 401 | Authentication failed |
| `50103` | 403 | Forbidden |
| `50201` | 404 | Not found |
| `50202` | 200 | **BA booking success (special case)** |
| `50301` | 409 | Conflict |
| `50401` | 408 | Timeout |
| `50501` | 500 | Internal server error |

## Full Implementation Code

```typescript
// lib/polarhub/utils/error-handler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

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
    }
  ) {
    super(message);
    this.name = 'PolarHubError';
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  if (error instanceof PolarHubError) {
    // Map known error codes to HTTP status
    const statusMap: Record<string, number> = {
      '50101': 400,  // Invalid request
      '50102': 401,  // Authentication failed
      '50103': 403,  // Forbidden
      '50201': 404,  // Not found
      '50202': 200,  // BA booking created (special case)
      '50301': 409,  // Conflict
      '50401': 408,  // Timeout
      '50501': 500,  // Internal server error
    };

    const status = statusMap[error.code] || 500;

    // Special case: BA booking success with error code
    if (error.code === '50202' && error.message.includes('booking has been created')) {
      return NextResponse.json(
        {
          success: true,
          warning: error.message,
          code: error.code,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.detail?.Errors || error.detail?.Warnings,
      },
      { status }
    );
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: 'Unknown error' },
    { status: 500 }
  );
}
```

## BA Airline Special Case

**CRITICAL**: British Airways (BA) may return error code `50202` even when a booking succeeds.

```typescript
// BA booking success determination
if (error.code === '50202' && error.message.includes('booking has been created')) {
  // Actually a success - handle as 200 OK
  return { success: true };
}
```

## Global Exception Filter (PolarHubExceptionFilter)

**CRITICAL**: `PolarHubExceptionFilter` is registered globally in `main.ts` and catches all `PolarHubError` exceptions.

### Registration

```typescript
// src/main.ts
import { PolarHubExceptionFilter } from './lib/polarhub/filters/polarhub-exception.filter';

app.useGlobalFilters(new PolarHubExceptionFilter());
```

### How It Works

The filter intercepts `PolarHubError` thrown by `PolarHubClient` and returns FE-compatible responses:

```
PolarHubClient → throws PolarHubError → PolarHubExceptionFilter → FE response
```

### FE Response Format

```json
{
  "statusCode": 400,
  "message": "Invalid request",
  "ResultMessage": {
    "Code": "50101",
    "Message": "Invalid request",
    "MessageDetail": {
      "Errors": [{ "Owner": "SQ", "Message": "No available flights" }]
    }
  }
}
```

### Controller Pattern

Controllers do NOT need manual try/catch for PolarHub errors:

```typescript
// ❌ WRONG - Manual toHttpException (no longer needed)
try {
  return await this.polarHubService.someApi(params);
} catch (error) {
  throw toHttpException(error);
}

// ✅ CORRECT - Let errors propagate to global filter
return await this.polarHubService.someApi(params);
```

## Usage Examples

### Usage in NestJS Controllers (Recommended)

With `PolarHubExceptionFilter` registered globally, NestJS controllers no longer need manual `try/catch` or `handleApiError`/`toHttpException` calls. Errors thrown by `PolarHubClient` are automatically caught and mapped to the correct HTTP response by the global filter.

```typescript
// src/lib/polarhub/controllers/air-shopping.controller.ts
// No try/catch needed - PolarHubExceptionFilter handles errors globally
@Post()
async search(@Body() request: AirShoppingRequestDto) {
  const response = await this.polarHubService.searchFlights(params);
  return { transactionId: request.transactionId, ...response };
}
```

> **Note**: The legacy `handleApiError()` function (using `NextResponse`) is retained for non-NestJS contexts only. For NestJS controllers, always rely on the global exception filter.

### Error Handling in the Client

```typescript
try {
  const result = await client.orderCreate(query);
} catch (error) {
  if (error instanceof PolarHubError) {
    switch (error.code) {
      case '50102':
        // Authentication failed - token refresh needed
        break;
      case '50201':
        // Offer expired
        break;
      default:
        // General error handling
    }
  }
}
```

## ResultMessage Verification

`ResultMessage.Code` must be checked in all API responses.

```typescript
const SUCCESS_CODES = ['0', '00000'];

const response = await fetch(url, { ... });
const data = await response.json();

// Check for success - '0' or '00000' indicates success
if (data.ResultMessage?.Code && !SUCCESS_CODES.includes(data.ResultMessage.Code)) {
  throw new PolarHubError(
    data.ResultMessage.Message || 'Unknown API error',
    data.ResultMessage.Code,
    data.ResultMessage.MessageDetail
  );
}
```

### Important Notes
- Checking only `Code === '0'` would incorrectly treat `'00000'` success responses as errors
- Both codes must always be checked
