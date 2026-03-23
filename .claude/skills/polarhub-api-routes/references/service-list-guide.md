# ServiceList API Guide

The ServiceList API is used for **ancillary service retrieval** and is used in both Prime Booking and Post-Booking flows.

## Supported Workflows

| Workflow ID | Description | Phase | Role |
|-------------|-------------|-------|------|
| `WF_PB_SERVICE` | Booking with service | Prime | Intermediate |
| `WF_PB_SEAT_SERVICE` | Booking with seat + service | Prime | Intermediate |
| `WF_HELD_SERVICE` | Hold service addition | Post-Held | Intermediate |
| `WF_TKT_SERVICE` | Post-ticketed service addition | Post-Ticketed | Intermediate |

---

## Request Structure by Phase

### 1. Prime Booking (Query.Offer)

Uses offer information received from the AirShopping response:

```typescript
{
  "Query": {
    "Offer": {
      "ResponseID": "from_air_shopping",
      "OfferID": "from_air_shopping",
      "Owner": "SQ"
    },
    "PaxList": [
      { "PaxID": "PAX1", "Ptc": "ADT" }
    ]
  }
}
```

### 2. Post-Booking (Query.Order)

Uses order information received from the OrderRetrieve response:

```typescript
{
  "Query": {
    "Order": {
      "OrderID": "from_order_retrieve"
    }
  }
}
```

---

## Response Structure

```typescript
interface ServiceListResponse {
  ServiceList: Array<{
    ServiceID: string;
    ServiceName: string;           // "Extra Baggage 10kg"
    ServiceType: string;           // "BaggageAllowance", "Meal", etc.
    Price: {
      TotalAmount: { Amount: number; CurrencyCode: string };
    };
    BookingInstructions?: {
      Text: string[];              // ["TTL10KG"]
      Ositext: string[];           // ["TTL\\s?%WVAL%KG"]
    };
    Associations: {
      PaxRefID: string[];
      SegmentRefID?: string[];
    };
  }>;
}

// After service selection, pass to OfferPrice/OrderQuote
const selectedService = {
  Text: ["TTL10KG"],
  Ositext: ["TTL\\s?%WVAL%KG"]
};
```

---

## Service Selection Pass-through Methods

### Prime Booking → OfferPrice
```typescript
// WF_PB_SERVICE, WF_PB_SEAT_SERVICE
{
  "Query": {
    "Offers": [{
      "ResponseID": "...",
      "OfferID": "...",
      "Owner": "SQ",
      "OfferItems": [{
        "OfferItemID": "...",
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

### Post-Booking → OrderQuote → OrderChange
```typescript
// WF_HELD_SERVICE, WF_TKT_SERVICE (both require OrderQuote)
{
  "Query": {
    "OrderID": "...",
    "SelectedOffer": [{
      "OfferID": "from_service_list",
      "Owner": "SQ",
      "OfferItems": [{
        "OfferItemID": "...",
        "PaxRefID": ["PAX1"],
        "BookingInstructions": {
          "Text": ["TTL10KG"],
          "Ositext": ["TTL\\s?%WVAL%KG"]
        }
      }]
    }]
  }
}
```

---

## Service Types

| Type | Description | BookingInstructions Example |
|------|-------------|---------------------------|
| BaggageAllowance | Extra baggage | `Text: ["TTL10KG"]` |
| Meal | In-flight meal | `Text: ["VGML"]` (vegetarian) |
| SeatUpgrade | Seat upgrade | - |
| Lounge | Lounge access | - |
| WiFi | In-flight WiFi | - |

---

## Search Criteria and Response Settings (Criteria, ResponseParameter)

**Used when special fare conditions or currency/language settings are needed.**

```typescript
{
  "Query": {
    "Order": { "OrderID": "ORDER_ID" },
    "PaxList": [...],
    "Criteria": {
      "ExistingOrderCriteria": {
        "OrderID": "EXISTING_ORDER_ID"  // Existing order reference
      }
    },
    "ResponseParameter": {
      "CurrencyCode": "KRW",
      "LanguageUsage": { "LangCode": "ko" }
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `Criteria.ExistingOrderCriteria` | `object` | Existing order reference (Post-Booking) |
| `Criteria.ProgramCriteria` | `array` | Contract/program fare application |
| `Criteria.SpecialFareCriteria` | `array` | Special fare application |
| `ResponseParameter.CurrencyCode` | `string` | Response currency code |
| `ResponseParameter.LanguageUsage` | `object` | Response language setting |

---

## DTO Structure (NestJS)

```typescript
export class BookingInstructionsDto {
  @IsArray() @IsOptional() text?: string[];
  @IsArray() @IsOptional() ositext?: string[];
  @IsArray() @IsOptional() ssrCode?: string[];
  @IsOptional() @IsString() upgradeMethod?: string;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsString() equipment?: string;
}

export class ServiceListRequestDto {
  @IsString() transactionId: string;
  @IsOptional() @ValidateNested() @Type(() => SenderDto) sender?: SenderDto;
  @IsOptional() @ValidateNested() @Type(() => OfferRefDto) offer?: OfferRefDto;
  @IsOptional() @ValidateNested() @Type(() => OrderRefDto) order?: OrderRefDto;
  @IsArray() @ValidateNested({ each: true }) @Type(() => PaxCodeDto) paxList: PaxCodeDto[];

  // Special fares, existing order reference, etc.
  @IsOptional() @ValidateNested() @Type(() => CriteriaDto) criteria?: CriteriaDto;

  // Response currency/language settings
  @IsOptional() @ValidateNested() @Type(() => ResponseParameterDto) responseParameter?: ResponseParameterDto;
}
```

---

## Airline Support Status

| Airline | Prime | Held | Ticketed | Notes |
|---------|-------|------|----------|-------|
| AY, SQ, KL | ✅ | ✅ | ✅ | Full support |
| AF, TK, HA | ✅ | ✅ | ✅ | Full support |
| QR | ✅ | ✅ | ✅ | Full support |
| EK, LH | ❌ | ❌ | ✅ | Post-ticketed only |
| TR | ❌ | ✅ | ❌ | Held only |
| AA, BA | ❌ | ❌ | ❌ | Not supported |
| KE | ❌ | ❌ | ❌ | Not supported |

---

## Important Notes

### PaxRefID Mapping During Service Selection
```typescript
// Services must be selected individually per passenger
const servicesForPax1 = {
  OfferItemID: "OI1",
  PaxRefID: ["PAX1"],  // Specify a particular passenger
  BookingInstructions: { Text: ["TTL10KG"] }
};
```

### HELD vs TICKETED Commonality
```typescript
// Both require OrderQuote
OrderRetrieve → ServiceList → OrderQuote → OrderChange
```

### Ositext Regex Pattern
```typescript
// Replace %WVAL% placeholder with the actual value
"TTL\\s?%WVAL%KG" → "TTL10KG"
```
