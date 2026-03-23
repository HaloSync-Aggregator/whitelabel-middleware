# OrderQuote API Guide

The OrderQuote API is used in **2 modes**:
1. **SelectedOffer**: Seat/service change quote (after SeatAvailability/ServiceList)
2. **RepricedOrderID**: Fare recalculation before ticketing (before confirming a Held booking)

## Supported Workflows

| Workflow ID | Description | Phase | Purpose | Query Mode |
|-------------|-------------|-------|---------|------------|
| `WF_HELD_SERVICE` | Hold service addition | Post-Held | Service quote | SelectedOffer |
| `WF_HELD_CONFIRM` | Hold booking confirmation (ticketing) | Post-Held | Fare recalculation | **RepricedOrderID** |
| `WF_TKT_SEAT` | Post-ticketed seat change | Post-Ticketed | Seat quote | SelectedOffer |
| `WF_TKT_SERVICE` | Post-ticketed service addition | Post-Ticketed | Service quote | SelectedOffer |

---

## OrderQuote Requirement (Varies by Airline)

| Workflow | OrderQuote Required | Query Mode | Notes |
|----------|---------------------|------------|-------|
| WF_HELD_SEAT | ❌ (Direct OrderChange) | - | |
| WF_HELD_SERVICE | ✅ | SelectedOffer | |
| WF_HELD_CONFIRM | ⚠️ **Varies by airline** | RepricedOrderID | Required for SQ, AY, etc. |
| WF_TKT_SEAT | ✅ | SelectedOffer | |
| WF_TKT_SERVICE | ✅ | SelectedOffer | |

> **IMPORTANT**: Whether OrderQuote is required for WF_HELD_CONFIRM varies by airline.
> - **OrderQuote required**: SQ, AY, KL (refer to Carrier Support Matrix)
> - **OrderQuote not required**: Some airlines allow direct OrderChange

---

## 2 Query Modes

### Mode 1: SelectedOffer (Seat/Service Quote)

```typescript
{
  "Query": {
    "OrderID": "from_order_retrieve",
    "SelectedOffer": [{
      "OfferID": "from_seat_or_service_availability",
      "Owner": "SQ",
      "OfferItems": [{ "OfferItemID": "OI1", "PaxRefID": ["PAX1"], ... }]
    }]
  }
}
```

### Mode 2: RepricedOrderID (Pre-Ticketing Fare Recalculation) - WF_HELD_CONFIRM

> **CRITICAL**: Required for deferred ticketing (WF_HELD_CONFIRM) with certain airlines such as SQ, AY, KL!

#### FE Request Format (camelCase)

```typescript
// FE → Middleware request
{
  "transactionId": "22a5a0b50d2c45b3b5eb343b57ba8897",
  "sender": {
    "travelAgency": {
      "agencyId": "YOUR_TENANT_ID",
      "siteCode": "01"
    }
  },
  "orderId": "TSDEV-20260126-424c888145864d24",
  "repricedOrderId": {
    "orderId": "TSDEV-20260126-424c888145864d24",
    "orderItemRefId": ["AY1059O3QVT00_AIR-1-2", "AY1059O3QVT00_SRV14"]
  }
}
```

#### PolarHub Query Transformed Result (PascalCase)

```typescript
// Middleware → PolarHub request (OpenAPI spec example)
{
  "Query": {
    "OrderID": "TSDEV-20260126-424c888145864d24",
    "RepricedOrderID": {
      "OrderID": "TSDEV-20260126-424c888145864d24",
      "OrderItemRefID": ["AY1059O3QVT00_AIR-1-2", "AY1059O3QVT00_SRV14"]
    }
  }
}
```

> **IMPORTANT**: `repricedOrderId` must be passed as an object!
> - `orderId`: Required - The Order ID to recalculate
> - `orderItemRefId`: Optional - Specify when recalculating only certain OrderItems

**Obtain OfferID from the response → Use in OrderChange:**
```typescript
// OrderQuote response
const offerIdFromQuote = response.QuotedOffer[0].OfferID;

// OrderChange request
{
  "ChangeOrderChoice": {
    "AcceptRepricedOrder": {
      "OfferRefID": [offerIdFromQuote]  // OfferID from OrderQuote response
    }
  }
}
```

---

## Basic Request Structure (SelectedOffer Mode)

### FE Request Format (camelCase)

```typescript
// FE → Middleware request
{
  "transactionId": "00e3fac8990b367a80ba39e293e1bb10",
  "orderId": "TSDEV-20260127-xxx",
  "selectedOffer": [{
    "responseId": "16f53f58ed60469a98ae0e41c820545b21.3-1",  // Required for WF_TKT_VOLCHANGE, etc.
    "offerId": "16f53f58ed60469a98ae0e41c820545b21.3-1",
    "owner": "SQ",
    "offerItems": [{
      "offerItemId": "16f53f58ed60469a98ae0e41c820545b21.3-1-1",
      "paxRefId": ["PAX2"],
      // For seats
      "seatSelection": { "column": "G", "row": "20" },
      // For services (baggage, etc.)
      "bookingInstructions": {
        "text": ["TTL20KG"],
        "ositext": ["TTL\\s?%WVAL%KG"]
      }
    }]
  }]
}
```

### PolarHub Query Transformed Result (PascalCase)

```typescript
// Middleware → PolarHub request
{
  "Query": {
    "OrderID": "TSDEV-20260127-xxx",
    "SelectedOffer": [{
      "ResponseID": "16f53f58ed60469a98ae0e41c820545b21.3-1",
      "OfferID": "16f53f58ed60469a98ae0e41c820545b21.3-1",
      "Owner": "SQ",
      "OfferItems": [{
        "OfferItemID": "16f53f58ed60469a98ae0e41c820545b21.3-1-1",
        "PaxRefID": ["PAX2"],
        // Seat
        "SeatSelection": { "Column": "G", "Row": "20" },
        // Service
        "BookingInstructions": {
          "Text": ["TTL20KG"],
          "Ositext": ["TTL\\s?%WVAL%KG"]
        }
      }]
    }]
  }
}
```

> **CRITICAL**: `BookingInstructions` and `ResponseID` are easily omitted during Service mapping!
> - `bookingInstructions` → `BookingInstructions` (Required for service quotes)
> - `responseId` → `ResponseID` (Required for WF_TKT_VOLCHANGE, etc.)

---

## Request Structure by Purpose

### 1. Seat Quote (WF_TKT_SEAT)

```typescript
// SeatAvailability → OrderQuote
{
  "Query": {
    "OrderID": "ORDER_ID",
    "SelectedOffer": [{
      "OfferID": "SEAT_OFFER_FROM_AVAILABILITY",
      "Owner": "SQ",
      "OfferItems": [{
        "OfferItemID": "SEAT_OI1",
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

### 2. Service Quote (WF_HELD_SERVICE, WF_TKT_SERVICE)

```typescript
// ServiceList → OrderQuote
{
  "Query": {
    "OrderID": "ORDER_ID",
    "SelectedOffer": [{
      "OfferID": "SERVICE_OFFER_FROM_LIST",
      "Owner": "SQ",
      "OfferItems": [{
        "OfferItemID": "SERVICE_OI1",
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

### 3. Multiple Selections

```typescript
// Simultaneous seat/service quote for multiple passengers
{
  "Query": {
    "OrderID": "ORDER_ID",
    "SelectedOffer": [{
      "OfferID": "OFFER_1",
      "Owner": "SQ",
      "OfferItems": [
        {
          "OfferItemID": "OI1",
          "PaxRefID": ["PAX1"],
          "SeatSelection": { "Column": "G", "Row": "20" }
        },
        {
          "OfferItemID": "OI2",
          "PaxRefID": ["PAX2"],
          "SeatSelection": { "Column": "H", "Row": "20" }
        }
      ]
    }]
  }
}
```

---

## Promotion Application (FopPromotion)

**Add to SelectedOffer when applying credit card/payment method promotions.**

```typescript
{
  "Query": {
    "OrderID": "ORDER_ID",
    "SelectedOffer": [{
      "OfferID": "OFFER_FROM_AVAILABILITY",
      "Owner": "SQ",
      "OfferItems": [...],
      "FopPromotion": {
        "PromotionCode": "VISA2026",
        "PaymentType": "A",  // A=Card, C=Cash, K=KakaoPay, S=SamsungPay
        "CardCode": "VI",
        "CardName": "VISA"
      }
    }]
  }
}
```

---

## Specifying Affected OrderItems (Affect)

**Used when applying changes to specific OrderItems only. RetainService can be used to specify services to retain.**

```typescript
{
  "Query": {
    "OrderID": "ORDER_ID",
    "RepricedOrderID": {
      "OrderID": "ORDER_ID",
      "OrderItemRefID": ["OI1", "OI2"]
    },
    "Affect": [{
      "OrderItemRefID": "OI1",
      "RetainServiceID": ["SVC1", "SVC2"]  // Services to retain
    }, {
      "OrderItemRefID": "OI2",
      "RetainServiceID": ["SVC3"]
    }]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `OrderItemRefID` | `string` | Affected OrderItem ID |
| `RetainServiceID` | `string[]` | (Optional) List of service IDs to retain |

---

## Search Criteria Application (Criteria)

**Used when applying special fares or program fares.**

```typescript
{
  "Query": {
    "OrderID": "ORDER_ID",
    "SelectedOffer": [...],
    "Criteria": {
      "ProgramCriteria": [{
        "AirlineID": "SQ",
        "ContractID": "CONTRACT001",
        "TypeCode": "CORPORATE"
      }]
    },
    "ResponseParameter": {
      "CurrencyCode": "KRW",
      "LanguageUsage": { "LangCode": "ko" }
    }
  }
}
```

---

## Response Structure

```typescript
interface OrderQuoteResponse {
  QuotedOffer: Array<{
    OfferID: string;           // Used in OrderChange
    Owner: string;
    TotalPrice: {
      TotalAmount: { Amount: number; CurrencyCode: string };
    };
    OfferItem: Array<{
      OfferItemID: string;
      PaxRefID: string[];
      Service: {
        ServiceID: string;
        ServiceName: string;
      };
      Price: {
        TotalAmount: { Amount: number; CurrencyCode: string };
      };
    }>;
  }>;
}

// Next step: OrderChange (AcceptSelectedQuotedOfferList)
const quotedOffer = response.QuotedOffer[0];
```

---

## Passing to OrderChange

```typescript
// OrderQuote response → OrderChange request
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "AcceptSelectedQuotedOfferList": {
        "SelectedPricedOffer": [{
          "OfferID": quotedOffer.OfferID,      // From QuotedOffer
          "Owner": quotedOffer.Owner,
          "OfferItems": quotedOffer.OfferItem.map(item => ({
            "OfferItemID": item.OfferItemID,
            "PaxRefID": item.PaxRefID,
            // Retain SeatSelection or BookingInstructions
          }))
        }]
      }
    },
    "PaymentList": [{
      "PaymentMethod": { "Cash": { "CashPaymentInd": true } },
      "Amount": {
        "CurrencyCode": quotedOffer.TotalPrice.TotalAmount.CurrencyCode,
        "Amount": quotedOffer.TotalPrice.TotalAmount.Amount
      }
    }]
  }
}
```

---

## DTO Structure (NestJS)

### Mode 1: SelectedOffer (Seat/Service)

```typescript
export class SelectedOfferItemDto {
  @IsString() offerItemId: string;
  @IsArray() @IsString({ each: true }) paxRefId: string[];
  @IsOptional() @ValidateNested() seatSelection?: SeatSelectionDto;
  @IsOptional() @ValidateNested() bookingInstructions?: BookingInstructionsDto;
}

export class SelectedOfferDto {
  @IsString() offerId: string;
  @IsString() owner: string;
  @IsOptional() @IsString() responseId?: string;
  @ValidateNested({ each: true }) offerItems: SelectedOfferItemDto[];
  @IsOptional() @ValidateNested() @Type(() => FopPromotionDto)
  fopPromotion?: FopPromotionDto;  // Promotion application
}
```

### Mode 2: RepricedOrderID (Deferred Ticketing)

```typescript
export class RepricedOrderIdDto {
  @IsString() orderId: string;
  @IsOptional() @IsArray() @IsString({ each: true }) orderItemRefId?: string[];
}

export class AffectDto {
  @IsString() orderItemRefId: string;  // Affected OrderItem ID
  @IsOptional() @IsArray() @IsString({ each: true }) retainServiceId?: string[];  // Services to retain
}
```

### Unified Request DTO

> **IMPORTANT**: The two modes are mutually exclusive (only one can be used)

```typescript
export class OrderQuoteRequestDto {
  @IsString() transactionId: string;
  @IsString() orderId: string;

  // Mode 1: Seat/service quote
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SelectedOfferDto)
  selectedOffer?: SelectedOfferDto[];

  // Mode 2: Deferred ticketing fare recalculation (WF_HELD_CONFIRM)
  @IsOptional()
  @ValidateNested()
  @Type(() => RepricedOrderIdDto)
  repricedOrderId?: RepricedOrderIdDto;

  // Affected OrderItem + RetainService specification
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AffectDto)
  affect?: AffectDto[];

  // Criteria for special fares, programs, promotions
  @IsOptional()
  @ValidateNested()
  @Type(() => CriteriaDto)
  criteria?: CriteriaDto;

  // Response settings (currency, language)
  @IsOptional()
  @ValidateNested()
  @Type(() => ResponseParameterDto)
  responseParameter?: ResponseParameterDto;
}

export class QuotedOfferDto {
  @ApiProperty() offerId: string;
  @ApiProperty() owner: string;
  @ApiProperty() totalPrice: TotalPriceDto;
  @ApiProperty() offerItem: QuotedOfferItemDto[];
}

export class OrderQuoteResponseDto {
  @ApiProperty() transactionId: string;
  @ApiProperty({ type: [QuotedOfferDto] }) quotedOffer: QuotedOfferDto[];
}
```

---

## Airline Support Status

| Airline | Held Service | Ticketed Seat | Ticketed Service | Notes |
|---------|-------------|---------------|------------------|-------|
| AY, SQ, KL | ✅ | ✅ | ✅ | Full support |
| AF, TK, HA | ✅ | ✅ | ✅ | Full support |
| QR | ✅ | ✅ | ✅ | Full support |
| EK, LH | ❌ | ✅ | ✅ | Ticketed only |
| TR | ✅ | ❌ | ❌ | Held only |
| AA, BA | ❌ | ❌ | ❌ | Not supported |
| KE | ❌ | ❌ | ❌ | Not supported |

---

## Workflow Flows

### WF_HELD_SEAT (OrderQuote Not Required)
```
OrderRetrieve → SeatAvailability → OrderChange
```

### WF_HELD_SERVICE
```
OrderRetrieve → ServiceList → OrderQuote (SelectedOffer) → OrderChange
```

### WF_HELD_CONFIRM (Varies by Airline - CRITICAL)

> **Whether OrderQuote is required varies by airline!**

```
// SQ, AY, KL, etc. (OrderQuote required)
OrderRetrieve → OrderQuote (RepricedOrderID) → OrderChange (AcceptRepricedOrder)

// Some airlines (OrderQuote not required)
OrderRetrieve → OrderChange (AcceptRepricedOrder with OrderID as OfferRefID)
```

**When ticketing directly without OrderQuote:**
```typescript
// Use OrderID as OfferRefID
{
  "ChangeOrderChoice": {
    "AcceptRepricedOrder": {
      "OfferRefID": ["ORDER_ID"]  // Use OrderID directly without OrderQuote
    }
  },
  "PaymentList": [...]
}
```

### WF_TKT_SEAT
```
OrderRetrieve → SeatAvailability → OrderQuote (SelectedOffer) → OrderChange
```

### WF_TKT_SERVICE
```
OrderRetrieve → ServiceList → OrderQuote (SelectedOffer) → OrderChange
```

---

## Important Notes

### OfferID Passing
```typescript
// Pass the OfferID from SeatAvailability/ServiceList to OrderQuote
// Pass the QuotedOffer.OfferID from OrderQuote to OrderChange
// IDs may change, so always use the ID from the previous response
```

### Price Verification
```typescript
// Even free seats/services require a quote lookup (for TICKETED status)
if (response.QuotedOffer[0].TotalPrice.TotalAmount.Amount === 0) {
  // PaymentList can be omitted or included with Amount: 0
}
```

### Transaction ID Persistence (Pass-through Principle)
```typescript
// Generated by FE; middleware only passes through!
// ✅ FE responsibility - Maintain same ID within Post-Booking session
const txnId = crypto.randomUUID().replace(/-/g, '');  // Generated by FE
OrderRetrieve(txnId) → ServiceList(txnId) → OrderQuote(txnId) → OrderChange(txnId);

// ❌ Generation in middleware is prohibited
const txnId = generateTransactionId();  // Strictly prohibited!
```
