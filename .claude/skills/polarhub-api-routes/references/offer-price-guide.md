# OfferPrice API Guide

The OfferPrice API has **different request structures depending on the workflow**.

## Supported Workflows

| Workflow ID | Description | Additional Fields |
|-------------|-------------|-------------------|
| `WF_PB_DEFERRED` | Deferred ticketing | - |
| `WF_PB_IMMEDIATE` | Immediate ticketing | - |
| `WF_PB_SEAT` | With seat selection | `SeatSelection` |
| `WF_PB_SERVICE` | With ancillary services | `BookingInstructions` |
| `WF_PB_SEAT_SERVICE` | With seat + services | Both |

---

## Request Structure by Workflow

### 1. Basic (DEFERRED/IMMEDIATE)
```typescript
{
  "Query": {
    "Offers": [{
      "ResponseID": "RS1",
      "OfferID": "OFFER1",
      "Owner": "SQ",
      "OfferItems": [{
        "OfferItemID": "OI1",
        "PaxRefID": ["PAX1"]
      }]
    }],
    "PaxList": [{ "PaxID": "PAX1", "Ptc": "ADT" }]
  }
}
```

### 2. With Seat Selection (WF_PB_SEAT)
```typescript
{
  "Query": {
    "Offers": [{
      "OfferItems": [{
        "OfferItemID": "OI1",
        "PaxRefID": ["PAX1"],
        "SeatSelection": {
          "Column": "G",  // A-K
          "Row": "20"     // Seat row
        }
      }]
    }],
    "PaxList": [...]
  }
}
```

### 3. With Service (WF_PB_SERVICE)
```typescript
{
  "Query": {
    "Offers": [{
      "OfferItems": [{
        "OfferItemID": "OI1",
        "PaxRefID": ["PAX1"],
        "BookingInstructions": {
          "Text": ["TTL10KG"],
          "Ositext": ["TTL\\s?%WVAL%KG"]
        }
      }]
    }],
    "PaxList": [...]
  }
}
```

### 4. With Seat + Service (WF_PB_SEAT_SERVICE)
```typescript
{
  "Query": {
    "Offers": [{
      "OfferItems": [{
        "OfferItemID": "OI1",
        "PaxRefID": ["PAX1"],
        "SeatSelection": { "Column": "K", "Row": "37" },
        "BookingInstructions": { "Text": ["TTL15KG"], "Ositext": [] }
      }]
    }],
    "PaxList": [...]
  }
}
```

---

## Multiple Offer Support

**The OfferPrice API supports requesting multiple Offers simultaneously.**

```typescript
{
  "Query": {
    "Offers": [
      { "OfferID": "OFFER1", "Owner": "SQ", ... },
      { "OfferID": "OFFER2", "Owner": "SQ", ... },
      { "OfferID": "OFFER3", "Owner": "SQ", ... }
    ],
    "PaxList": [...]
  }
}
```

---

## Promotion Application (FopPromotion)

**Used when applying card/payment method promotions.**

```typescript
{
  "Query": {
    "Offers": [{
      "OfferID": "OFFER1",
      "Owner": "SQ",
      "OfferItems": [...],
      "FopPromotion": {
        "PromotionCode": "VISA2026",
        "PaymentType": "A",  // A=Card, C=Cash, K=KakaoPay, S=SamsungPay
        "CardCode": "VI",    // Only when PaymentType='A'
        "CardName": "VISA"
      }
    }],
    "PaxList": [...]
  }
}
```

### FopPromotion Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `PromotionCode` | string | O | Promotion code |
| `PaymentType` | string | - | A=Card, C=Cash, K=KakaoPay, S=SamsungPay |
| `CardCode` | string | - | Card code (when PaymentType='A') |
| `CardName` | string | - | Card name |
| `TotalPromotionAmount` | object | - | Total discount amount { Amount, CurCode } |
| `PtcPromotionAmount` | array | - | Discount amount per passenger type |

---

## Criteria (Search Conditions)

**Used for special fares, program fares, and existing order references.**

```typescript
{
  "Query": {
    "Offers": [...],
    "PaxList": [...],
    "Criteria": {
      "Direct": true,
      "AirlinePreference": { "AirlineID": ["SQ"] },
      "ProgramCriteria": [{
        "AirlineID": "SQ",
        "ContractID": "CONTRACT001",
        "TypeCode": "CORPORATE"
      }],
      "PromotionCriteria": [{
        "AirlineID": "SQ",
        "PromotionID": "PROMO2026"
      }],
      "SpecialFareCriteria": [{
        "AirlineID": "SQ",
        "AccountID": "ACC001"
      }],
      "ExistingOrderCriteria": {
        "OrderID": "ORD123",
        "PaxRefID": ["PAX1"]
      }
    }
  }
}
```

### Criteria Fields
| Field | Purpose |
|-------|---------|
| `Direct` | Direct flights only |
| `AirlinePreference` | Preferred airlines |
| `ProgramCriteria` | Apply contract/program fares |
| `PromotionCriteria` | Apply promotion codes |
| `SpecialFareCriteria` | Apply special fares |
| `ExistingOrderCriteria` | Reference existing order in Post-Booking |

---

## ResponseParameter (Response Settings)

```typescript
{
  "Query": {
    "Offers": [...],
    "PaxList": [...],
    "ResponseParameter": {
      "CurrencyCode": "KRW",
      "LanguageUsage": {
        "LangCode": "ko"
      }
    }
  }
}
```

---

## Mileage Application (LoyaltyProgramAccount)

**Added to PaxList for mileage accrual with AF and KL airlines.**

```typescript
{
  "Query": {
    "Offers": [...],
    "PaxList": [{
      "PaxID": "PAX1",
      "Ptc": "ADT",
      "LoyaltyProgramAccount": [{
        "AccountNumber": "1070199873",
        "ProgramCode": "FB"  // Flying Blue
      }]
    }]
  }
}
```

---

## DTO Structure (NestJS)

```typescript
// Promotion DTO
export class FopPromotionDto {
  @IsString() promotionCode: string;
  @IsOptional() @IsString() paymentType?: string;
  @IsOptional() @IsString() cardCode?: string;
  @IsOptional() @IsString() cardName?: string;
  @IsOptional() totalPromotionAmount?: { amount: number; curCode: string };
}

// Criteria DTO
export class CriteriaDto {
  @IsOptional() @IsBoolean() direct?: boolean;
  @IsOptional() airlinePreference?: { airlineId: string[] };
  @IsOptional() programCriteria?: Array<{
    airlineId: string;
    contractId?: string;
    accountId?: string[];
    typeCode?: string;
  }>;
  @IsOptional() promotionCriteria?: Array<{
    airlineId: string;
    promotionId?: string;
  }>;
  @IsOptional() specialFareCriteria?: Array<{
    airlineId: string;
    accountId?: string;
  }>;
  @IsOptional() existingOrderCriteria?: {
    orderId: string;
    paxRefId: string[];
  };
}

// ResponseParameter DTO
export class ResponseParameterDto {
  @IsString() currencyCode: string;
  @IsOptional() languageUsage?: { langCode: string };
}

// LoyaltyProgramAccount DTO
export class LoyaltyProgramAccountDto {
  @IsOptional() @IsString() accountNumber?: string;
  @IsOptional() @IsString() programCode?: string;
  @IsOptional() @IsString() programName?: string;
}

export class SeatSelectionDto {
  @IsString() column: string;
  @IsString() row: string;
}

export class BookingInstructionsDto {
  @IsArray() @IsOptional() text?: string[];
  @IsArray() @IsOptional() ositext?: string[];
}

export class OfferItemDto {
  @IsString() offerItemId: string;
  @IsArray() paxRefId: string[];
  @IsOptional() seatSelection?: SeatSelectionDto;
  @IsOptional() bookingInstructions?: BookingInstructionsDto;
}

export class OfferSelectionDto {
  @IsString() responseId: string;
  @IsString() offerId: string;
  @IsString() owner: string;
  @ValidateNested({ each: true }) offerItems: OfferItemDto[];
  @IsOptional() fopPromotion?: FopPromotionDto;  // Promotion
}

export class PaxCodeDto {
  @IsString() paxId: string;
  @IsString() ptc: string;
  @IsOptional() birthDate?: string;
  @IsOptional() loyaltyProgramAccount?: LoyaltyProgramAccountDto[];  // Mileage
}

export class OfferPriceRequestDto {
  @IsString() transactionId: string;
  @IsOptional() sender?: SenderDto;
  @ValidateNested({ each: true }) offers: OfferSelectionDto[];
  @ValidateNested({ each: true }) paxList: PaxCodeDto[];
  @IsOptional() criteria?: CriteriaDto;  // Search conditions
  @IsOptional() responseParameter?: ResponseParameterDto;  // Response settings
}
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
