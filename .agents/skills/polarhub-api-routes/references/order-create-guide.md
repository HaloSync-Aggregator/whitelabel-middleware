# OrderCreate API Guide

The OrderCreate API is the **endpoint for all Prime Booking workflows**.

---

## Middleware Core Principles

**CRITICAL**: The middleware only transforms data received from FE into PolarHub API format and does not arbitrarily add data.

### Principle 1: No Hardcoding
```typescript
// ❌ WRONG - No hardcoding allowed
contactInfoList.push({
  ContactInfoID: 'CTC_TA1',
  EmailAddress: ['agency@example.com'],  // Hardcoded!
  // ...
});

// ✅ CORRECT - FE data pass-through
const contactInfoList = params.contactInfoList.map((ci) => ({
  ContactInfoID: ci.contactInfoId,
  EmailAddress: [ci.emailAddress],  // Data received from FE
  // ...
}));
```

### Principle 2: Only Perform Data Format Transformation
- FE: `emailAddress: "user@example.com"` → PolarHub: `EmailAddress: ["user@example.com"]`
- FE: `identityDocType: "PT"` → PolarHub: `IdentityDocumentType: "PT"`
- The middleware is only responsible for format transformation; no data addition/modification allowed

### Principle 3: Required Data is Provided by FE
- Travel Agency ContactInfo (CTC_TA1) is **provided by FE**
- Include CTC_TA1 in Swagger examples to inform FE developers

## Supported Workflows

| Workflow ID | Description | FOP Required | Additional Fields |
|-------------|-------------|--------------|-------------------|
| `WF_PB_DEFERRED` | Deferred ticketing | ❌ | - |
| `WF_PB_IMMEDIATE` | Immediate ticketing | ✅ | `PaymentList` |
| `WF_PB_SEAT` | With seat selection | ✅ | `SeatSelection` |
| `WF_PB_SERVICE` | With ancillary services | ✅ | `BookingInstructions` |
| `WF_PB_SEAT_SERVICE` | With seat + services | ✅ | Both |

---

## Required: Travel Agency ContactInfo

**CRITICAL**: OrderCreate requests require Travel Agency contact information (CTC_TA1).

### Sender Structure
```typescript
{
  "Sender": {
    "TravelAgency": {
      "AgencyID": "YOUR_TENANT_ID",
      "ContactInfoRefID": ["CTC_TA1"]  // Travel Agency contact reference required!
    }
  }
}
```

### ContactInfoList Including Travel Agency Contact
```typescript
{
  "ContactInfoList": [
    // Passenger contact
    {
      "ContactInfoID": "CI_PAX1",
      "EmailAddress": ["user@example.com"],  // String array!
      "Phone": [{
        "CountryDialingCode": "82",
        "PhoneNumber": "1012345678"
      }]
    },
    // Travel Agency contact (required!)
    {
      "ContactInfoID": "CTC_TA1",
      "EmailAddress": ["agency@example.com"],
      "Phone": [{
        "CountryDialingCode": "82",
        "PhoneNumber": "234486101"
      }],
      "PostalAddress": [{
        "Street": ["8F 9F, 78, Namdaemun-ro, Jung-gu"],
        "PostalCode": "04534",
        "CountryCode": "KR",
        "CityName": "Seoul"
      }]
    }
  ]
}
```

---

## Request Structure by Workflow

### 1. Basic (WF_PB_DEFERRED)
```typescript
{
  "Sender": {
    "TravelAgency": {
      "AgencyID": "YOUR_TENANT_ID",
      "ContactInfoRefID": ["CTC_TA1"]
    }
  },
  "PointOfSale": "KR",
  "TransactionID": "from_offer_price",
  "Query": {
    "Order": [{
      "ResponseID": "from_offer_price",
      "OfferID": "from_offer_price",
      "Owner": "SQ",
      "OfferItems": [{
        "OfferItemID": "OI1",
        "PaxRefID": ["PAX1"]
      }]
    }],
    "PaxList": [{
      "PaxID": "PAX1",
      "Ptc": "ADT",
      "Individual": {
        "NameTitle": "MR",
        "GivenName": ["GILDONG"],
        "Surname": "HONG",
        "Birthdate": "1990-01-15",
        "Gender": "MALE"
      },
      "Gender": "MALE",
      "ContactInfoRefID": ["CI_PAX1"],
      "IdentityDoc": [{
        "IdentityDocumentType": "PT",
        "IdentityDocumentNumber": "M12345678",
        "ExpiryDate": "2030-01-01",
        "IssuingCountryCode": "KR",
        "CitizenshipCountryCode": "KR",
        "ResidenceCountryCode": "KR",
        "Gender": "MALE"
      }]
      // NOTE: CitizenshipCountryCode, ResidenceCountryCode are only inside IdentityDoc!
    }],
    "ContactInfoList": [
      {
        "ContactInfoID": "CI_PAX1",
        "EmailAddress": ["user@example.com"],
        "Phone": [{
          "CountryDialingCode": "82",
          "PhoneNumber": "1012345678"
        }]
      },
      {
        "ContactInfoID": "CTC_TA1",
        "EmailAddress": ["agency@example.com"],
        "Phone": [{
          "CountryDialingCode": "82",
          "PhoneNumber": "234486101"
        }],
        "PostalAddress": [{
          "Street": ["8F 9F, 78, Namdaemun-ro, Jung-gu"],
          "PostalCode": "04534",
          "CountryCode": "KR",
          "CityName": "Seoul"
        }]
      }
    ]
  }
}
```

### 2. Immediate Ticketing (WF_PB_IMMEDIATE)
```typescript
{
  "Query": {
    "Order": [...],
    "PaxList": [...],
    "ContactInfoList": [...],
    "PaymentList": [{
      "Type": "Cash",
      "Amount": 850000,
      "CurCode": "KRW"
    }]
  }
}
```

### 3. With Seat Selection (WF_PB_SEAT)
```typescript
{
  "Query": {
    "Order": [{
      "OfferItems": [{
        "OfferItemID": "OI1",
        "PaxRefID": ["PAX1"],
        "SeatSelection": {
          "Column": "G",
          "Row": "20"
        }
      }]
    }],
    "PaxList": [...],
    "PaymentList": [...]
  }
}
```

### 4. With Service (WF_PB_SERVICE)
```typescript
{
  "Query": {
    "Order": [{
      "OfferItems": [{
        "OfferItemID": "OI1",
        "PaxRefID": ["PAX1"],
        "BookingInstructions": {
          "Text": ["TTL10KG"],
          "Ositext": ["TTL\\s?%WVAL%KG"]
        }
      }]
    }],
    "PaxList": [...],
    "PaymentList": [...]
  }
}
```

### 5. FopPromotion (Card/Payment Promotion)
```typescript
{
  "Query": {
    "Order": [{
      "ResponseID": "from_offer_price",
      "OfferID": "from_offer_price",
      "Owner": "SQ",
      "OfferItems": [...],
      // FopPromotion - Card/payment method discount
      "FopPromotion": {
        "PromotionCode": "VISA2026",
        "PaymentType": "A",  // A=Card, C=Cash, K=KakaoPay, S=SamsungPay
        "CardCode": "VI",
        "CardName": "VISA",
        "TotalPromotionAmount": {
          "Amount": 50000,
          "CurCode": "KRW"
        },
        // Discount per passenger type (optional)
        "PtcPromotionAmount": [
          { "Ptc": "ADT", "Amount": { "Amount": 30000, "CurCode": "KRW" } },
          { "Ptc": "CHD", "Amount": { "Amount": 20000, "CurCode": "KRW" } }
        ]
      }
    }],
    "PaxList": [...],
    "PaymentList": [...]
  }
}
```

### 6. Criteria (Contract/Promotion/Special Fares)
```typescript
{
  "Query": {
    "Order": [...],
    "PaxList": [...],
    // Criteria - Special fares, programs, promotions
    "Criteria": {
      // Program/contract fares
      "ProgramCriteria": [{
        "AirlineID": "SQ",
        "ContractID": "CONTRACT001",
        "TypeCode": "CORPORATE"
      }],
      // Promotions
      "PromotionCriteria": [{
        "AirlineID": "SQ",
        "PromotionID": "PROMO2026"
      }],
      // Special fares
      "SpecialFareCriteria": [{
        "AirlineID": "SQ",
        "AccountID": "SPECIAL001"
      }]
    }
  }
}
```

### 7. LoyaltyProgramAccount (Mileage, AF/KL only)
```typescript
{
  "Query": {
    "Order": [...],
    "PaxList": [{
      "PaxID": "PAX1",
      "Ptc": "ADT",
      "Individual": {...},
      // LoyaltyProgramAccount - AF, KL only
      "LoyaltyProgramAccount": [{
        "ProgramCode": "FB",  // Flying Blue (AF/KL)
        "AccountNumber": "1070199873",
        "ProgramName": "Flying Blue",
        "TierCode": "GOLD",
        "TierName": "Gold"
      }]
    }]
  }
}
```

---

## Payment Methods (PaymentList)

**IMPORTANT**: This is the actual PaymentList structure for the PolarHub API.

### Basic Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Type` | string | ✅ | Cash, Card, AgentDeposit |
| `Amount` | number | ✅ | Payment amount |
| `CurCode` | string | ✅ | Currency code (KRW, USD, etc.) |
| `OrderItemID` | string[] | ❌ | Order Item IDs to pay for |
| `OfferItemID` | string[] | ❌ | Offer Item IDs to pay for |
| `PaxRefID` | string[] | ❌ | Passenger IDs for payment |

### Cash (Cash/Transfer - BSP)
```typescript
{
  "Type": "Cash",
  "Amount": 850000,
  "CurCode": "KRW"
}
```

### Card
```typescript
{
  "Type": "Card",
  "Amount": 850000,
  "CurCode": "KRW",
  "Card": {
    "CardCode": "VI",           // VI, MC, AX, JC
    "CardNumber": "4111111111111111",
    "CardHolderName": "HONG GILDONG",
    "Expiration": "1225",       // MMYY
    "SeriesCode": "123"         // CVV
  }
}
```

### Agent Deposit (TR only)
```typescript
{
  "Type": "AgentDeposit",
  "Amount": 850000,
  "CurCode": "KRW"
}
```

### PaymentList with Optional Fields (Specifying Payment Target)
```typescript
{
  "Type": "Cash",
  "Amount": 364000,
  "CurCode": "KRW",
  "OrderItemID": ["OI1"],                    // Payment for specific Order Item
  "OfferItemID": ["35acab4f...21.3-1-1"],   // Payment for specific Offer Item
  "PaxRefID": ["PAX1", "PAX2"]              // Payment for specific passengers
}
```

---

## ContactInfo Structure (CRITICAL)

### Pass-through Principle (MOST IMPORTANT)
**The middleware passes contact information received from FE as-is. Do not modify the data.**

```typescript
// ❌ WRONG - Do not modify PhoneNumber in middleware!
Phone: [{
  CountryDialingCode: ci.phone.countryDialingCode || '82',  // Fallback prohibited
  PhoneNumber: `+${ci.phone.countryDialingCode}${ci.phone.phoneNumber}`,  // Concatenation prohibited!
}],

// ✅ CORRECT - FE data pass-through
Phone: [{
  Label: 'Mobile',
  CountryDialingCode: ci.phone.countryDialingCode,  // Pass through as-is
  PhoneNumber: ci.phone.phoneNumber,                 // Pass through as-is
}],
```

### Passenger Contact vs Travel Agency Contact
```typescript
// Passenger contact (CI_PAX1) - No PostalAddress!
{
  "ContactInfoID": "CI_PAX1",
  "EmailAddress": ["user@example.com"],
  "Phone": [{
    "Label": "Mobile",
    "CountryDialingCode": "82",
    "PhoneNumber": "1046900081"  // Pass through as received from FE!
  }],
  "ContactRefusedInd": false
  // No PostalAddress!
}

// Travel Agency contact (CTC_TA1) - PostalAddress required!
{
  "ContactInfoID": "CTC_TA1",
  "EmailAddress": ["agency@example.com"],
  "Phone": [{
    "CountryDialingCode": "82",
    "PhoneNumber": "234486101"  // Pass through as received from FE!
  }],
  "PostalAddress": [{
    "Street": ["8F 9F, 78, Namdaemun-ro, Jung-gu"],
    "PostalCode": "04534",
    "CountryCode": "KR",
    "CityName": "Seoul"
  }],
  "ContactRefusedInd": false
}
```

### Required ContactInfo Fields by Airline

| Airline | Email | Phone | PostalAddress |
|---------|-------|-------|---------------|
| BA | ✅ | ❌ | ✅ (Also required for passengers) |
| AF, KL | ✅ | ✅ | ❌ |
| SQ, Others | ✅ | ✅ | ❌ (Passenger), ✅ (TA) |

### BA Special Case (PostalAddress Also Required for Passengers)
```typescript
{
  "ContactInfoID": "CI_PAX1",
  "EmailAddress": ["user@example.com"],
  "PostalAddress": [{
    "Street": ["123 Main Street"],
    "CityName": "London",
    "PostalCode": "W1A 1AA",
    "CountryCode": "GB"
  }]
}
```

---

## PaxList Required Fields

### Individual (Required)
```typescript
{
  "NameTitle": "MR",          // MR, MRS, MS, MSTR, MISS
  "GivenName": ["GILDONG"],   // Array! Uppercase!
  "Surname": "HONG",          // Uppercase!
  "Birthdate": "1990-01-15",  // YYYY-MM-DD
  "Gender": "MALE"            // MALE, FEMALE (uppercase!)
}
```

### IdentityDoc (Passport, Required in Most Cases)
```typescript
{
  "IdentityDocumentType": "PT",       // PT: Passport (NOT IdentityDocType!)
  "IdentityDocumentNumber": "M12345678",  // Passport number (NOT IdentityDocID!)
  "ExpiryDate": "2030-01-01",         // Must be at least 6 months after departure date
  "IssuingCountryCode": "KR",         // ISO 3166-1 alpha-2
  "CitizenshipCountryCode": "KR",
  "ResidenceCountryCode": "KR",       // Country of residence
  "Gender": "MALE"                    // MALE, FEMALE
}
```

### IMPORTANT: CitizenshipCountryCode / ResidenceCountryCode Location
```typescript
// When IdentityDoc exists: No CitizenshipCountryCode/ResidenceCountryCode at PaxList level!
{
  "PaxID": "PAX1",
  "Ptc": "ADT",
  "Individual": {...},
  "Gender": "MALE",
  "ContactInfoRefID": ["CI_PAX1"],
  "IdentityDoc": [{
    "CitizenshipCountryCode": "KR",  // Only inside IdentityDoc!
    "ResidenceCountryCode": "KR"     // Only inside IdentityDoc!
  }]
  // CitizenshipCountryCode: "KR"  <- Should NOT be here!
}

// When IdentityDoc is absent: Add at PaxList level
{
  "PaxID": "PAX1",
  "Ptc": "ADT",
  "Individual": {...},
  "Gender": "MALE",
  "ContactInfoRefID": ["CI_PAX1"],
  "CitizenshipCountryCode": "KR",  // At PaxList level!
  "ResidenceCountryCode": "KR"     // At PaxList level!
}
```

### ContactInfoList EmailAddress Format
```typescript
// CORRECT: String array
"EmailAddress": ["user@example.com"]

// WRONG: Object array
"EmailAddress": [{ "EmailAddressText": "user@example.com" }]
```

---

## DTO Structure (NestJS)

```typescript
export class IndividualDto {
  @IsString() nameTitle: string;
  @IsArray() givenName: string[];
  @IsString() surname: string;
  @IsString() birthdate: string;
  @IsEnum(['MALE', 'FEMALE']) gender: string;  // Uppercase!
}

export class IdentityDocDto {
  @IsString() identityDocType: string;   // DTO uses camelCase
  @IsString() identityDocId: string;     // Transformed to IdentityDocumentType/Number in Service
  @IsString() expiryDate: string;
  @IsString() issuingCountryCode: string;
  @IsString() citizenshipCountryCode: string;
}

export class PaxDetailDto {
  @IsString() paxId: string;
  @IsEnum(['ADT', 'CHD', 'INF']) ptc: string;
  @ValidateNested() individual: IndividualDto;
  @IsOptional() @ValidateNested({ each: true }) identityDoc?: IdentityDocDto[];
  @IsOptional() @IsArray() contactInfoRefId?: string[];
}

// Criteria DTOs
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

export class CriteriaDto {
  @IsOptional() @ValidateNested({ each: true }) @Type(() => ProgramCriteriaDto)
  programCriteria?: ProgramCriteriaDto[];
  @IsOptional() @ValidateNested({ each: true }) @Type(() => PromotionCriteriaDto)
  promotionCriteria?: PromotionCriteriaDto[];
  @IsOptional() @ValidateNested({ each: true }) @Type(() => SpecialFareCriteriaDto)
  specialFareCriteria?: SpecialFareCriteriaDto[];
}

// FopPromotion DTO
export class SimpleAmountDto {
  @IsNumber() amount: number;
  @IsString() curCode: string;
}

export class PtcPromotionAmountDto {
  @IsString() ptc: string;
  @ValidateNested() @Type(() => SimpleAmountDto) amount: SimpleAmountDto;
}

export class FopPromotionDto {
  @IsString() promotionCode: string;
  @IsOptional() @IsString() paymentType?: string;  // A=Card, C=Cash, K=KakaoPay, S=SamsungPay
  @IsOptional() @ValidateNested() @Type(() => SimpleAmountDto) totalPromotionAmount?: SimpleAmountDto;
  @IsOptional() @ValidateNested({ each: true }) @Type(() => PtcPromotionAmountDto)
  ptcPromotionAmount?: PtcPromotionAmountDto[];
  @IsOptional() @IsString() cardCode?: string;
  @IsOptional() @IsString() cardName?: string;
}

// LoyaltyProgramAccount DTO (AF, KL only)
export class LoyaltyProgramAccountDto {
  @IsOptional() @IsString() accountNumber?: string;
  @IsOptional() @IsString() programCode?: string;  // FB (Flying Blue), etc.
  @IsOptional() @IsString() programName?: string;
  @IsOptional() @IsString() signInId?: string;
  @IsOptional() @IsString() tierCode?: string;
  @IsOptional() @IsString() tierName?: string;
}

export class PaxDetailDto {
  @IsString() paxId: string;
  @IsEnum(['ADT', 'CHD', 'INF']) ptc: string;
  @ValidateNested() @Type(() => IndividualDto) individual: IndividualDto;
  @IsOptional() @ValidateNested({ each: true }) @Type(() => IdentityDocDto) identityDoc?: IdentityDocDto[];
  @IsOptional() @IsArray() contactInfoRefId?: string[];
  @IsOptional() @IsString() citizenshipCountryCode?: string;  // Required when IdentityDoc is absent
  @IsOptional() @IsString() residenceCountryCode?: string;    // Required when IdentityDoc is absent
  @IsOptional() @ValidateNested({ each: true }) @Type(() => LoyaltyProgramAccountDto)
  loyaltyProgramAccount?: LoyaltyProgramAccountDto[];  // AF, KL only
}

// OfferSelection DTO (with FopPromotion)
export class OfferSelectionDto {
  @IsString() responseId: string;
  @IsString() offerId: string;
  @IsString() owner: string;
  @ValidateNested({ each: true }) @Type(() => OfferItemDto) offerItems: OfferItemDto[];
  @IsOptional() @ValidateNested() @Type(() => FopPromotionDto) fopPromotion?: FopPromotionDto;
}

export class OrderCreateRequestDto {
  @IsString() @Matches(/^[a-f0-9]{32}$/i) transactionId: string;
  @IsOptional() @ValidateNested() @Type(() => SenderDto) sender?: SenderDto;
  @ValidateNested({ each: true }) @Type(() => OfferSelectionDto) orders: OfferSelectionDto[];
  @ValidateNested({ each: true }) @Type(() => PaxDetailDto) paxList: PaxDetailDto[];
  @IsOptional() @ValidateNested({ each: true }) @Type(() => ContactInfoDto) contactInfoList?: ContactInfoDto[];
  @IsOptional() @ValidateNested({ each: true }) @Type(() => PaymentDto) paymentList?: PaymentDto[];
  @IsOptional() @ValidateNested() @Type(() => CriteriaDto) criteria?: CriteriaDto;
}

// === Payment DTOs (Frontend → Middleware) ===
// NOTE: This is the format received from the frontend. The Service layer transforms it into PolarHub format.

export class CashPaymentDto {
  @IsBoolean() @IsOptional() cashPaymentInd?: boolean = true;
}

export class CardPaymentDto {
  @IsString() cardCode: string;       // VI, MC, AX, JC
  @IsString() cardNumber: string;
  @IsString() cardHolderName: string;
  @IsString() expiration: string;     // MMYY
  @IsString() seriesCode: string;     // CVV
}

export class AgentDepositDto {
  @IsString() agentDepositId: string;
}

export class PaymentMethodDto {
  @IsOptional() @ValidateNested() @Type(() => CashPaymentDto) cash?: CashPaymentDto;
  @IsOptional() @ValidateNested() @Type(() => CardPaymentDto) card?: CardPaymentDto;
  @IsOptional() @ValidateNested() @Type(() => AgentDepositDto) agentDeposit?: AgentDepositDto;
}

export class PaymentAmountDto {
  @IsString() currencyCode: string;
  @IsNumber() amount: number;
}

export class PaymentDto {
  @ValidateNested() @Type(() => PaymentMethodDto) paymentMethod: PaymentMethodDto;
  @ValidateNested() @Type(() => PaymentAmountDto) amount: PaymentAmountDto;

  // Optional payment allocation fields - pass through to PolarHub
  @IsOptional() @IsArray() @IsString({ each: true }) orderItemId?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) offerItemId?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) paxRefId?: string[];
}

// === PolarHub PaymentList Transformation (Service Layer) ===
// Frontend DTO → PolarHub API Format transformation example:
// {
//   paymentMethod: { cash: { cashPaymentInd: true } },
//   amount: { currencyCode: "KRW", amount: 850000 }
// }
// ↓ Transform ↓
// { Type: "Cash", Amount: 850000, CurCode: "KRW" }
```

---

## Airline Support Status

| Airline | DEFERRED | IMMEDIATE | SEAT | SERVICE | SEAT_SERVICE |
|---------|----------|-----------|------|---------|--------------|
| AY, SQ, TK, HA | ✅ | ✅ | ✅ | ✅ | ✅ |
| AF, KL | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| QR, TR | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| AA, BA, EK, LH | ✅ | ✅ | ❌ | ❌ | ❌ |
| KE | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Important Notes

### Infant-Adult Association
```typescript
// Number of infants must be <= number of adults
const adults = paxList.filter(p => p.ptc === 'ADT');
const infants = paxList.filter(p => p.ptc === 'INF');
if (infants.length > adults.length) {
  throw new Error('Each infant must be accompanied by an adult');
}
```

### Name Format
```typescript
// Remove special characters and spaces, then uppercase
const sanitizeName = (name: string) =>
  name.toUpperCase().replace(/[^A-Z\s]/g, '').trim();
```

### Passport Validity
```typescript
// Must be valid for at least 6 months from departure date
const isValidPassport = (expiryDate: string, departureDate: string) => {
  const expiry = new Date(expiryDate);
  const departure = new Date(departureDate);
  const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
  return expiry.getTime() - departure.getTime() >= sixMonths;
};
```
