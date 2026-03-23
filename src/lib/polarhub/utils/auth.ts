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
