# SeatAvailability API Guide

The SeatAvailability API is used for **seat information retrieval** and is used in both Prime Booking and Post-Booking flows.

## Supported Workflows

| Workflow ID | Description | Phase | Role |
|-------------|-------------|-------|------|
| `WF_PB_SEAT` | Booking with seat | Prime | Intermediate |
| `WF_PB_SEAT_SERVICE` | Booking with seat + service | Prime | Intermediate |
| `WF_HELD_SEAT` | Hold seat change | Post-Held | Intermediate |
| `WF_TKT_SEAT` | Post-ticketed seat change | Post-Ticketed | Intermediate |

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
    },
    "PaxList": [
      { "PaxID": "PAX1", "Ptc": "ADT" }
    ]
  }
}
```

---

## Response Structure

```typescript
interface SeatAvailabilityResponse {
  SeatMap: Array<{
    SegmentRef: string;          // Segment reference
    CabinCompartment: Array<{
      CabinType: string;         // Y, C, F, etc.
      SeatRow: Array<{
        RowNumber: string;       // "1", "2", ...
        Seat: Array<{
          Column: string;        // "A", "B", "C", ...
          SeatStatus: 'Available' | 'Occupied' | 'Blocked';
          SeatCharacteristics?: string[];  // WINDOW, AISLE, etc.
          Price?: {
            TotalAmount: { Amount: number; CurrencyCode: string };
          };
        }>;
      }>;
    }>;
  }>;
}

// After seat selection, pass to OfferPrice/OrderQuote
const selectedSeat = {
  Column: "G",   // A-K
  Row: "20"      // Seat row
};
```

---

## Seat Selection Pass-through Methods

### Prime Booking → OfferPrice
```typescript
// WF_PB_SEAT, WF_PB_SEAT_SERVICE
{
  "Query": {
    "Offers": [{
      "ResponseID": "...",
      "OfferID": "...",
      "Owner": "SQ",
      "OfferItems": [{
        "OfferItemID": "...",
        "PaxRefID": ["PAX1"],
        "SeatSelection": {
          "Column": "G",
          "Row": "20"
        }
      }]
    }],
    "PaxList": [...]
  }
}
```

### Post-Booking → OrderQuote/OrderChange
```typescript
// WF_HELD_SEAT (OrderQuote not required, direct OrderChange)
// WF_TKT_SEAT (OrderQuote required)
{
  "Query": {
    "OrderID": "...",
    "SelectedOffer": [{
      "OfferID": "from_seat_availability",
      "Owner": "SQ",
      "OfferItems": [{
        "OfferItemID": "...",
        "PaxRefID": ["PAX1"],
        "SeatSelection": {
          "Column": "G",
          "Row": "20"
        }
      }]
    }]
  }
}
```

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
export class OfferRefDto {
  @IsString() responseId: string;
  @IsString() offerId: string;
  @IsString() owner: string;
}

export class OrderRefDto {
  @IsString() orderId: string;
}

export class SeatAvailabilityRequestDto {
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

// Provide either offer or order in the request (not both)
// Prime Booking: use offer
// Post-Booking: use order
```

---

## Airline Support Status

| Airline | Prime | Held | Ticketed | Notes |
|---------|-------|------|----------|-------|
| AY, SQ, KL | ✅ | ✅ | ✅ | Full support |
| AF, TK, HA | ✅ | ✅ | ✅ | Full support |
| QR, TR | ✅ | ✅ | ❌ | Ticketed not supported |
| EK, LH | ❌ | ❌ | ✅ | Post-ticketed only |
| AA, BA | ❌ | ❌ | ❌ | Not supported |
| KE | ❌ | ❌ | ❌ | Not supported |

---

## Important Notes

### HELD vs TICKETED Differences

```typescript
// HELD status: Direct OrderChange without OrderQuote
OrderRetrieve → SeatAvailability → OrderChange

// TICKETED status: OrderQuote required
OrderRetrieve → SeatAvailability → OrderQuote → OrderChange
```

### Paid vs Free Seat Distinction
```typescript
// Check price in the response
const isPaid = seat.Price?.TotalAmount?.Amount > 0;
```
