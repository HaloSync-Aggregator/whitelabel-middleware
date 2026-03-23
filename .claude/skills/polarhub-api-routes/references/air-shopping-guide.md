# AirShopping API Guide

The AirShopping API is the **starting point for all Prime Booking workflows**.

## Supported Workflows

| Workflow ID | Description | Role |
|-------------|-------------|------|
| `WF_PB_DEFERRED` | Deferred ticketing | Starting point |
| `WF_PB_IMMEDIATE` | Immediate ticketing | Starting point |
| `WF_PB_SEAT` | With seat selection | Starting point |
| `WF_PB_SERVICE` | With ancillary services | Starting point |
| `WF_PB_SEAT_SERVICE` | With seat + services | Starting point |

---

## Basic Request Structure

```typescript
{
  "Query": {
    "OriginDestList": [{
      "OriginCode": "ICN",      // IATA airport code
      "DestCode": "SIN",        // IATA airport code
      "DepartureDate": "2025-06-15"  // YYYY-MM-DD
    }],
    "PaxList": [
      { "PaxID": "PAX1", "Ptc": "ADT" },
      { "PaxID": "PAX2", "Ptc": "CHD", "BirthDate": "2018-05-10" }
    ],
    "Cabin": "Y"  // Y:Economy, W:PremiumEconomy, C:Business, F:First
  }
}
```

---

## Detailed Fields

### OriginDestList (Required)
```typescript
{
  "OriginDestList": [
    // One-Way
    { "OriginCode": "ICN", "DestCode": "SIN", "DepartureDate": "2025-06-15" },

    // Round-Trip
    { "OriginCode": "ICN", "DestCode": "SIN", "DepartureDate": "2025-06-15" },
    { "OriginCode": "SIN", "DestCode": "ICN", "DepartureDate": "2025-06-22" },

    // Multi-City (not supported by KE)
    { "OriginCode": "ICN", "DestCode": "SIN", "DepartureDate": "2025-06-15" },
    { "OriginCode": "SIN", "DestCode": "BKK", "DepartureDate": "2025-06-18" },
    { "OriginCode": "BKK", "DestCode": "ICN", "DepartureDate": "2025-06-22" }
  ]
}
```

### PaxList (Required)
```typescript
{
  "PaxList": [
    { "PaxID": "PAX1", "Ptc": "ADT" },                    // Adult
    { "PaxID": "PAX2", "Ptc": "CHD", "BirthDate": "2018-05-10" },  // Child (birth date required)
    { "PaxID": "PAX3", "Ptc": "INF", "BirthDate": "2024-01-15" }   // Infant (birth date required)
  ]
}
```

### Criteria (Optional)
```typescript
{
  "Criteria": {
    // Basic options
    "Direct": true,  // Direct flights only (supported by AA, AF, BA, EK, HA, KE, KL, LH only)
    "AirlinePreference": {
      "AirlineID": ["SQ", "AY"]  // Specific airlines only
    },

    // Program/contract fares (optional)
    "ProgramCriteria": [{
      "AirlineID": "SQ",
      "ContractID": "CONTRACT001",  // Contract ID
      "AccountID": ["ACC001"],      // Account ID
      "TypeCode": "CORPORATE"       // Type code
    }],

    // Promotions (optional)
    "PromotionCriteria": [{
      "AirlineID": "SQ",
      "PromotionID": "PROMO2026"
    }],

    // Special fares (optional)
    "SpecialFareCriteria": [{
      "AirlineID": "SQ",
      "AccountID": "SPECIAL001"
    }],

    // Post-Booking context (optional) - reference to existing order
    "ExistingOrderCriteria": {
      "OrderID": "ORD123",
      "PaxRefID": ["PAX1"]
    }
  }
}
```

### ResponseParameter (Optional)
```typescript
{
  "ResponseParameter": {
    "CurrencyCode": "KRW",  // ISO 4217 currency code
    "LanguageUsage": {
      "LangCode": "ko",  // ISO 639-1 language code
      "LangUsageType": "Display"  // Optional
    }
  }
}
```

### LoyaltyProgramAccount (Optional)
```typescript
{
  "PaxList": [{
    "PaxID": "PAX1",
    "Ptc": "ADT",
    "LoyaltyProgramAccount": [{
      "ProgramCode": "SQ",
      "AccountNumber": "8888888888"
    }]
  }]
}
```

---

## Values to Extract from Response

```typescript
// Values that must be passed to OfferPrice and OrderCreate
interface AirShoppingResponse {
  ResponseID: string;      // Session identifier
  Offer: Array<{
    OfferID: string;       // Offer identifier
    Owner: string;         // Airline code (SQ, AY, etc.)
    OfferItem: Array<{
      OfferItemID: string; // Offer item identifier
      // ...
    }>;
    TotalPrice: {
      TotalAmount: { Amount: number; CurrencyCode: string };
    };
  }>;
}

// Pass to next step
const { ResponseID, OfferID, Owner, OfferItem } = response.Offer[0];
```

---

## DTO Structure (NestJS)

```typescript
// Basic request DTOs
export class OriginDestDto {
  @IsString() origin: string;  // IATA airport code
  @IsString() destination: string;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) departureDate: string;
}

export class LoyaltyProgramAccountDto {
  @IsOptional() @IsString() accountNumber?: string;
  @IsOptional() @IsString() programCode?: string;  // SQ, FB, etc.
  @IsOptional() @IsString() programName?: string;
  @IsOptional() @IsString() signInId?: string;
  @IsOptional() @IsString() tierCode?: string;
  @IsOptional() @IsString() tierName?: string;
}

export class PassengerDto {
  @IsString() type: string;  // ADT, CHD, INF
  @IsNumber() count: number;
  @IsOptional() @IsString() birthDate?: string;  // Required for CHD/INF
  @IsOptional() @ValidateNested({ each: true }) @Type(() => LoyaltyProgramAccountDto)
  loyaltyProgramAccount?: LoyaltyProgramAccountDto[];  // AF, KL only
}

// Criteria DTOs (OpenAPI spec aligned)
export class AirlinePreferenceDto {
  @IsOptional() @IsArray() @IsString({ each: true }) airlineId?: string[];
}

export class ProgramCriteriaDto {
  @IsString() airlineId: string;
  @IsOptional() @IsString() contractId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) accountId?: string[];
  @IsOptional() @IsString() typeCode?: string;
}

export class PromotionCriteriaDto {
  @IsString() airlineId: string;
  @IsOptional() @IsString() promotionId?: string;
}

export class SpecialFareCriteriaDto {
  @IsString() airlineId: string;
  @IsOptional() @IsString() accountId?: string;
}

export class ExistingOrderCriteriaDto {
  @IsString() orderId: string;
  @IsArray() @IsString({ each: true }) paxRefId: string[];
}

export class CriteriaDto {
  @IsOptional() @IsBoolean() direct?: boolean;
  @IsOptional() @ValidateNested() @Type(() => AirlinePreferenceDto)
  airlinePreference?: AirlinePreferenceDto;
  @IsOptional() @ValidateNested({ each: true }) @Type(() => ProgramCriteriaDto)
  programCriteria?: ProgramCriteriaDto[];
  @IsOptional() @ValidateNested({ each: true }) @Type(() => PromotionCriteriaDto)
  promotionCriteria?: PromotionCriteriaDto[];
  @IsOptional() @ValidateNested({ each: true }) @Type(() => SpecialFareCriteriaDto)
  specialFareCriteria?: SpecialFareCriteriaDto[];
  @IsOptional() @ValidateNested() @Type(() => ExistingOrderCriteriaDto)
  existingOrderCriteria?: ExistingOrderCriteriaDto;
}

// ResponseParameter DTO
export class LanguageUsageDto {
  @IsString() langCode: string;
  @IsOptional() @IsString() langUsageType?: string;
}

export class ResponseParameterDto {
  @IsString() currencyCode: string;  // ISO 4217
  @IsOptional() @ValidateNested() @Type(() => LanguageUsageDto)
  languageUsage?: LanguageUsageDto;
}

// Main Request DTO
export class AirShoppingRequestDto {
  @IsString() @Matches(/^[a-f0-9]{32}$/i) transactionId: string;
  @IsOptional() @ValidateNested() @Type(() => SenderDto) sender?: SenderDto;
  @ValidateNested({ each: true }) @Type(() => OriginDestDto) originDestList: OriginDestDto[];
  @ValidateNested({ each: true }) @Type(() => PassengerDto) passengers: PassengerDto[];
  @IsOptional() @IsString() cabin?: string;

  /** @deprecated Use criteria.airlinePreference.airlineId instead */
  @IsOptional() @IsArray() @IsString({ each: true }) airlinePreference?: string[];
  /** @deprecated Use criteria.direct instead */
  @IsOptional() @IsBoolean() directOnly?: boolean;

  // ✅ RECOMMENDED: Use criteria for all search options
  @IsOptional() @ValidateNested() @Type(() => CriteriaDto) criteria?: CriteriaDto;

  // ResponseParameter
  @IsOptional() @ValidateNested() @Type(() => ResponseParameterDto)
  responseParameter?: ResponseParameterDto;
}
```

---

## Airline Support Status

| Airline | Supported | Notes |
|---------|-----------|-------|
| AY, SQ, TK, KL, AF, HA | ✅ | All search types |
| QR, TR | ✅ | Basic search |
| AA, BA, EK, LH | ✅ | Basic search |
| KE | ❌ | Not supported |

### Multi-City Restrictions
```typescript
// KE does not support Multi-City
if (originDestList.length > 2 && carrierCode === 'KE') {
  throw new Error('Korean Air does not support Multi-City');
}
```

---

## Transaction ID Management (Pass-through Principle)

**CRITICAL: TransactionID is generated by FE and passed through; the middleware only passes it through!**

```typescript
// ✅ CORRECT - Pass the transactionId received from FE as-is
@Post()
async searchFlights(@Body() request: AirShoppingRequestDto) {
  // request.transactionId is generated and provided by FE
  const response = await this.polarHubService.searchFlights({
    transactionId: request.transactionId,  // Received from FE (pass-through)
    originDestList: request.originDestList,
    passengers: request.passengers,
    // ...
  });

  res.setHeader('X-Transaction-Id', request.transactionId);
  return response;
}

// ❌ WRONG - Do not generate in middleware
const transactionId = generateTransactionId();  // Strictly prohibited!
```

### FE Pre-Booking ID Management
```typescript
// FE code example - Maintain the same transactionId throughout the flow
const transactionId = crypto.randomUUID().replace(/-/g, '');  // Generated by FE

await fetch('/middleware/polarhub/air-shopping', {
  body: JSON.stringify({ transactionId, ...searchParams })
});

await fetch('/middleware/polarhub/offer-price', {
  body: JSON.stringify({ transactionId, ...priceParams })  // Reuse same ID
});

await fetch('/middleware/polarhub/order', {
  body: JSON.stringify({ transactionId, ...orderParams })  // Reuse same ID
});
```
