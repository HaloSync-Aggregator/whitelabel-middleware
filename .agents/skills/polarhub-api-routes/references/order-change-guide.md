# OrderChange API Guide

The OrderChange API handles **7 types of booking modifications**.

## Supported Workflows

| Workflow ID | Description | ChangeOrderChoice | Preceding API | Notes |
|-------------|-------------|-------------------|---------------|-------|
| `WF_HELD_SEAT` | Hold seat change | `AcceptSelectedQuotedOfferList` | SeatAvailability | |
| `WF_HELD_SERVICE` | Hold service addition | `AcceptSelectedQuotedOfferList` | ServiceList → OrderQuote | |
| `WF_HELD_CONFIRM` | Booking confirmation (ticketing) | `AcceptRepricedOrder` | **[OrderQuote]** | Varies by airline |
| `WF_HELD_ITIN` | Hold itinerary change | `AcceptRepricedOrder` | OrderReshop | |
| `WF_HELD_PAX` | Passenger info change | `UpdatePax` | - | |
| `WF_HELD_SPLIT` | PNR split | `UpdatePax` + `ReasonCode: DIV` | - | Query level |
| `WF_TKT_SEAT` | Post-ticketed seat change | `AcceptSelectedQuotedOfferList` | SeatAvailability → OrderQuote | |
| `WF_TKT_SERVICE` | Post-ticketed service addition | `AcceptSelectedQuotedOfferList` | ServiceList → OrderQuote | |
| `WF_TKT_VOLCHANGE` | Voluntary itinerary change | **`AcceptSelectedQuotedOfferList`** | OrderReshop → **OrderQuote** | ResponseID required |
| `WF_TKT_OCN` | Involuntary change acceptance | `AcceptChange` | - | |

> **WF_HELD_CONFIRM Note (Per OpenAPI Spec)**:
> - **Uses AcceptRepricedOrder** (NOT AcceptOrderItemList!)
> - Some airlines (SQ, AY, KL) require OrderQuote(RepricedOrderID)
> - Without OrderQuote: `OfferRefID = [OrderID]`

---

## Request Structure by ChangeOrderChoice Type

### 1. AcceptSelectedQuotedOfferList (Seat/Service Changes)

```typescript
// WF_HELD_SEAT, WF_HELD_SERVICE, WF_TKT_SEAT, WF_TKT_SERVICE
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "AcceptSelectedQuotedOfferList": {
        "SelectedPricedOffer": [{
          "OfferID": "from_order_quote",
          "Owner": "SQ",
          "OfferItems": [{
            "OfferItemID": "OI1",
            "PaxRefID": ["PAX1"],
            "SeatSelection": { "Column": "G", "Row": "20" }  // For seat changes
            // or
            // "BookingInstructions": { "Text": ["TTL10KG"] }  // For service changes
          }]
        }]
      }
    },
    "PaymentList": [{
      "PaymentMethod": { "Cash": { "CashPaymentInd": true } },
      "Amount": { "CurrencyCode": "KRW", "Amount": 50000 }
    }]
  }
}
```

### 2. Deferred Ticketing / Booking Confirmation (WF_HELD_CONFIRM) - 3 Methods

> **CRITICAL**: There are 3 methods for deferred ticketing (WF_HELD_CONFIRM)!

#### Method 1: `repricedOrderId` (Query Level) - Recommended ✅

> **NEW (2026-01-27)**: When FE sends `repricedOrderId` directly, it maps to `Query.RepricedOrderID`.

```typescript
// FE request format
{
  "transactionId": "4ba5a0b50d2c45b3b5eb343b57ba8897",
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

// PolarHub API transformed result
{
  "Sender": {
    "TravelAgency": {
      "AgencyID": "YOUR_TENANT_ID",
      "SiteCode": "01",
      "ContactInfoRefID": ["CTC_TA1"]  // Auto-injected from environment variable
    }
  },
  "PointOfSale": "KR",
  "TransactionID": "4ba5a0b50d2c45b3b5eb343b57ba8897",
  "Query": {
    "OrderID": "TSDEV-20260126-424c888145864d24",
    "RepricedOrderID": {
      "OrderID": "TSDEV-20260126-424c888145864d24",
      "OrderItemRefID": ["AY1059O3QVT00_AIR-1-2", "AY1059O3QVT00_SRV14"]
    }
  }
}
```

#### Method 2: `changeOrderChoice.acceptRepricedOrder` (Existing Approach)

> **CRITICAL**: Per OpenAPI spec examples, WF_HELD_CONFIRM uses `AcceptRepricedOrder`!
> (AcceptOrderItemList is defined in the spec but has no examples)

```typescript
// WF_HELD_CONFIRM - When using OrderQuote (SQ, AY, KL, etc.)
// Flow: OrderRetrieve → OrderQuote(RepricedOrderID) → OrderChange
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "AcceptRepricedOrder": {
        "OfferRefID": ["OFFER_ID_FROM_ORDER_QUOTE"]  // OfferID from OrderQuote response
      }
    },
    "PaymentList": [{
      "Type": "Cash",
      "Amount": 850000,
      "CurCode": "KRW"
    }]
  }
}
```

#### Method 3: `changeOrderChoice.acceptRepricedOrder` (Without OrderQuote)

```typescript
// WF_HELD_CONFIRM - Without OrderQuote
// Flow: OrderRetrieve → OrderChange (directly)
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "AcceptRepricedOrder": {
        "OfferRefID": ["ORDER_ID"]  // Use OrderID as OfferRefID!
      }
    },
    "PaymentList": [{
      "Type": "Cash",
      "Amount": 850000,
      "CurCode": "KRW"
    }]
  }
}
```

#### Deferred Ticketing Method Comparison

| Method | FE Field | PolarHub Query Field | Purpose |
|--------|----------|---------------------|---------|
| **Method 1** | `repricedOrderId` (object) | `Query.RepricedOrderID` | When OrderItemRefID specification is needed |
| **Method 2** | `changeOrderChoice.acceptRepricedOrder.offerRefId` | `Query.ChangeOrderChoice.AcceptRepricedOrder.OfferRefID` | Using OrderQuote response OfferID |
| **Method 3** | `changeOrderChoice.acceptRepricedOrder.offerRefId` | `Query.ChangeOrderChoice.AcceptRepricedOrder.OfferRefID` | Using OrderID as OfferRefID |

### 2-1. AcceptOrderItemList (Use Case Unconfirmed)

> **NOTE**: Type definition exists in OpenAPI spec but no usage examples. Actual use cases need verification.

```typescript
// Per OpenAPI spec: AcceptOrderItemList = { Owner: string, OfferItemRefID?: string, ... }
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "AcceptOrderItemList": {
        "Owner": "SQ",                      // Required
        "OfferItemRefID": "OI1",            // Optional (single string)
        "PriceGuaranteeTimeLimit": "2025-06-15T23:59:59Z",
        "WebAddressURI": "https://..."
      }
    },
    "PaymentList": [...]
  }
}
```

### 3. AcceptRepricedOrder (Hold Itinerary Change) - WF_HELD_ITIN

> **IMPORTANT**: Per OpenAPI spec, `AcceptRepricedOrder` only has `OfferRefID` (string array). No `PricedOffer` object!
> - WF_HELD_ITIN: Uses OfferRefID from OrderReshop response

```typescript
// WF_HELD_ITIN (Itinerary change in Hold status)
// Flow: OrderRetrieve → OrderReshop → OrderChange
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "AcceptRepricedOrder": {
        "OfferRefID": ["OFFER_ID_FROM_ORDER_RESHOP"]  // OfferID from OrderReshop response
      }
    },
    "PaymentList": [{
      "Type": "Cash",
      "Amount": 150000,  // Price difference
      "CurCode": "KRW"
    }]
  }
}
```

### 3-1. AcceptSelectedQuotedOfferList (Post-Ticketed Itinerary Change) - WF_TKT_VOLCHANGE (CRITICAL)

> **CRITICAL UPDATE (2026-01-15)**: Post-ticketed itinerary changes use `AcceptSelectedQuotedOfferList`, NOT `AcceptRepricedOrder`!
> - Using `AcceptRepricedOrder` causes "INVALID SEGMENT SELECTION" error
> - `ResponseID` field is required (use OrderID value)
> - Flow: OrderRetrieve → OrderReshop → **OrderQuote** → OrderChange

```typescript
// WF_TKT_VOLCHANGE (Post-ticketed voluntary itinerary change)
// Flow: OrderRetrieve → OrderReshop → OrderQuote → OrderChange
{
  "Query": {
    "OrderID": "TSDEV-20260115-e6a3e3934d4d8e87",
    "ChangeOrderChoice": {
      "AcceptSelectedQuotedOfferList": {
        "SelectedPricedOffer": [{
          "OfferID": "ab167a5beb0a461cb21902d1459a194f21.3-1",     // OfferID from OrderQuote response
          "Owner": "SQ",
          "ResponseID": "TSDEV-20260115-e6a3e3934d4d8e87",          // Required! Use OrderID value
          "OfferItems": [{
            "OfferItemID": "ab167a5beb0a461cb21902d1459a194f21.3-1-1",  // OfferItemID from OrderQuote
            "PaxRefID": ["PAX2", "PAX3", "PAX4"]                        // Target passengers
          }]
        }]
      },
      "UpdatePax": []
    },
    "PaymentList": [{
      "Type": "Cash",
      "Amount": 482100,    // ReshopDue amount from OrderQuote
      "CurCode": "KRW"
    }]
  }
}
```

#### WF_TKT_VOLCHANGE vs WF_HELD_ITIN Comparison

| Aspect | WF_HELD_ITIN (Hold) | WF_TKT_VOLCHANGE (Ticketed) |
|--------|--------------------|-----------------------------|
| Status | Hold (not yet ticketed) | Ticketed (ticketing complete) |
| ChangeOrderChoice | `AcceptRepricedOrder` | **`AcceptSelectedQuotedOfferList`** |
| Required Fields | `OfferRefID` | `OfferID`, `Owner`, **`ResponseID`**, `OfferItems` |
| Preceding API | OrderReshop | OrderReshop → **OrderQuote** |
| PaymentList | Required when price difference exists | ✅ Required |

#### Error When ResponseID is Missing

```json
{
  "code": "50599",
  "message": " (911) [INVALID SEGMENT SELECTION]  * INVALID SEGMENT SELECTION Airline response error"
}
```

### 4. UpdatePax (Passenger Info Change)

> **CRITICAL: 3 Operation Modes of UpdatePax (airline support varies)**

| Mode | Request Structure | Action | Airline Support |
|------|-------------------|--------|-----------------|
| **Add** | `{ newPaxRefId: "PAX1" }` | Add information | AY, SQ, KL, etc. ✅ |
| **Delete** | `{ currentPaxRefId: "PAX1" }` | Delete information | AY, SQ, KL, etc. ✅ |
| **Update** | `{ currentPaxRefId: "PAX1", newPaxRefId: "PAX1" }` | Modify information | **Not supported by some airlines** |

> **WARNING (AY and some airlines)**:
> - Update mode may return a **success response (00000)** even when data is not actually changed
> - In such cases, it is recommended to process in **Add → Delete** order

#### 4-1. Add Information - NewPaxRefID Only

```typescript
// WF_HELD_PAX - Add contact (NewPaxRefID only = Add mode)
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "UpdatePax": [{
        "NewPaxRefID": "PAX2"  // No CurrentPaxRefID = Add!
      }]
    },
    "PaxList": [{
      "PaxID": "PAX2",
      "Ptc": "ADT",
      "ContactInfoRefID": ["CTCPAX2_1", "CTCPAX2_2", "CTCPAX2_PHONE_NEW"]  // Including new ID
    }],
    "ContactInfoList": [{
      "ContactInfoID": "CTCPAX2_PHONE_NEW",  // New ContactInfoID
      "Phone": [{
        "CountryDialingCode": "82",
        "PhoneNumber": "1099998888"  // Phone number to add
      }]
    }]
  }
}
```

#### 4-2. Delete Information - CurrentPaxRefID Only

```typescript
// WF_HELD_PAX - Delete contact (CurrentPaxRefID only = Delete mode)
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "UpdatePax": [{
        "CurrentPaxRefID": "PAX2"  // No NewPaxRefID = Delete!
      }]
    },
    "PaxList": [{
      "PaxID": "PAX2",
      "Ptc": "ADT",
      "ContactInfoRefID": ["CTCPAX2_1"]  // Only ContactInfo to retain
    }],
    "ContactInfoList": [{
      "ContactInfoID": "CTCPAX2_1",
      "Phone": [{
        "CountryDialingCode": "82",
        "PhoneNumber": "1099998888"  // Phone number to delete
      }]
    }]
  }
}
```

#### 4-3. Update Information - Both Used (Not Supported by Some Airlines)

```typescript
// WF_HELD_PAX - Name/birthdate/gender change
// WARNING: Not supported by some airlines like AY (data may not change even with success response)
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "UpdatePax": [{
        "CurrentPaxRefID": "PAX1",
        "NewPaxRefID": "PAX1"
      }]
    },
    "PaxList": [{
      "PaxID": "PAX1",
      "Ptc": "ADT",
      "Individual": {
        "NameTitle": "MR",
        "GivenName": ["NEWNAME"],  // Changed name
        "Surname": "HONG",
        "Birthdate": "1990-01-15",
        "Gender": "MALE"  // Uppercase required!
      }
    }]
  }
}

// WF_HELD_PAX - Email/phone number change (using ContactInfoList)
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "UpdatePax": [{
        "CurrentPaxRefID": "PAX2",
        "NewPaxRefID": "PAX2"
      }]
    },
    "ContactInfoList": [{
      "ContactInfoID": "CTCPAX2_2",  // Existing ContactInfoID
      "EmailAddress": ["newemail@example.com"],  // Changed email (array)
      "Phone": [{
        "Label": "Mobile",
        "CountryDialingCode": "82",
        "PhoneNumber": "1012345678"  // Changed phone number
      }],
      "ContactRefusedInd": false
    }]
  }
}

// WF_HELD_PAX - Full passenger info change (Individual + IdentityDoc + ContactInfo)
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "UpdatePax": [{ "NewPaxRefId": "PAX2" }]
    },
    "PaxList": [{
      "PaxID": "PAX2",
      "Ptc": "ADT",
      "Individual": {
        "NameTitle": "MS",
        "GivenName": ["MIRIAM"],
        "Surname": "FADEL",
        "Birthdate": "2004-03-20",
        "Gender": "FEMALE"  // Uppercase required!
      },
      "IdentityDoc": [{
        "IdentityDocumentType": "PT",
        "IdentityDocumentNumber": "M48988902",
        "Birthdate": "2004-03-20",
        "ExpiryDate": "2028-11-15",
        "IssuingCountryCode": "KR",
        "CitizenshipCountryCode": "KR"
      }],
      "ContactInfoRefID": ["CTCPAX2_1", "CTCPAX2_2"]  // ContactInfo association
    }],
    "ContactInfoList": [{
      "ContactInfoID": "CTCPAX2_2",
      "EmailAddress": ["newemail@example.com"]
    }]
  }
}
```

### 5. UpdatePax + DIV (PNR Split)

> **IMPORTANT**: Per OpenAPI spec:
> - `ReasonCode` is at **Query level**, NOT inside ChangeOrderChoice
> - `CurrentPaxRefID` is **optional** (often only `NewPaxRefID` is provided for PNR split)

```typescript
// WF_HELD_SPLIT
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ReasonCode": "DIV",  // At Query level! (NOT inside ChangeOrderChoice)
    "ChangeOrderChoice": {
      "UpdatePax": [{
        "NewPaxRefID": "PAX4"  // CurrentPaxRefID is optional for split
      }]
    },
    "PaxList": [{
      "PaxID": "PAX2",
      "Ptc": "ADT",
      "Individual": { ... }
    }]
  }
}
```

### 6. AcceptChange (OCN Acceptance)

> **IMPORTANT**: Per OpenAPI spec, `AcceptChange` uses `OrderItemRefID` (string array), NOT `ChangeID`.

```typescript
// WF_TKT_OCN
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "AcceptChange": {
        "OrderItemRefID": ["OI1", "OI2"]  // OrderItem IDs to accept involuntary change for
      }
    }
  }
}
```

### 7. CancelUnpaidOrder (Unpaid Cancellation)

```typescript
// Cancel without payment in Hold status (some airlines)
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "CancelUnpaidOrder": {
        "OrderRefID": "ORDER_ID",
        "Owner": "SQ",
        "SelectedOrderItemRefID": []  // Empty array = cancel all
      }
    }
  }
}
```

### 8. AcceptCancelledOffer (Ancillary Service Refund)

> **IMPORTANT**: Used for processing refunds of ancillary services (seats, baggage, etc.).

```typescript
// WF_TKT_ANCILLARY_REFUND
{
  "Query": {
    "OrderID": "ORDER_ID",
    "ChangeOrderChoice": {
      "AcceptCancelledOffer": {
        "OfferID": "CANCELLED_OFFER_ID",  // Offer ID to cancel
        "Owner": "SQ"                       // Airline code
      }
    }
  }
}
```

---

## Preceding APIs by Workflow

| Workflow | Preceding API | OrderChange Type | Notes |
|----------|---------------|-----------------|-------|
| WF_HELD_SEAT | SeatAvailability | AcceptSelectedQuotedOfferList | |
| WF_HELD_SERVICE | ServiceList → OrderQuote | AcceptSelectedQuotedOfferList | |
| WF_HELD_CONFIRM | - | AcceptRepricedOrder | PaymentList required |
| WF_HELD_ITIN | OrderReshop | AcceptRepricedOrder | Hold status |
| WF_HELD_PAX | - | UpdatePax | |
| WF_HELD_SPLIT | - | UpdatePax + DIV | |
| WF_TKT_SEAT | SeatAvailability → OrderQuote | AcceptSelectedQuotedOfferList | |
| WF_TKT_SERVICE | ServiceList → OrderQuote | AcceptSelectedQuotedOfferList | |
| **WF_TKT_VOLCHANGE** | OrderReshop → **OrderQuote** | **AcceptSelectedQuotedOfferList** | ResponseID required! |
| WF_TKT_OCN | - | AcceptChange | |

---

## DTO Structure (NestJS)

> **IMPORTANT**: The DTO structure below is based on the OpenAPI spec (`spec/polarhub.openapi.json`).

```typescript
export class SelectedPricedOfferDto {
  @IsString() offerId: string;
  @IsString() owner: string;
  @IsOptional() @IsString() responseId?: string;  // CRITICAL: Required for post-ticketed itinerary change (WF_TKT_VOLCHANGE)!
  @ValidateNested({ each: true })
  @Type(() => OfferItemDto)
  offerItems: OfferItemDto[];
  @IsOptional() @ValidateNested() @Type(() => FopPromotionDto)
  fopPromotion?: FopPromotionDto;  // Promotion application
}

export class AcceptSelectedQuotedOfferListDto {
  @ValidateNested({ each: true })
  @Type(() => SelectedPricedOfferDto)
  selectedPricedOffer: SelectedPricedOfferDto[];
}

// Per OpenAPI: { Owner: string (required), OfferItemRefID?: string, ... }
export class AcceptOrderItemListDto {
  @IsString() owner: string;  // Required!
  @IsOptional() @IsString() offerItemRefId?: string;  // Single string
  @IsOptional() @IsString() priceGuaranteeTimeLimit?: string;
  @IsOptional() @IsString() webAddressUri?: string;
}

// Per OpenAPI: { OfferRefID: string[] }
export class AcceptRepricedOrderDto {
  @IsArray() @IsString({ each: true }) offerRefId: string[];  // String array
}

// Per OpenAPI spec: BOTH CurrentPaxRefID and NewPaxRefID are OPTIONAL
// - Add mode: NewPaxRefID only (no CurrentPaxRefID) → Add information
// - Delete mode: CurrentPaxRefID only (no NewPaxRefID) → Delete information
// - Update mode: Both CurrentPaxRefID and NewPaxRefID → Modify information (not supported by some airlines)
export class UpdatePaxDto {
  @IsOptional() @IsString() currentPaxRefId?: string;  // Delete/Update mode
  @IsOptional() @IsString() newPaxRefId?: string;      // Add/Update mode (CRITICAL: optional!)
}

// Per OpenAPI: { OrderItemRefID: string[] }
export class AcceptChangeDto {
  @IsArray() @IsString({ each: true }) orderItemRefId: string[];  // String array
}

// Per OpenAPI: { OfferID: string, Owner: string } - for ancillary refunds
export class AcceptCancelledOfferDto {
  @IsString() offerId: string;  // Offer ID to cancel
  @IsString() owner: string;     // Airline code
}

// Per OpenAPI: { OrderRefID: string, Owner: string, SelectedOrderItemRefID?: string[] }
export class CancelUnpaidOrderDto {
  @IsString() orderRefId: string;
  @IsString() owner: string;
  @IsOptional() @IsArray() @IsString({ each: true }) selectedOrderItemRefId?: string[];
}

export class ChangeOrderChoiceDto {
  @IsOptional() @ValidateNested() @Type(() => AcceptSelectedQuotedOfferListDto)
  acceptSelectedQuotedOfferList?: AcceptSelectedQuotedOfferListDto;

  @IsOptional() @ValidateNested() @Type(() => AcceptOrderItemListDto)
  acceptOrderItemList?: AcceptOrderItemListDto;

  @IsOptional() @ValidateNested() @Type(() => AcceptRepricedOrderDto)
  acceptRepricedOrder?: AcceptRepricedOrderDto;

  @IsOptional() @ValidateNested({ each: true }) @Type(() => UpdatePaxDto)
  updatePax?: UpdatePaxDto[];

  @IsOptional() @ValidateNested() @Type(() => AcceptChangeDto)
  acceptChange?: AcceptChangeDto;

  @IsOptional() @ValidateNested() @Type(() => AcceptCancelledOfferDto)
  acceptCancelledOffer?: AcceptCancelledOfferDto;  // Ancillary service refund

  @IsOptional() @ValidateNested() @Type(() => CancelUnpaidOrderDto)
  cancelUnpaidOrder?: CancelUnpaidOrderDto;  // Unpaid cancellation

  // NOTE: reasonCode moved to OrderChangeRequestDto (Query level per OpenAPI spec)
}

// IndividualDto - Nested objects must use @ValidateNested() + @Type()!
export class IndividualDto {
  @IsOptional() @IsString() nameTitle?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) givenName?: string[];
  @IsString() surname: string;  // Required
  @IsOptional() @IsString() birthdate?: string;
  @IsOptional() @IsString() gender?: string;  // Uppercase: MALE, FEMALE, UNSPECIFIED
}

// IdentityDocDto - Passport information (import from order.dto.ts)
export class IdentityDocDto {
  @IsString() identityDocType: string;  // 'PT' for passport
  @IsString() identityDocId: string;    // Passport number
  @IsString() birthdate: string;
  @IsString() expiryDate: string;
  @IsString() issuingCountryCode: string;
  @IsString() citizenshipCountryCode: string;
}

export class PaxDetailDto {
  @IsString() paxId: string;
  @IsString() ptc: string;
  @IsOptional() @ValidateNested() @Type(() => IndividualDto)  // CRITICAL: @Type required!
  individual?: IndividualDto;
  // IdentityDoc for passport info changes
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => IdentityDocDto)
  identityDoc?: IdentityDocDto[];
  // ContactInfoRefId links passenger to ContactInfoList entries
  @IsOptional() @IsArray() @IsString({ each: true })
  contactInfoRefId?: string[];
}

// PhoneDto - Phone number information
export class PhoneDto {
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() countryDialingCode?: string;
  @IsOptional() @IsString() areaCode?: string;
  @IsString() phoneNumber: string;
}

// ContactInfoDto - For email/phone number changes
export class ContactInfoDto {
  @IsString() contactInfoId: string;
  @IsOptional() @IsArray() @IsString({ each: true }) emailAddress?: string[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PhoneDto)
  phone?: PhoneDto[];
  @IsOptional() @IsBoolean() contactRefusedInd?: boolean;
}

// RepricedOrderIdDto - For deferred ticketing (maps to Query.RepricedOrderID)
export class RepricedOrderIdDto {
  @IsString() orderId: string;
  @IsOptional() @IsArray() @IsString({ each: true }) orderItemRefId?: string[];
}

export class OrderChangeRequestDto {
  @IsString() transactionId: string;
  @IsString() orderId: string;
  // Per OpenAPI spec: ReasonCode is at Query level, NOT inside ChangeOrderChoice
  @IsOptional() @IsString() reasonCode?: string;  // 'DIV' for split, '104' for payment extension

  // Deferred ticketing method 1: repricedOrderId (maps to Query.RepricedOrderID) - NEW!
  @IsOptional() @ValidateNested() @Type(() => RepricedOrderIdDto)
  repricedOrderId?: RepricedOrderIdDto;

  // Deferred ticketing methods 2 & 3: changeOrderChoice.acceptRepricedOrder (existing approach)
  @IsOptional() @ValidateNested() @Type(() => ChangeOrderChoiceDto)
  changeOrderChoice?: ChangeOrderChoiceDto;  // Optional when using repricedOrderId

  @IsOptional() @ValidateNested({ each: true }) @Type(() => PaxDetailDto)
  paxList?: PaxDetailDto[];
  @IsOptional() @ValidateNested({ each: true }) @Type(() => PaymentDto)
  paymentList?: PaymentDto[];
  // ContactInfoList for email/phone changes (WF_HELD_PAX)
  @IsOptional() @ValidateNested({ each: true }) @Type(() => ContactInfoDto)
  contactInfoList?: ContactInfoDto[];
  // Criteria for special fares, programs, promotions
  @IsOptional() @ValidateNested() @Type(() => CriteriaDto)
  criteria?: CriteriaDto;
}
```

---

## Airline Support Status

| Airline | SEAT | SERVICE | CONFIRM | ITIN | PAX | SPLIT | OCN |
|---------|------|---------|---------|------|-----|-------|-----|
| AY, SQ, KL | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AF | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| TK, HA | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ⚠️ |
| QR | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| EK, LH | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ |
| TR | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| AA, BA | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| KE | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Important Notes

### HELD vs TICKETED Differences

```typescript
// HELD: Can proceed directly without OrderQuote (for seats)
OrderRetrieve → SeatAvailability → OrderChange

// TICKETED: OrderQuote required
OrderRetrieve → SeatAvailability → OrderQuote → OrderChange

// SERVICE requires OrderQuote for both
OrderRetrieve → ServiceList → OrderQuote → OrderChange
```

### PaymentList Requirement

| Type | PaymentList |
|------|-------------|
| AcceptSelectedQuotedOfferList | ✅ For paid changes |
| AcceptOrderItemList | ✅ (Ticketing) |
| AcceptRepricedOrder | ✅ When price difference exists |
| UpdatePax | ❌ |
| AcceptChange | ❌ |

### Payment Type

> **CRITICAL**: Supported payment methods vary by airline!

| Type | Description | Supported Airlines |
|------|-------------|-------------------|
| `Cash` | BSP Cash | Most (except TR) |
| `Card` | Credit card | HA, KE only |
| `Ag` | Agent Deposit | TR only |

#### Card Payment Format (OpenAPI Spec)
```json
{
  "Type": "Card",
  "Amount": 850000,
  "CurCode": "KRW",
  "PaymentCardMethod": {
    "CardCode": "VI",
    "CardNumber": "4111111111111111",
    "CardHolderName": "HONG GILDONG",
    "EffectiveExpireDate": {
      "Expiration": "1228"
    },
    "SeriesCode": "123"
  }
}
```

#### Agent Deposit Format (TR only)
```json
{
  "Type": "Ag",
  "Amount": 1973960,
  "CurCode": "KRW"
}
```

### PaxList Requirement

| Type | PaxList |
|------|---------|
| UpdatePax | ✅ (When changing name/birthdate/gender) |
| AcceptChange (DIV) | ✅ |
| Others | ❌ |

### ContactInfoList (Email/Phone Number Changes)

> **NOTE**: Use `ContactInfoList` when changing email/phone number in UpdatePax

```typescript
// Email change example
{
  "Query": {
    "OrderID": "...",
    "ChangeOrderChoice": {
      "UpdatePax": [{ "CurrentPaxRefID": "PAX2", "NewPaxRefID": "PAX2" }]
    },
    "ContactInfoList": [{
      "ContactInfoID": "CTCPAX2_2",  // Verify from OrderRetrieve
      "EmailAddress": ["newemail@example.com"]
    }]
  }
}
```

| Change Item | Field Used |
|-------------|-----------|
| Name/birthdate/gender | `PaxList.Individual` |
| Email | `ContactInfoList.EmailAddress` |
| Phone number | `ContactInfoList.Phone` |

### Gender Value Format (CRITICAL)

> **WARNING**: OpenAPI spec values differ from what the actual API expects!

| Item | OpenAPI Spec | Actual API (Must Use) |
|------|-------------|----------------------|
| Female | `Female` | `FEMALE` |
| Male | `Male` | `MALE` |
| Unspecified | `Unspecified` | `UNSPECIFIED` |

```typescript
// ❌ Wrong - Causes "Failed to read request" error
{
  "individual": {
    "gender": "Female"  // OpenAPI spec value
  }
}

// ✅ Correct
{
  "individual": {
    "gender": "FEMALE"  // Use uppercase!
  }
}
```

> **NOTE**: FE must send Gender values in **uppercase**.
