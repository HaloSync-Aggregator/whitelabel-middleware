---
name: polarhub-best-practices
description: "PolarHub API implementation best practices. Covers Transaction ID lifecycle, error handling, passenger data, payment processing, and performance optimization guide."
---

# PolarHub Implementation Best Practices

Best practices to follow when implementing the PolarHub API.

---

## Middleware Core Principles (MOST CRITICAL)

**The middleware only transforms data received from FE into PolarHub API format and does not arbitrarily add data.**

### Principle 1: No Hardcoding
```typescript
// WRONG - No hardcoding
contactInfoList.push({
  ContactInfoID: 'CTC_TA1',
  EmailAddress: ['agency@example.com'],  // Hardcoded!
});

// CORRECT - FE data pass-through
const contactInfoList = params.contactInfoList.map((ci) => ({
  ContactInfoID: ci.contactInfoId,
  EmailAddress: [ci.emailAddress],  // Data received from FE
}));
```

### Principle 2: Only Perform Data Format Transformation
| FE (camelCase) | PolarHub (PascalCase) | Transformation Type |
|----------------|----------------------|---------------------|
| `emailAddress: "user@example.com"` | `EmailAddress: ["user@example.com"]` | string to string[] |
| `identityDocType: "PT"` | `IdentityDocumentType: "PT"` | Field name transformation |
| `paxRefId: ["PAX1"]` | `PaxRefID: ["PAX1"]` | Field name transformation |

### Principle 3: Required Data Comes from FE (with some exceptions)
- Business data such as passenger information and contact information must be **provided by FE**
- Include required data in Swagger examples to guide FE developers
- Middleware code should have no hardcoded values beyond environment configuration
- **Exception**: `sender.travelAgency.contactInfoRefId` is **auto-injected** from environment variables (see Principle 6 below)

### Principle 4: ContactInfo Pass-through (CRITICAL)
**Phone numbers, emails, and other contact information must be passed through exactly as received from FE.**

```typescript
// WRONG - Data modification in middleware is prohibited!
Phone: [{
  CountryDialingCode: ci.phone.countryDialingCode || '82',  // Fallback prohibited
  PhoneNumber: `+${ci.phone.countryDialingCode}${ci.phone.phoneNumber}`,  // Concatenation prohibited!
}],

// CORRECT - FE data pass-through
Phone: [{
  ...(ci.phone.label && { Label: ci.phone.label }),  // Provided by FE
  CountryDialingCode: ci.phone.countryDialingCode,   // Pass through as-is
  PhoneNumber: ci.phone.phoneNumber,                  // Pass through as-is
}],
```

**Prohibited actions**:
- Do not prefix country code onto phoneNumber
- Do not process data with `.replace()` or similar methods
- Do not set default (fallback) values (FE must send required values)
- Do not hardcode data values for Label, CountryCode, etc.

### Principle 5: No Hardcoding of Data Values (CRITICAL - Added 2026-01-15)

**Business data must not be embedded directly in the code.**

| Item | Prohibited | Correct approach |
|------|-----------|-----------------|
| Country code | `CitizenshipCountryCode: 'KR'` | `pax.citizenshipCountryCode` (Sent from FE) |
| Phone Label | `Label: 'Mobile'` | `ci.phone.label` (Sent from FE) |
| Residence country | `ResidenceCountryCode: 'KR'` | `pax.residenceCountryCode` (Sent from FE) |

```typescript
// WRONG - Hardcoding defaults when IdentityDoc is absent
: {
    CitizenshipCountryCode: 'KR',  // Hardcoding prohibited!
    ResidenceCountryCode: 'KR',    // Hardcoding prohibited!
  }

// CORRECT - Receive from FE and pass through
: {
    ...(pax.citizenshipCountryCode && {
      CitizenshipCountryCode: pax.citizenshipCountryCode,
    }),
    ...(pax.residenceCountryCode && {
      ResidenceCountryCode: pax.residenceCountryCode,
    }),
  }
```

**Add fields to the DTO instead of hardcoding**:
```typescript
// 1. Add optional fields to the DTO
export class PaxDetailDto {
  @ApiPropertyOptional({ description: 'Citizenship (required if no identityDoc)' })
  @IsOptional()
  @IsString()
  citizenshipCountryCode?: string;

  @ApiPropertyOptional({ description: 'Residence (required if no identityDoc)' })
  @IsOptional()
  @IsString()
  residenceCountryCode?: string;
}

// 2. Update the Service inline type as well
async createOrder(params: {
  paxList: Array<{
    citizenshipCountryCode?: string;
    residenceCountryCode?: string;
  }>;
}) { ... }
```

**Allowed defaults**: Only environment variable-based Agency settings are allowed
```typescript
// Allowed - Environment variable fallback
siteCode: this.configService.get('polarhub.siteCode') || '01',

// Prohibited - Business data defaults
Label: 'Mobile',  // Hardcoded!
CitizenshipCountryCode: 'KR',  // Hardcoded!
```

### Principle 6: ContactInfoRefID Auto-Injection (CRITICAL - Added 2026-01-21)

> **MUST**: `sender.travelAgency.contactInfoRefId` is **always force-injected** from the environment variable (`POLARHUB_AGENCY_CONTACT_ID`).

#### Auto-Injection Behavior
- FE does not provide sender --> Default sender is auto-generated from environment variables
- FE provides sender --> Only contactInfoRefId is force-replaced with the environment variable value (FE value ignored!)

```typescript
// polarhub.service.ts - transformSender method
private transformSender(sender?: BaseParams['sender']): Sender {
  const agencyContactId = this.configService.get<string>('POLARHUB_AGENCY_CONTACT_ID') || 'CTC_TA1';

  // If sender is not provided by FE, generate default sender from environment variables
  if (!sender) {
    return {
      TravelAgency: {
        AgencyID: defaultTenantId,
        SiteCode: defaultSiteCode,
        // CRITICAL: ContactInfoRefID is always force-injected!
        ContactInfoRefID: [agencyContactId],
      },
    };
  }

  // Even if FE provides sender, force-inject only contactInfoRefId from environment variable
  return {
    TravelAgency: {
      AgencyID: sender.travelAgency.agencyId,
      // CRITICAL: ContactInfoRefID ignores FE value, force-injected from environment variable!
      ContactInfoRefID: [agencyContactId],
    },
  };
}
```

#### Environment Variable Configuration Required
```env
# Travel Agency ContactInfo (CTC_TA1) - Auto-injected into sender.contactInfoRefId
POLARHUB_AGENCY_CONTACT_ID=CTC_TA1
POLARHUB_AGENCY_EMAIL=agency@example.com
POLARHUB_AGENCY_PHONE_COUNTRY_CODE=82
POLARHUB_AGENCY_PHONE_NUMBER=234486101
POLARHUB_AGENCY_POSTAL_STREET=8F, 78 Namdaemun-ro
POLARHUB_AGENCY_POSTAL_CODE=04534
POLARHUB_AGENCY_POSTAL_CITY=Seoul
POLARHUB_AGENCY_POSTAL_COUNTRY=KR
```

---

## 0. API Request Required Structure (CRITICAL)

**All PolarHub API requests must include the following structure:**

```typescript
const requestBody = {
  Sender: {                          // Required
    TravelAgency: {
      AgencyID: config.tenantId,     // Environment variable POLARHUB_TENANT_ID
    },
  },
  PointOfSale: 'KR',                 // Required - ISO 3166-1 alpha-2
  Query: { ... },                    // Required - Actual request data
  TransactionID: transactionId,      // Required - 32-char UUID
};
```

### Required Field Checklist
- [ ] `Sender.TravelAgency.AgencyID` included
- [ ] `PointOfSale` country code included
- [ ] `TransactionID` 32-char format followed
- [ ] `Query` wrapping request data as object
- [ ] `X-Tide-Tenant-Id` HTTP header present (auto-added by auth layer from `POLARHUB_TENANT_ID`)

### Error When Sender is Missing
```json
{ "code": "", "message": "Sender is required" }
```

### Extended Sender for OrderCreate (Environment Variable Settings)
```typescript
// OrderCreate requires additional Sender fields (all from environment variables)
const sender = {
  TravelAgency: {
    AgencyID: process.env.POLARHUB_TENANT_ID,       // Required
    SiteCode: process.env.SALES_BRANCH_ID,       // '01'
    AgencyName: process.env.POLARHUB_AGENCY_NAME,   // 'Whitelabel Agency'
    ContactInfoRefID: [process.env.POLARHUB_AGENCY_CONTACT_ID],  // ['CTC_TA1']
  },
};

// Environment variable list (.env)
// POLARHUB_API_BASE_URL=https://your-tenant.sandbox.halo-platform.net
// POLARHUB_TENANT_ID=your-tenant-id
// POLARHUB_API_SECRET=your-api-secret
// SALES_BRANCH_ID=01
// POLARHUB_AGENCY_NAME=Whitelabel Agency
// POLARHUB_AGENCY_CONTACT_ID=CTC_TA1
```

---

## 1. Transaction ID Lifecycle (Pass-through Principle)

**CRITICAL: TransactionID is generated by FE and passed through; middleware only does pass-through!**

### Pre-Booking (FE maintains the same ID)
```typescript
// Pass through the transactionId generated by FE as-is (middleware must not generate it!)
// Controller
@Post()
async searchFlights(@Body() request: AirShoppingRequestDto) {
  const response = await this.polarHubService.searchFlights({
    transactionId: request.transactionId,  // Received from FE
    originDestList: request.originDestList,
    // ...
  });
  return response;
}

// Service
async searchFlights(params: { transactionId: string; /* ... */ }) {
  return this.client.airShopping(query, {
    transactionId: params.transactionId,  // pass-through
  });
}
```

### Post-Booking (FE generates and sends a new ID)
```typescript
// FE generates a new transactionId; middleware only does pass-through
@Post('retrieve')
async getOrder(@Body() request: OrderRetrieveRequestDto) {
  const response = await this.polarHubService.getOrder({
    transactionId: request.transactionId,  // Received from FE
    orderId: request.orderId,
  });
  return response;
}
```

### WRONG - Generation by Middleware is Prohibited
```typescript
// Absolutely prohibited!
const transactionId = generateTransactionId();  // WRONG
await client.airShopping(query, { transactionId });
```

## 2. Error Handling

### Global Exception Filter

`PolarHubExceptionFilter` is registered in `main.ts` and automatically catches `PolarHubError` exceptions. Controllers do not need manual try/catch blocks for PolarHub errors.

```typescript
// main.ts
app.useGlobalFilters(new PolarHubExceptionFilter());
```

### ResultMessage.Code Verification
```typescript
const response = await fetch(url, options);
const data = await response.json();

// Always check Code (0 = success)
if (data.ResultMessage?.Code !== '0') {
  // BA special case handling
  if (data.ResultMessage.Code === '50202' &&
      data.ResultMessage.Message?.includes('booking has been created')) {
    return { success: true, warning: data.ResultMessage.Message };
  }

  throw new PolarHubError(
    data.ResultMessage.Message,
    data.ResultMessage.Code,
    data.ResultMessage.MessageDetail
  );
}
```

### Retry Logic
```typescript
// Use exponential backoff
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (error instanceof PolarHubError) {
      throw error;  // Do not retry business errors
    }
    if (attempt < maxRetries) {
      await delay(Math.pow(2, attempt) * 1000);  // 2s, 4s, 8s...
    }
  }
}
```

### Logging
```typescript
// Log all API calls
console.log('PolarHub Request:', {
  endpoint,
  transactionId,
  timestamp: new Date().toISOString(),
});

console.log('PolarHub Response:', {
  code: response.ResultMessage.Code,
  transactionId: response.TransactionID,
  duration: `${Date.now() - startTime}ms`,
});
```

## 3. Passenger Data

### Passport Validity Verification
```typescript
// Passport must be valid for at least 6 months from departure date
function validatePassportExpiry(expiryDate: string, departureDate: string): boolean {
  const expiry = new Date(expiryDate);
  const departure = new Date(departureDate);
  const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;

  return expiry.getTime() - departure.getTime() >= sixMonths;
}
```

### Name Format
```typescript
// Convert names to API format
const individual: IndividualType = {
  NameTitle: 'MR',           // Uppercase
  GivenName: ['GILDONG'],    // Array, uppercase
  Surname: 'HONG',           // Uppercase
  // Remove special characters, spaces
};

// Remove special characters from names
function sanitizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .trim();
}
```

### Infant-Adult Linking
```typescript
// Infants must be linked to an adult
const adults = passengers.filter(p => p.type === 'ADT');
const infants = passengers.filter(p => p.type === 'INF');

if (infants.length > adults.length) {
  throw new Error('Each infant must be accompanied by an adult');
}

// Assign infants to adults
infants.forEach((infant, index) => {
  infant.accompaniedBy = adults[index].paxId;
});
```

## 4. Payment Processing

### Amount Match Verification
```typescript
// Verify payment amount matches offer total
function validatePaymentAmount(payment: Payment, offer: Offer): void {
  const offerTotal = offer.TotalPrice.TotalAmount.Amount;
  const paymentTotal = payment.Amount;

  if (Math.abs(offerTotal - paymentTotal) > 0.01) {
    throw new Error(`Payment amount ${paymentTotal} does not match offer total ${offerTotal}`);
  }
}
```

### Airline-Specific Payment Methods
```typescript
// Check allowed payment methods per airline
const paymentRules: Record<string, string[]> = {
  TR: ['Ag'],           // Agent Deposit only
  HA: ['Cash', 'Card'],
  KE: ['Cash', 'Card'],
  DEFAULT: ['Cash'],
};

function getPaymentTypes(airline: string): string[] {
  return paymentRules[airline] || paymentRules.DEFAULT;
}
```

### Card Information Validation
```typescript
// Verify required fields for card payment
function validateCardPayment(card: CardInfo): void {
  const required = ['CardCode', 'CardNumber', 'CardHolderName', 'Expiration', 'SeriesCode'];

  for (const field of required) {
    if (!card[field]) {
      throw new Error(`Missing required card field: ${field}`);
    }
  }

  // CVV length validation
  if (card.SeriesCode.length !== 3) {
    throw new Error('CVV must be 3 digits');
  }
}
```

## 5. Performance

### Response Caching
```typescript
// Cache static data (airline info, airport info, etc.)
const cache = new Map<string, { data: any; expires: number }>();

async function getCachedData<T>(key: string, fetcher: () => Promise<T>, ttl = 3600000): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  const data = await fetcher();
  cache.set(key, { data, expires: Date.now() + ttl });
  return data;
}
```

### Timeout Configuration
```typescript
// Recommended timeout: 30 seconds
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    ...options,
  });
} finally {
  clearTimeout(timeoutId);
}
```

### Parallel Processing
```typescript
// Process independent requests in parallel
const [services, seats] = await Promise.all([
  client.serviceList(query, { transactionId }),
  client.seatAvailability(query, { transactionId }),
]);
```

## 6. Request/Response File Logging (CRITICAL)

**All PolarHub API calls must be logged to files.**

### Log File Path Format
```
logs/{transactionId}/{SEQ}.{ApiName}{RQ|RS}.json
```

### Example Structure
```
logs/4ba5a0b50d2c45b3b5eb343b57ba8897/
├── 001.AirShoppingRQ.json
├── 002.AirShoppingRS.json
├── 003.OfferPriceRQ.json
└── 004.OfferPriceRS.json
```

### Implementation Requirements
- Implement `RequestLogger` class in `src/lib/polarhub/utils/request-logger.ts`
- Call logging before/after requests in `PolarHubClient`
- Provide option to disable in production environment

See the `/polarhub-client` skill for detailed implementation.

---

## Checklist

### Before Implementation
- [ ] Verify FOP support for target airline
- [ ] Verify required passport/contact fields
- [ ] Verify Trip Type support (KE does not support Multi-City)

### During Implementation
- [ ] Transaction ID flow managed correctly
- [ ] ResultMessage.Code always checked (`'0'` or `'00000'` is success)
- [ ] BA error code 50202 handled
- [ ] Passenger name format applied (uppercase, special characters removed)
- [ ] Infant count <= adult count validated
- [ ] **Request/Response file logging implemented**
- [ ] **Full response data returned (no transformation)**
- [ ] **PolarHubExceptionFilter registered in main.ts** (for new tenant setup)

### Before Deployment
- [ ] Timeout set to 30 seconds
- [ ] Retry logic implemented
- [ ] All API calls logged
- [ ] Error handling complete
- [ ] **logs/ directory added to .gitignore**
