#!/usr/bin/env node

/**
 * PolarHub Implementation Validation Script
 *
 * This script validates that PolarHub API implementations follow the documented rules:
 * - API spec alignment
 * - HMAC authentication patterns
 * - Transaction ID management
 * - Airline-specific rules
 *
 * Usage: node scripts/validate-polarhub.mjs <file-paths>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

// Load validation rules
const rulesPath = path.join(__dirname, 'polarhub-validation-rules.json');
let rules;
try {
  rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
} catch (e) {
  console.error(`${colors.red}[ERROR]${colors.reset} Failed to load validation rules: ${e.message}`);
  process.exit(1);
}

// Validation results
const results = {
  errors: [],
  warnings: [],
  passed: [],
};

/**
 * Check if file is PolarHub-related
 */
function isPolarHubFile(filePath) {
  const polarHubPatterns = [
    /polarhub/i,
    /polar-hub/i,
    /hmac/i,
    /transaction-id/i,
    /air-shopping/i,
    /offer-price/i,
    /order-create/i,
    /order-retrieve/i,
    /order-cancel/i,
    /order-change/i,
    /service-list/i,
    /seat-availability/i,
    /lib\/polarhub/i,
    /api\/polarhub/i,
  ];

  return polarHubPatterns.some(pattern => pattern.test(filePath));
}

/**
 * Validate HMAC Authentication Implementation
 */
function validateHmacAuth(content, filePath) {
  const fileName = path.basename(filePath);

  // Only validate auth-related files
  if (!/(auth|hmac|client)/i.test(fileName)) return;

  const hmacRules = rules.hmacAuth;

  // Check for required functions
  for (const func of hmacRules.requiredFunctions) {
    if (content.includes(`function ${func}`) || content.includes(`const ${func}`) || content.includes(`${func}(`)) {
      // Check implementation details
      if (func === 'buildHmacHeaders') {
        // Verify digest calculation pattern
        if (!content.includes('AgencyID') || !content.includes('Request')) {
          results.warnings.push({
            file: filePath,
            rule: 'HMAC-DIGEST',
            message: `Digest should be calculated over { AgencyID, Request } JSON object`,
          });
        }

        // Verify signature string format
        if (!content.includes('x-date:') || !content.includes('digest:')) {
          results.warnings.push({
            file: filePath,
            rule: 'HMAC-SIGNATURE',
            message: `Signature string must include "x-date: {xDate}\\ndigest: {digest}"`,
          });
        }

        // Verify authorization header format
        if (content.includes('Authorization') && !content.includes('hmac username=')) {
          results.errors.push({
            file: filePath,
            rule: 'HMAC-AUTH-HEADER',
            message: `Authorization header must follow format: hmac username="{tenant}", algorithm="hmac-sha512", headers="x-date digest", signature="{sig}"`,
          });
        }
      }

      results.passed.push({
        file: filePath,
        rule: `HMAC-FUNC-${func}`,
        message: `Found required function: ${func}`,
      });
    }
  }

  // Check SHA-512 usage
  if (content.includes('sha512') || content.includes('SHA512') || content.includes('sha-512')) {
    if (!content.includes('createHash') && !content.includes('createHmac')) {
      results.warnings.push({
        file: filePath,
        rule: 'HMAC-CRYPTO',
        message: `Use crypto.createHash('sha512') and crypto.createHmac('sha512', key) for hashing`,
      });
    }
  }
}

/**
 * Validate Transaction ID Management
 */
function validateTransactionId(content, filePath) {
  const txnRules = rules.transactionId;

  // Check for Transaction ID generation
  if (content.includes('transactionId') || content.includes('TransactionID')) {
    // Check max length constraint
    if (content.includes('generateTransactionId') || content.includes('randomUUID')) {
      // Verify 32 character limit
      if (content.includes('replace(/-/g') || content.includes("replace('-'")) {
        results.passed.push({
          file: filePath,
          rule: 'TXN-LENGTH',
          message: `Transaction ID properly removes hyphens for 32-char limit`,
        });
      }
    }

    // Public repo rule: transactionId is passed through from FE.
    // Warn only when middleware appears to generate a new one.
    if (
      content.includes('transactionId') &&
      (content.includes('generateTransactionId') || content.includes('randomUUID'))
    ) {
      results.warnings.push({
        file: filePath,
        rule: 'TXN-PASSTHROUGH',
        message: 'transactionId should be passed through from FE, not generated in middleware',
      });
    }
  }
}

/**
 * Validate API Endpoint Implementation
 */
function validateApiEndpoints(content, filePath) {
  const endpoints = rules.apiEndpoints;

  for (const [name, config] of Object.entries(endpoints)) {
    if (content.includes(config.path)) {
      // Check HTTP method
      if (!content.includes('POST') && !content.includes('post')) {
        results.errors.push({
          file: filePath,
          rule: `API-${name.toUpperCase()}-METHOD`,
          message: `${name} endpoint must use POST method`,
        });
      }

      // Check required fields for specific endpoints
      if (config.requiredFields) {
        for (const field of config.requiredFields) {
          if (!content.includes(field)) {
            results.warnings.push({
              file: filePath,
              rule: `API-${name.toUpperCase()}-FIELD`,
              message: `${name} request should include "${field}" field`,
            });
          }
        }
      }

      results.passed.push({
        file: filePath,
        rule: `API-${name.toUpperCase()}`,
        message: `Found ${name} endpoint implementation`,
      });
    }
  }
}

/**
 * Validate Airline-Specific Rules
 */
function validateAirlineRules(content, filePath) {
  const airlineRules = rules.airlineRules;

  // Check Form of Payment handling
  if (content.includes('PaymentType') || content.includes('payment') || content.includes('FOP')) {
    // Check for TR (Agent Deposit only)
    if (content.includes("'TR'") || content.includes('"TR"')) {
      if (!content.includes('AG') && !content.includes('Ag') && !content.includes('AgentDeposit')) {
        results.warnings.push({
          file: filePath,
          rule: 'AIRLINE-TR-FOP',
          message: `TR (Scoot) only supports Agent Deposit payment - not BSP Cash or Card`,
        });
      }
    }

    // Check for credit card support
    if (content.includes('CardMethod') || content.includes("'CC'") || content.includes('"Card"')) {
      const cardSupportedAirlines = airlineRules.formOfPayment.cashAndCard;
      results.warnings.push({
        file: filePath,
        rule: 'AIRLINE-CARD-FOP',
        message: `Credit Card payment only supported by: ${cardSupportedAirlines.join(', ')}. Other airlines use BSP Cash only.`,
      });
    }
  }

  // Check BA special requirements
  if (content.includes("'BA'") || content.includes('"BA"')) {
    // Check agency contact requirements
    if (content.includes('ContactInfo') && !content.includes('PostalAddress')) {
      results.warnings.push({
        file: filePath,
        rule: 'AIRLINE-BA-CONTACT',
        message: `BA requires PostalAddress in agency contact info`,
      });
    }

    // Check error code 50202 handling
    if (content.includes('50202') || content.includes('error')) {
      if (!content.includes('booking has been created') && !content.includes('isSuccess')) {
        results.warnings.push({
          file: filePath,
          rule: 'AIRLINE-BA-ERROR',
          message: `BA returns error code 50202 for successful bookings - handle as success case`,
        });
      }
    }
  }

  // Check passport requirements
  if (content.includes('IdentityDoc') || content.includes('passport')) {
    const passportAirlines = ['HA', 'KE'];
    for (const airline of passportAirlines) {
      if (content.includes(`'${airline}'`) || content.includes(`"${airline}"`)) {
        if (!content.includes('IssuingCountryCode') || !content.includes('CitizenshipCountryCode')) {
          results.warnings.push({
            file: filePath,
            rule: `AIRLINE-${airline}-PASSPORT`,
            message: `${airline} requires IssuingCountryCode and CitizenshipCountryCode in passport info`,
          });
        }
      }
    }
  }

  // Check loyalty program support
  if (content.includes('LoyaltyProgram') || content.includes('FFN') || content.includes('loyaltyProgram')) {
    const ffnSupported = airlineRules.loyaltyProgram.supported;
    results.warnings.push({
      file: filePath,
      rule: 'AIRLINE-FFN',
      message: `Loyalty/FFN only supported by: ${ffnSupported.join(', ')}`,
    });
  }

  // Check KE trip type limitations
  if (content.includes("'KE'") || content.includes('"KE"')) {
    if (content.includes('multiCity') || content.includes('openJaw') || content.includes('multi-city')) {
      results.errors.push({
        file: filePath,
        rule: 'AIRLINE-KE-TRIP',
        message: `KE (Korean Air) does NOT support Multi-City or Open Jaw trips - only One-Way and Round-Trip`,
      });
    }
  }
}

/**
 * Validate Passenger Type Rules
 */
function validatePassengerRules(content, filePath) {
  if (content.includes('INF') || content.includes('infant')) {
    // Check infant count rule
    if (!content.includes('ADT') && !content.includes('adult')) {
      results.warnings.push({
        file: filePath,
        rule: 'PAX-INF-RULE',
        message: `Infant (INF) count must not exceed Adult (ADT) count`,
      });
    }
  }

  // Check passenger type codes
  const validPtc = ['ADT', 'CHD', 'INF'];
  const ptcMatch = content.match(/Ptc['":\s]+['"]?(\w+)['"]?/g);
  if (ptcMatch) {
    for (const match of ptcMatch) {
      const ptc = match.match(/['"](\w+)['"]/)?.[1];
      if (ptc && !validPtc.includes(ptc)) {
        results.errors.push({
          file: filePath,
          rule: 'PAX-PTC',
          message: `Invalid passenger type code: ${ptc}. Valid codes: ${validPtc.join(', ')}`,
        });
      }
    }
  }
}

/**
 * Validate Error Handling
 */
function validateErrorHandling(content, filePath) {
  if (content.includes('ResultMessage') || content.includes('error') || content.includes('Error')) {
    // Check for ResultMessage.Code handling
    if (content.includes('ResultMessage') && !content.includes('Code')) {
      results.warnings.push({
        file: filePath,
        rule: 'ERROR-CODE-CHECK',
        message: `Should check ResultMessage.Code (0 = success) for API responses`,
      });
    }

    // Check error code mapping
    const errorCodes = rules.errorCodes;
    for (const [code, info] of Object.entries(errorCodes)) {
      if (content.includes(`'${code}'`) || content.includes(`"${code}"`)) {
        if (info.isSuccess && !content.includes('success') && !content.includes('Success')) {
          results.warnings.push({
            file: filePath,
            rule: `ERROR-${code}`,
            message: `Error code ${code} (${info.meaning}) should be treated as success`,
          });
        }
      }
    }
  }
}

/**
 * Main validation function
 */
function validateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`${colors.dim}[SKIP]${colors.reset} File not found: ${filePath}`);
    return;
  }

  // Only validate TypeScript/JavaScript files
  if (!/\.(ts|js|tsx|jsx|mjs)$/.test(filePath)) {
    console.log(`${colors.dim}[SKIP]${colors.reset} Not a TS/JS file: ${filePath}`);
    return;
  }

  // Check if PolarHub-related
  if (!isPolarHubFile(filePath)) {
    console.log(`${colors.dim}[SKIP]${colors.reset} Not a PolarHub file: ${filePath}`);
    return;
  }

  console.log(`${colors.cyan}[VALIDATING]${colors.reset} ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf-8');

  // Run all validations
  validateHmacAuth(content, filePath);
  validateTransactionId(content, filePath);
  validateApiEndpoints(content, filePath);
  validateAirlineRules(content, filePath);
  validatePassengerRules(content, filePath);
  validateErrorHandling(content, filePath);
}

/**
 * Print validation results
 */
function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}PolarHub Implementation Validation Results${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  // Errors
  if (results.errors.length > 0) {
    console.log(`${colors.red}ERRORS (${results.errors.length}):${colors.reset}`);
    for (const err of results.errors) {
      console.log(`  ${colors.red}[${err.rule}]${colors.reset} ${err.file}`);
      console.log(`    ${err.message}`);
    }
    console.log();
  }

  // Warnings
  if (results.warnings.length > 0) {
    console.log(`${colors.yellow}WARNINGS (${results.warnings.length}):${colors.reset}`);
    for (const warn of results.warnings) {
      console.log(`  ${colors.yellow}[${warn.rule}]${colors.reset} ${warn.file}`);
      console.log(`    ${warn.message}`);
    }
    console.log();
  }

  // Summary
  console.log(`${colors.green}PASSED: ${results.passed.length}${colors.reset} | ${colors.yellow}WARNINGS: ${results.warnings.length}${colors.reset} | ${colors.red}ERRORS: ${results.errors.length}${colors.reset}`);

  // Exit with error if there are errors
  if (results.errors.length > 0) {
    console.log(`\n${colors.red}Validation failed with ${results.errors.length} error(s).${colors.reset}`);
    console.log(`${colors.dim}Please review the PolarHub API documentation and fix the issues.${colors.reset}`);
    process.exit(1);
  }

  if (results.warnings.length > 0) {
    console.log(`\n${colors.yellow}Validation completed with ${results.warnings.length} warning(s).${colors.reset}`);
    console.log(`${colors.dim}Consider reviewing the warnings to ensure compliance.${colors.reset}`);
  } else if (results.passed.length > 0) {
    console.log(`\n${colors.green}All validations passed!${colors.reset}`);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node validate-polarhub.mjs <file-paths>');
  console.log('Example: node validate-polarhub.mjs src/lib/polarhub/auth.ts');
  process.exit(0);
}

// Parse file paths (may be comma or space separated)
const filePaths = args.flatMap(arg => arg.split(/[,\s]+/).filter(Boolean));

console.log(`${colors.blue}PolarHub Validation Hook${colors.reset}`);
console.log(`${colors.dim}Validating ${filePaths.length} file(s)...${colors.reset}\n`);

for (const filePath of filePaths) {
  validateFile(filePath.trim());
}

printResults();
