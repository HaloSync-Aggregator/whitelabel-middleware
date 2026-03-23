---
name: polarhub-hmac-auth
description: PolarHub HMAC-SHA512 authentication implementation. Use when authentication headers need to be generated for API calls. Includes Digest calculation, Authorization header format, and Clock Skew rules.
---

# PolarHub HMAC-SHA512 Authentication

The PolarHub API uses **HMAC-SHA512** authentication. This skill defines how to generate authentication headers.

## Pass-through Principle (CRITICAL)

**If HMAC headers are sent from the FE, use them as-is; otherwise, the middleware generates them.**

```typescript
// Pass-through logic
if (FE sends x-date, Digest, and Authorization all three) {
  // Pass FE headers directly to PolarHub
  headers = feAuthHeaders;
} else {
  // Middleware generates from environment variables
  headers = generateAuthHeaders(tenantId, apiSecret, requestBody);
}
```

### Headers That Can Be Sent from FE

| Header | Description | Example |
|--------|-------------|---------|
| `x-date` | RFC1123 timestamp | `Thu, 16 Jan 2026 06:51:52 GMT` |
| `Digest` | SHA-512 hash | `SHA-512={base64_hash}` |
| `Authorization` | HMAC signature | `hmac username="..." ...` |

> **Note**: All three headers must be present for pass-through. If only some are present, they are ignored and new headers are generated.

## Authentication Header Structure

| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |
| `x-date` | RFC1123 format timestamp (e.g., `Tue, 26 Aug 2025 10:12:34 GMT`) |
| `Digest` | SHA-512 hash (`SHA-512={base64_hash}`) |
| `Authorization` | HMAC signature header |
| `X-Tide-Tenant-Id` | Tenant identifier (from `POLARHUB_TENANT_ID`) - always included |

## Clock Skew Constraint

Requests are only valid within **+-120 seconds** of the server time. NTP synchronization is required.

## Full Implementation Code

```typescript
// lib/polarhub/auth.ts
import crypto from 'crypto';

interface HmacAuthParams {
  tenant: string;
  secretBase64: string;
  bodyRaw: string;
}

interface HmacHeaders {
  'Content-Type': string;
  'Accept': string;
  'x-date': string;
  'Digest': string;
  'Authorization': string;
  'X-Tide-Tenant-Id': string;
}

/**
 * Generate SHA-512 hash and encode as Base64
 */
function sha512Base64(input: string): string {
  return crypto
    .createHash('sha512')
    .update(input, 'utf8')
    .digest('base64');
}

/**
 * Generate HMAC-SHA512 signature with Base64-encoded secret
 */
function hmacSha512Base64(message: string, secretBase64: string): string {
  const key = Buffer.from(secretBase64, 'base64');
  return crypto
    .createHmac('sha512', key)
    .update(message, 'utf8')
    .digest('base64');
}

/**
 * Build HMAC authentication headers for PolarHub API
 *
 * CRITICAL: The digest is computed over a JSON object containing:
 * - AgencyID: The tenant identifier
 * - Request: The raw request body as a string
 */
export function buildHmacHeaders({ tenant, secretBase64, bodyRaw }: HmacAuthParams): HmacHeaders {
  // Step 1: Generate x-date in RFC1123 format
  const xDate = new Date().toUTCString();

  // Step 2: Create target data for digest
  // IMPORTANT: Request is the raw body string, not parsed JSON
  const targetData = JSON.stringify({
    AgencyID: tenant,
    Request: bodyRaw
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
    'Accept': 'application/json',
    'x-date': xDate,
    'Digest': digest,
    'Authorization': authorization,
    'X-Tide-Tenant-Id': tenant,
  };
}
```

## Key Points

### 1. Digest Calculation Target

```typescript
// CORRECT: AgencyID + Request (raw body string)
const targetData = JSON.stringify({
  AgencyID: tenant,
  Request: bodyRaw  // String as-is
});
```

### 2. Signature String Format

```
x-date: {RFC1123 timestamp}
digest: SHA-512={base64_hash}
```

The newline character `\n` must be used.

### 3. Authorization Header Format

```
hmac username="{tenant}", algorithm="hmac-sha512", headers="x-date digest", signature="{base64_signature}"
```

## Usage Example

```typescript
const bodyRaw = JSON.stringify({
  Sender: { TravelAgency: { AgencyID: 'YOUR_TENANT_ID' } },
  Query: { ... }
});

const headers = buildHmacHeaders({
  tenant: 'YOUR_TENANT_ID',
  secretBase64: process.env.POLARHUB_API_SECRET!,
  bodyRaw,
});

const response = await fetch(url, {
  method: 'POST',
  headers,
  body: bodyRaw,
});
```

## Environment Variables

```env
POLARHUB_API_SECRET=your_base64_encoded_secret
```

The secret must be a **Base64-encoded string**.
