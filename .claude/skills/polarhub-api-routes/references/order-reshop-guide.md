# OrderReshop API Guide

The OrderReshop API is used for **itinerary change search and refund quote retrieval**.

## Supported Workflows

| Workflow ID | Description | Phase | Purpose |
|-------------|-------------|-------|---------|
| `WF_HELD_ITIN` | Hold itinerary change | Post-Held | Itinerary change search |
| `WF_TKT_VOLCHANGE` | Voluntary itinerary change | Post-Ticketed | Itinerary change search |
| `WF_TKT_REFUND` | Refund | Post-Ticketed | Refund quote retrieval |
| `WF_HELD_CONFIRM` | **Deferred ticketing (LH, EK, etc.)** | Post-Held | **Repricing retrieval** |

---

## Request Structure by Purpose

### 1. Itinerary Change Search (ITIN/VOLCHANGE)

> **IMPORTANT**: Per OpenAPI spec, `Delete` is an **array of objects**, not `{ OrderItemRefID: string[] }`.

```typescript
// WF_HELD_ITIN, WF_TKT_VOLCHANGE
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ActionContext": "8",  // 8 = Voluntary
    "UpdateOrder": {
      "ReshopOrder": {
        "ServiceOrder": {
          "Delete": [{                              // Array format!
            "OrderItemRefID": "OLD_SEGMENT_OI1",    // Segment to delete (single string)
            "RetainServiceID": ["SVC1", "SVC2"]     // Services to retain (optional)
          }],
          "Add": {
            "OriginDestList": [{
              "OriginCode": "ICN",
              "DestCode": "SIN",
              "DepartureDate": "2025-07-01"  // New date
            }],
            "Cabin": "Y"
          }
        }
      }
    }
  }
}
```

### 2. Refund Quote Retrieval (REFUND)

> **IMPORTANT**: `CancelOrderRefID` is a **string** type. It is NOT an object!

```typescript
// WF_TKT_REFUND - CancelOrderRefID is a string!
{
  "Query": {
    "OrderID": "ORDER_ID",
    "UpdateOrder": {
      "CancelOrderRefID": "ORDER_ID"  // ✅ Pass directly as string
    }
  }
}

// ❌ WRONG - Passing as object causes 400 Bad Request
{
  "UpdateOrder": {
    "CancelOrderRefID": { "OrderID": "..." }  // Wrong format!
  }
}
```

### 3. Deferred Ticketing Repricing (LH, EK, etc.) - CRITICAL

> **IMPORTANT**: Some airlines (LH, EK, etc.) require the `RepricedOrderRefID` field for deferred ticketing!

```typescript
// WF_HELD_CONFIRM (Deferred ticketing - LH, EK, etc.)
{
  "Query": {
    "OrderID": "TSDEV-20240312-d20663409d8acb35",
    "UpdateOrder": {
      "RepricedOrderRefID": "TSDEV-20240312-d20663409d8acb35"  // ✅ String!
    }
  }
}
```

**3 Uses of UpdateOrder:**

| Field | Purpose | Workflow | Type |
|-------|---------|----------|------|
| `ReshopOrder` | Itinerary change search | WF_HELD_ITIN, WF_TKT_VOLCHANGE | Object |
| `CancelOrderRefID` | Refund quote retrieval | WF_TKT_REFUND | **String** |
| `RepricedOrderRefID` | **Deferred ticketing (LH, EK, etc.)** | WF_HELD_CONFIRM | **String** |

---

## ActionContext Values

| Value | Description | Purpose |
|-------|-------------|---------|
| `8` | Voluntary | Customer-requested itinerary change |
| `9` | Involuntary | Response to airline schedule change |

---

## Response Structure

### Itinerary Change Response
```typescript
interface OrderReshopResponse {
  ReshopOffer: Array<{
    OfferID: string;
    Owner: string;
    TotalPrice: {
      TotalAmount: { Amount: number; CurrencyCode: string };
    };
    PriceDifference: {  // Price difference
      Amount: number;
      CurrencyCode: string;
    };
    OfferItem: Array<{
      OfferItemID: string;
      FlightRef: string[];
      Service: {
        FlightSegment: { ... };
      };
    }>;
  }>;
}

// Next step: OrderChange (AcceptRepricedOrder)
const selectedOffer = response.ReshopOffer[0];
```

### Refund Quote Response
```typescript
interface OrderReshopRefundResponse {
  RefundQuote: {
    RefundQuoteID: string;     // Used in OrderCancel
    RefundAmount: {
      Amount: number;
      CurrencyCode: string;
    };
    Penalty: {                  // Penalty fee
      Amount: number;
      CurrencyCode: string;
    };
    NetRefund: {               // Net refund amount
      Amount: number;
      CurrencyCode: string;
    };
  };
}

// Next step: OrderCancel (using RefundQuoteID)
const { RefundQuoteID } = response.RefundQuote;
```

---

## Itinerary Change Scenarios

### Departure Date Change
```typescript
// Same route, different date
// Per OpenAPI: Delete is Array<{ OrderItemRefID: string, RetainServiceID?: string[] }>
{
  "Delete": [{ "OrderItemRefID": "SEG1_OI" }],  // Pass as array!
  "Add": {
    "OriginDestList": [{
      "OriginCode": "ICN",   // Same
      "DestCode": "SIN",     // Same
      "DepartureDate": "2025-07-15"  // Changed date
    }]
  }
}
```

### Route Change
```typescript
// Different destination
{
  "Delete": [{ "OrderItemRefID": "SEG1_OI" }],  // Pass as array!
  "Add": {
    "OriginDestList": [{
      "OriginCode": "ICN",   // Same
      "DestCode": "BKK",     // Changed destination
      "DepartureDate": "2025-06-15"
    }]
  }
}
```

### Multiple Segment Change
```typescript
// Change only return leg of round trip
{
  "Delete": [{ "OrderItemRefID": "RETURN_SEG_OI" }],  // Pass as array!
  "Add": {
    "OriginDestList": [{
      "OriginCode": "SIN",
      "DestCode": "ICN",
      "DepartureDate": "2025-07-01"  // Changed return date
    }]
  }
}
```

---

## DTO Structure (NestJS)

> **CRITICAL**: Nested objects must **always** use both `@ValidateNested()` and `@Type()` decorators together.
> **IMPORTANT**: The DTO structure below is based on the OpenAPI spec (`spec/polarhub.openapi.json`).

```typescript
import { ValidateNested, IsOptional, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// Per OpenAPI: Delete item is { OrderItemRefID: string, RetainServiceID?: string[] }
export class DeleteItemDto {
  @IsString()
  orderItemRefId: string;  // Single string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  retainServiceId?: string[];  // Service IDs to retain
}

export class AddOriginDestDto {
  @IsString() originCode: string;
  @IsString() destCode: string;
  @IsString() departureDate: string;
}

export class AddServiceOrderDto {
  @ValidateNested({ each: true })
  @Type(() => AddOriginDestDto)  // REQUIRED!
  originDestList: AddOriginDestDto[];

  @IsOptional()
  @IsString()
  cabin?: string;
}

// Per OpenAPI: Delete is an array of DeleteItemDto
export class ServiceOrderDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeleteItemDto)
  delete?: DeleteItemDto[];  // Array<{ orderItemRefId, retainServiceId? }>

  @IsOptional()
  @ValidateNested()
  @Type(() => AddServiceOrderDto)
  add?: AddServiceOrderDto;
}

export class ReshopOrderDto {
  @ValidateNested()
  @Type(() => ServiceOrderDto)
  serviceOrder: ServiceOrderDto;
}

/**
 * IMPORTANT: CancelOrderRefID and RepricedOrderRefID are STRING types (NOT objects!)
 * Refer to PolarHub API spec:
 * - "CancelOrderRefID": { "type": "string" }
 * - "RepricedOrderRefID": { "type": "string" }
 */
export class UpdateOrderDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ReshopOrderDto)
  reshopOrder?: ReshopOrderDto;

  // ✅ CORRECT - String type
  @IsOptional()
  @IsString()
  cancelOrderRefId?: string;  // NOT an object!

  // ✅ CORRECT - For deferred ticketing (LH, EK, etc.) - String type
  @IsOptional()
  @IsString()
  repricedOrderRefId?: string;  // NOT an object!
}

export class OrderReshopRequestDto {
  @IsString() transactionId: string;
  @IsString() orderId: string;
  @IsOptional() @IsString() actionContext?: string;

  @ValidateNested()
  @Type(() => UpdateOrderDto)
  updateOrder: UpdateOrderDto;
}
```

---

## Airline Support Status

| Airline | Held Itinerary Change | Ticketed Itinerary Change | Refund | Notes |
|---------|----------------------|--------------------------|--------|-------|
| AY, SQ, KL | ✅ | ✅ | ✅ | Full support |
| AF | ✅ | ✅ | ✅ | Full support |
| TK, HA | ❌ | ✅ | ✅ | Ticketed only |
| QR | ❌ | ❌ | ✅ | Refund only |
| EK, LH | ❌ | ❌ | ✅ | Refund only |
| AA, BA | ❌ | ❌ | ✅ | Refund only |
| TR | ❌ | ❌ | ✅ | Refund only |
| KE | ❌ | ❌ | ❌ | Not supported |

---

## Important Notes

### Identifying OrderItemRefID
```typescript
// Identify the segment's OrderItemID to delete from OrderRetrieve response
const segmentToDelete = orderRetrieveResponse.Order.OrderItem
  .filter(item => /* condition for segment to change */)
  .map(item => item.OrderItemID);
```

### Price Difference Handling
```typescript
// Check price difference for itinerary changes
const priceDiff = reshopResponse.ReshopOffer[0].PriceDifference.Amount;

if (priceDiff > 0) {
  // Additional payment required → Include in OrderChange PaymentList
}
if (priceDiff < 0) {
  // Refund → Depends on airline policy (most handle as credit)
}
```

### Next Steps

```typescript
// Itinerary change: OrderChange (AcceptRepricedOrder)
// Per OpenAPI: AcceptRepricedOrder only accepts OfferRefID array (NOT PricedOffer!)
{
  "ChangeOrderChoice": {
    "AcceptRepricedOrder": {
      "OfferRefID": ["OFFER_FROM_RESHOP"]  // OfferRefID from OrderReshop response
    }
  },
  "PaymentList": [...]  // Price difference
}

// Refund: OrderCancel (RefundQuoteID)
{
  "OrderID": "...",
  "RefundQuoteID": "from_reshop"
}
```
