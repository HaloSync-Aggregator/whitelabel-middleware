#!/usr/bin/env node
/**
 * PolarHub Test Runner
 *
 * Converts PolarHub test cases (PascalCase) to Middleware format (camelCase)
 * and runs them against the local server.
 *
 * Usage:
 *   node scripts/test-runner.mjs                     # Run all tests
 *   node scripts/test-runner.mjs --category 1.immediate-ticketing  # Run specific category
 *   node scripts/test-runner.mjs --airline AA        # Run specific airline
 *   node scripts/test-runner.mjs --dry-run           # Show transformed requests without calling API
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, basename, dirname } from 'path';
import { existsSync } from 'fs';

// ============================================
// Configuration
// ============================================

const CONFIG = {
  testCaseDir: process.env.POLARHUB_TEST_CASE_DIR || './polarhub-test-case/172-case',
  baseUrl: 'http://localhost:3000',
  outputDir: './test-results',
  endpoints: {
    AirShopping: '/middleware/polarhub/air-shopping',
    OfferPrice: '/middleware/polarhub/offer-price',
    OrderCreate: '/middleware/polarhub/order',
    OrderRetrieve: '/middleware/polarhub/order/retrieve',
    OrderCancel: '/middleware/polarhub/order/cancel',
    OrderChange: '/middleware/polarhub/order-change',
    ServiceList: '/middleware/polarhub/service-list',
    SeatAvailability: '/middleware/polarhub/seat-availability',
    OrderReshop: '/middleware/polarhub/order-reshop',
    OrderQuote: '/middleware/polarhub/order-quote',
  },
};

function ensureTestCaseDirExists() {
  if (existsSync(CONFIG.testCaseDir)) {
    return;
  }

  console.error(
    [
      `Test case directory not found: ${CONFIG.testCaseDir}`,
      'This public repository does not bundle PolarHub fixture packs.',
      'Provide a fixture directory with POLARHUB_TEST_CASE_DIR or skip this helper script.',
    ].join('\n'),
  );
  process.exit(1);
}

// ============================================
// PascalCase → camelCase Transformer
// ============================================

function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function transformKey(key) {
  // Special mappings
  const keyMappings = {
    'AgencyID': 'agencyId',
    'SalesBranchID': 'siteCode',
    'ContactInfoRefID': 'contactInfoRefId',
    'TransactionID': 'transactionId',
    'OriginDestList': 'originDestList',
    'OriginCode': 'origin',
    'DestCode': 'destination',
    'DepartureDate': 'departureDate',
    'PaxList': 'paxList',
    'PaxID': 'paxId',
    'Ptc': 'ptc',
    'OfferID': 'offerId',
    'OfferItems': 'offerItems',
    'OfferItemID': 'offerItemId',
    'PaxRefID': 'paxRefId',
    'ResponseID': 'responseId',
    'OrderID': 'orderId',
    'Owner': 'owner',
    'PaymentList': 'paymentList',
    'ContactInfoList': 'contactInfoList',
    'ContactInfoID': 'contactInfoId',
    'EmailAddress': 'emailAddress',
    'PhoneNumber': 'phoneNumber',
    'CountryDialingCode': 'countryDialingCode',
    'IdentityDoc': 'identityDoc',
    'IdentityDocumentNumber': 'identityDocId',
    'IdentityDocumentType': 'identityDocType',
    'IssuingCountryCode': 'issuingCountryCode',
    'CitizenshipCountryCode': 'citizenshipCountryCode',
    'ResidenceCountryCode': 'residenceCountryCode',
    'ExpiryDate': 'expiryDate',
    'Birthdate': 'birthdate',
    'GivenName': 'givenName',
    'Surname': 'surname',
    'NameTitle': 'nameTitle',
    'Gender': 'gender',
    'MiddleName': 'middleName',
    'Individual': 'individual',
    'CurCode': 'currencyCode',
    'Amount': 'amount',
    'Type': 'type',
    'OrderItemID': 'orderItemId',
    'Label': 'label',
    'PostalAddress': 'postalAddress',
    'Street': 'street',
    'PostalCode': 'postalCode',
    'CityName': 'cityName',
    'CountryCode': 'countryCode',
    'ContactRefusedInd': 'contactRefusedInd',
    'LoyaltyProgramAccount': 'loyaltyProgramAccount',
    'AccountNumber': 'accountNumber',
    'ProgramCode': 'programCode',
    'ProgramName': 'programName',
    'Cabin': 'cabin',
    'Criteria': 'criteria',
    'Direct': 'direct',
    'AirlinePreference': 'airlinePreference',
    'AirlineID': 'airlineId',
    'ProgramCriteria': 'programCriteria',
    'PromotionCriteria': 'promotionCriteria',
    'SpecialFareCriteria': 'specialFareCriteria',
    'UpdateOrder': 'updateOrder',
    'ReshopOrder': 'reshopOrder',
    'CancelOrderRefID': 'cancelOrderRefId',
    'ActionContext': 'actionContext',
    'RefundQuoteID': 'refundQuoteId',
  };

  return keyMappings[key] || toCamelCase(key);
}

function transformValue(key, value) {
  // Transform Gender values
  if (key === 'Gender' || key === 'gender') {
    if (value === 'MALE') return 'Male';
    if (value === 'FEMALE') return 'Female';
  }
  return value;
}

function transformObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => transformObject(item));
  }
  if (typeof obj !== 'object') return obj;

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = transformKey(key);
    let newValue = transformValue(key, value);

    if (typeof newValue === 'object' && newValue !== null) {
      newValue = transformObject(newValue);
    }

    result[newKey] = newValue;
  }
  return result;
}

// ============================================
// Request Transformers by API Type
// ============================================

function transformAirShoppingRQ(polarHubRQ) {
  const query = polarHubRQ.Query;

  // Count passengers by type
  const paxCounts = {};
  for (const pax of query.PaxList) {
    const ptc = pax.Ptc === 'CNN' ? 'CHD' : pax.Ptc;
    paxCounts[ptc] = (paxCounts[ptc] || 0) + 1;
  }

  const passengers = Object.entries(paxCounts).map(([type, count]) => ({
    type,
    count,
  }));

  return {
    transactionId: polarHubRQ.TransactionID,
    sender: polarHubRQ.Sender ? {
      travelAgency: {
        agencyId: polarHubRQ.Sender.TravelAgency.AgencyID,
        siteCode: polarHubRQ.Sender.TravelAgency.SalesBranchID,
        contactInfoRefId: polarHubRQ.Sender.TravelAgency.ContactInfoRefID,
      },
    } : undefined,
    originDestList: query.OriginDestList.map(od => ({
      origin: od.OriginCode,
      destination: od.DestCode,
      departureDate: od.DepartureDate,
    })),
    passengers,
    cabin: query.Cabin,
    criteria: query.Criteria ? {
      direct: query.Criteria.Direct,
      airlinePreference: query.Criteria.AirlinePreference?.AirlineID ? {
        airlineId: query.Criteria.AirlinePreference.AirlineID,
      } : undefined,
    } : undefined,
  };
}

function transformOfferPriceRQ(polarHubRQ) {
  const query = polarHubRQ.Query;

  return {
    transactionId: polarHubRQ.TransactionID,
    sender: polarHubRQ.Sender ? {
      travelAgency: {
        agencyId: polarHubRQ.Sender.TravelAgency.AgencyID,
        siteCode: polarHubRQ.Sender.TravelAgency.SalesBranchID,
        contactInfoRefId: polarHubRQ.Sender.TravelAgency.ContactInfoRefID,
      },
    } : undefined,
    offers: query.Offers?.map(offer => ({
      responseId: offer.ResponseID,
      offerId: offer.OfferID,
      owner: offer.Owner,
      offerItems: offer.OfferItems?.map(item => ({
        offerItemId: item.OfferItemID,
        paxRefId: item.PaxRefID,
      })) || [],
    })) || [],
    paxList: query.PaxList?.map(pax => ({
      paxId: pax.PaxID,
      ptc: pax.Ptc === 'CNN' ? 'CHD' : pax.Ptc,
      birthDate: pax.Birthdate,
    })) || [],
  };
}

function transformOrderCreateRQ(polarHubRQ) {
  const query = polarHubRQ.Query;

  return {
    transactionId: polarHubRQ.TransactionID,
    sender: polarHubRQ.Sender ? {
      travelAgency: {
        agencyId: polarHubRQ.Sender.TravelAgency.AgencyID,
        contactInfoRefId: polarHubRQ.Sender.TravelAgency.ContactInfoRefID,
      },
    } : undefined,
    orders: query.Order?.map(order => ({
      responseId: order.ResponseID,
      offerId: order.OfferID,
      owner: order.Owner,
      offerItems: order.OfferItems?.map(item => ({
        offerItemId: item.OfferItemID,
        paxRefId: item.PaxRefID,
      })) || [],
    })) || [],
    paxList: query.PaxList?.map(pax => ({
      paxId: pax.PaxID,
      ptc: pax.Ptc === 'CNN' ? 'CHD' : pax.Ptc,
      gender: pax.Gender === 'MALE' ? 'Male' : pax.Gender === 'FEMALE' ? 'Female' : pax.Gender,
      contactInfoRefId: pax.ContactInfoRefID,
      individual: pax.Individual ? {
        nameTitle: pax.Individual.NameTitle,
        givenName: pax.Individual.GivenName,
        surname: pax.Individual.Surname,
        birthdate: pax.Individual.Birthdate,
        gender: pax.Individual.Gender === 'MALE' ? 'Male' : pax.Individual.Gender === 'FEMALE' ? 'Female' : pax.Individual.Gender,
      } : undefined,
      identityDoc: pax.IdentityDoc?.map(doc => ({
        identityDocType: doc.IdentityDocumentType,
        identityDocId: doc.IdentityDocumentNumber,
        expiryDate: doc.ExpiryDate,
        issuingCountryCode: doc.IssuingCountryCode,
        citizenshipCountryCode: doc.CitizenshipCountryCode,
        residenceCountryCode: doc.ResidenceCountryCode,
        gender: doc.Gender === 'MALE' ? 'Male' : doc.Gender === 'FEMALE' ? 'Female' : doc.Gender,
      })),
    })) || [],
    contactInfoList: query.ContactInfoList?.map(ci => ({
      contactInfoId: ci.ContactInfoID,
      emailAddress: ci.EmailAddress,
      phone: ci.Phone?.map(p => ({
        label: p.Label,
        countryDialingCode: p.CountryDialingCode,
        phoneNumber: String(p.PhoneNumber),
      })),
      postalAddress: ci.PostalAddress?.length > 0 ? ci.PostalAddress.map(pa => ({
        street: pa.Street,
        postalCode: pa.PostalCode,
        cityName: pa.CityName,
        countryCode: pa.CountryCode,
      })) : undefined,
      contactRefusedInd: ci.ContactRefusedInd,
    })) || [],
    paymentList: query.PaymentList?.map(p => ({
      paymentMethod: {
        cash: p.Type === 'Cash' ? { cashPaymentInd: true } : undefined,
      },
      amount: {
        currencyCode: p.CurCode,
        amount: p.Amount,
      },
    })) || [],
  };
}

function transformOrderRetrieveRQ(polarHubRQ) {
  return {
    transactionId: polarHubRQ.TransactionID,
    sender: polarHubRQ.Sender ? {
      travelAgency: {
        agencyId: polarHubRQ.Sender.TravelAgency.AgencyID,
        contactInfoRefId: polarHubRQ.Sender.TravelAgency.ContactInfoRefID,
      },
    } : undefined,
    orderId: polarHubRQ.Query.OrderID,
  };
}

function transformOrderCancelRQ(polarHubRQ) {
  return {
    transactionId: polarHubRQ.TransactionID,
    sender: polarHubRQ.Sender ? {
      travelAgency: {
        agencyId: polarHubRQ.Sender.TravelAgency.AgencyID,
        contactInfoRefId: polarHubRQ.Sender.TravelAgency.ContactInfoRefID,
      },
    } : undefined,
    orderId: polarHubRQ.Query.OrderID,
    refundQuoteId: polarHubRQ.Query.RefundQuoteID,
  };
}

function transformOrderReshopRQ(polarHubRQ) {
  const query = polarHubRQ.Query;

  return {
    transactionId: polarHubRQ.TransactionID,
    sender: polarHubRQ.Sender ? {
      travelAgency: {
        agencyId: polarHubRQ.Sender.TravelAgency.AgencyID,
        contactInfoRefId: polarHubRQ.Sender.TravelAgency.ContactInfoRefID,
      },
    } : undefined,
    orderId: query.OrderID,
    actionContext: query.ActionContext,
    updateOrder: query.UpdateOrder ? {
      cancelOrderRefId: query.UpdateOrder.CancelOrderRefID,
      reshopOrder: query.UpdateOrder.ReshopOrder ? transformObject(query.UpdateOrder.ReshopOrder) : undefined,
    } : {},
  };
}

// ============================================
// API Type Detection
// ============================================

function detectApiType(filename) {
  const name = basename(filename, '.json');
  if (name.includes('AirShopping')) return 'AirShopping';
  if (name.includes('OfferPrice')) return 'OfferPrice';
  if (name.includes('OrderCreate')) return 'OrderCreate';
  if (name.includes('OrderRetrieve')) return 'OrderRetrieve';
  if (name.includes('OrderCancel')) return 'OrderCancel';
  if (name.includes('OrderChange')) return 'OrderChange';
  if (name.includes('ServiceList')) return 'ServiceList';
  if (name.includes('SeatAvailability')) return 'SeatAvailability';
  if (name.includes('OrderReshop')) return 'OrderReshop';
  if (name.includes('OrderQuote')) return 'OrderQuote';
  return null;
}

function transformRequest(apiType, polarHubRQ) {
  switch (apiType) {
    case 'AirShopping': return transformAirShoppingRQ(polarHubRQ);
    case 'OfferPrice': return transformOfferPriceRQ(polarHubRQ);
    case 'OrderCreate': return transformOrderCreateRQ(polarHubRQ);
    case 'OrderRetrieve': return transformOrderRetrieveRQ(polarHubRQ);
    case 'OrderCancel': return transformOrderCancelRQ(polarHubRQ);
    case 'OrderReshop': return transformOrderReshopRQ(polarHubRQ);
    default: return transformObject(polarHubRQ);
  }
}

// ============================================
// Test Runner
// ============================================

async function findTestCases(baseDir, options = {}) {
  const testCases = [];

  async function scanDir(dir, path = []) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;

      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Check category filter
        if (options.category && path.length === 0 && !entry.name.includes(options.category)) {
          continue;
        }
        // Check airline filter
        if (options.airline && path.length === 1 && entry.name !== options.airline) {
          continue;
        }
        await scanDir(fullPath, [...path, entry.name]);
      } else if (entry.name.endsWith('RQ.json')) {
        testCases.push({
          path: fullPath,
          category: path[0] || '',
          airline: path[1] || '',
          scenario: path[2] || '',
          filename: entry.name,
        });
      }
    }
  }

  await scanDir(baseDir);
  return testCases;
}

async function runTest(testCase, options = {}) {
  const { path: filePath, category, airline, scenario, filename } = testCase;
  const apiType = detectApiType(filename);

  if (!apiType) {
    return { success: false, error: 'Unknown API type', testCase };
  }

  const endpoint = CONFIG.endpoints[apiType];
  if (!endpoint) {
    return { success: false, error: `No endpoint for ${apiType}`, testCase };
  }

  try {
    // Read PolarHub request (handle files with timestamp header)
    let content = await readFile(filePath, 'utf-8');
    // Remove timestamp header if present (e.g., "2025-12-17 05:57:03 (UTC)\n")
    const jsonStart = content.indexOf('{');
    if (jsonStart > 0) {
      content = content.slice(jsonStart);
    }
    const polarHubRQ = JSON.parse(content);

    // Transform to middleware format
    const middlewareRQ = transformRequest(apiType, polarHubRQ);

    if (options.dryRun) {
      return {
        success: true,
        apiType,
        testCase,
        request: middlewareRQ,
        dryRun: true,
      };
    }

    // Call middleware API
    const url = `${CONFIG.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(middlewareRQ),
    });

    const responseData = await response.json();

    return {
      success: response.ok,
      apiType,
      testCase,
      request: middlewareRQ,
      response: responseData,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      apiType,
      testCase,
      error: error.message,
    };
  }
}

async function saveResults(results, outputDir) {
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = join(outputDir, `test-results-${timestamp}.json`);

  await writeFile(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

// ============================================
// CLI
// ============================================

async function main() {
  ensureTestCaseDirExists();

  const args = process.argv.slice(2);
  const options = {
    category: null,
    airline: null,
    dryRun: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--category' && args[i + 1]) {
      options.category = args[++i];
    } else if (args[i] === '--airline' && args[i + 1]) {
      options.airline = args[++i];
    } else if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      options.verbose = true;
    }
  }

  console.log('PolarHub Test Runner');
  console.log('====================\n');

  if (options.category) console.log(`Category filter: ${options.category}`);
  if (options.airline) console.log(`Airline filter: ${options.airline}`);
  if (options.dryRun) console.log('Mode: Dry run (no API calls)\n');

  // Find test cases
  const testCases = await findTestCases(CONFIG.testCaseDir, options);
  console.log(`Found ${testCases.length} test cases\n`);

  if (testCases.length === 0) {
    console.log('No test cases found. Check your filters.');
    return;
  }

  // Run tests
  const results = {
    timestamp: new Date().toISOString(),
    options,
    summary: { total: 0, passed: 0, failed: 0 },
    tests: [],
  };

  for (const testCase of testCases) {
    const result = await runTest(testCase, options);
    results.tests.push(result);
    results.summary.total++;

    if (result.success) {
      results.summary.passed++;
      console.log(`✅ ${testCase.airline}/${testCase.scenario}/${testCase.filename}`);
    } else {
      results.summary.failed++;
      console.log(`❌ ${testCase.airline}/${testCase.scenario}/${testCase.filename}`);
      if (options.verbose && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }

    if (options.verbose && result.request) {
      console.log(`   Request: ${JSON.stringify(result.request).slice(0, 100)}...`);
    }
  }

  // Summary
  console.log('\n====================');
  console.log(`Total: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);

  // Save results
  if (!options.dryRun) {
    await saveResults(results, CONFIG.outputDir);
  }
}

main().catch(console.error);
