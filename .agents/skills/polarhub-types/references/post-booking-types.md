# Post-Booking Types Reference

Type definitions for OrderChange, OrderReshop, and OrderQuote APIs.

## OrderChange Types

### Request

```typescript
export type ChangeReasonCode =
  | 'DIV'   // Division (PNR split)
  | 'EXT'   // Extension
  | 'VOL'   // Voluntary (voluntary change)
  | 'INV';  // Involuntary (involuntary change)

export interface ChangeOrderChoice {
  // Choose one - mutually exclusive
  AcceptCancelledOffer?: { OfferID: string; Owner: string };
  AcceptChange?: { OrderItemRefID: string[] };
  AcceptOrderItemList?: {
    Owner: string;
    OfferItemRefID?: string[];
    PriceGuaranteeTimeLimit?: string;
  };
  AcceptRepricedOrder?: { OfferRefID: string[] };
  AcceptSelectedQuotedOfferList?: {
    SelectedPricedOffer: SelectedPricedOfferType[];
  };
  CancelUnpaidOrder?: {
    OrderRefID: string;
    Owner: string;
    SelectedOrderItemRefID?: string[];
  };
  UpdatePax?: UpdatePaxType[];
}

export interface SelectedPricedOfferType {
  OfferID: string;
  Owner: string;
  OfferItems: OfferItemRequestType[];
}

export interface UpdatePaxType {
  CurrentPaxRefID: string;
  NewPaxRefID: string;
}

export interface OrderChangeQuery {
  OrderID: string;
  ReasonCode?: ChangeReasonCode;
  ChangeOrderChoice?: ChangeOrderChoice;
  PaxList?: PaxType[];
  ContactInfoList?: ContactInfoType[];
  PaymentList?: PaymentType[];
  Criteria?: CriteriaType;
}
```

### Response

```typescript
export interface OrderChangeRS {
  ResultMessage: ResultMessageType;
  TransactionID: string;
  Order?: OrderViewOrderType;
  DataLists?: DataListType;
}
```

---

## OrderReshop Types

### Action Context Codes (PADIS REA)

```typescript
export type ActionContextCode =
  | '1'   // Flight schedule change (flight number)
  | '2'   // Flight schedule change (time)
  | '3'   // Flight cancellation
  | '4'   // Route withdrawal
  | '5'   // Labor dispute
  | '8'   // Voluntary (voluntary change) ★ Most commonly used
  | '9'   // No reason provided
  | '11'  // Strike
  | '12'  // Weather
  | '13'  // Natural disaster
  | '14'  // Security
  | '15'  // Equipment substitution
  | '16'; // Other
```

### Request

```typescript
export interface ReshopOrderType {
  ServiceOrder?: {
    Add?: {
      OriginDestList: OriginDestRequestType[];
      Cabin?: CabinCode;
      ShoppingResponse?: { ResponseRefID: string; OfferRefID: string };
      Criteria?: CriteriaType;
    };
    Delete?: {
      OrderItemRefID: string[];
      RetainServiceID?: string[];
    };
  };
  UpdatePaxName?: {
    PaxRefID: string;
    NameTitle?: string;
    GivenName?: string[];
    Surname?: string;
  }[];
}

export interface UpdateOrderType {
  ReshopOrder?: ReshopOrderType;           // Itinerary change
  RepricedOrderRefID?: string;             // Repricing (CRITICAL: string type!)
  CancelOrderRefID?: string;               // Refund (CRITICAL: string type!)
}

// CRITICAL: RepricedOrderRefID and CancelOrderRefID are strings, not objects!
// Defined as "type": "string" in the OpenAPI spec

export interface OrderReshopQuery {
  OrderID: string;
  UpdateOrder: UpdateOrderType;
  ActionContext?: ActionContextCode;
  Criteria?: CriteriaType;
}
```

### Response

```typescript
export interface ReshopOfferType extends OfferType {
  PenaltyAmount?: AmountType;    // Change fee
  RefundAmount?: AmountType;     // Refund amount
  DifferenceAmount?: AmountType; // Fare difference
}

export interface OrderReshopRS {
  ResultMessage: ResultMessageType;
  TransactionID: string;
  ReshopOffer?: ReshopOfferType[];
  Order?: OrderViewOrderType;
  DataLists?: DataListType;
}
```

---

## OrderQuote Types

### Request

```typescript
export interface SelectedOfferType {
  OfferID: string;
  Owner: string;
  OfferItems: Array<{
    OfferItemID: string;
    PaxRefID: string[];
    SeatSelection?: SeatSelectionType;
    BookingInstructions?: {
      SsrCode?: string;    // FBAG, ABAG, XBAG, SEAT
      OsiText?: string;
      UpgradeMethod?: string;
      Method?: string;
      Equipment?: string;
    };
  }>;
}

export interface RepricedOrderIDType {
  OrderID: string;
  OrderItemRefID?: string[];
}

export interface AffectType {
  OrderItemRefID: string;
  RetainServiceID?: string[];
}

export interface OrderQuoteQuery {
  OrderID?: string;
  SelectedOffer?: SelectedOfferType[];
  RepricedOrderID?: RepricedOrderIDType;
  Affect?: AffectType[];              // Specifies affected OrderItems + RetainService
  Criteria?: CriteriaType;
  ResponseParameter?: ResponseParameterType;
}
```

### Response

```typescript
export interface QuotedOfferType {
  OfferID: string;
  Owner: string;
  TotalPrice: TotalPriceType;
  OfferItem: OfferItemType[];
  ValidUntil?: string;  // Quote validity deadline
}

export interface OrderQuoteRS {
  ResultMessage: ResultMessageType;
  TransactionID: string;
  QuotedOffer?: QuotedOfferType[];
  DataLists?: DataListType;
}
```
