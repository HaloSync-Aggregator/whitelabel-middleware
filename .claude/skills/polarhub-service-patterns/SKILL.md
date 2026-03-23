---
name: polarhub-service-patterns
description: "PolarHub Service transformation patterns. camelCase to PascalCase mapping, nested object transformation, conditional field inclusion, and actual code templates."
---

# PolarHub Service Transformation Patterns

Code patterns used when transforming DTO (camelCase) to PolarHub Query (PascalCase) in the Service layer.

---

## 1. Basic Transformation Rules

### 1.1 Field Name Transformation (camelCase to PascalCase)

```typescript
// DTO (provided by FE)
params.offerId        → OfferID
params.paxId          → PaxID
params.responseId     → ResponseID
params.transactionId  → TransactionID (pass-through)

// Rule: Transform all fields to PascalCase
// Exception: ID suffix remains uppercase (offerId → OfferID)
```

### 1.2 Array Mapping Pattern

```typescript
// Basic array mapping
params.offers.map((offer) => ({
  OfferID: offer.offerId,
  Owner: offer.owner,
}))

// Nested array mapping
params.offers.map((offer) => ({
  OfferItems: offer.offerItems.map((item) => ({
    OfferItemID: item.offerItemId,
    PaxRefID: item.paxRefId,  // string[] passed as-is
  })),
}))
```

### 1.3 Conditional Field Inclusion (Spread Pattern)

```typescript
// Include field only when it exists
{
  OfferID: offer.offerId,
  ...(item.seatSelection && {
    SeatSelection: {
      Column: item.seatSelection.column,
      Row: item.seatSelection.row,
    },
  }),
}

// Multiple conditional fields
{
  ...(field1 && { Field1: field1 }),
  ...(field2 && { Field2: field2 }),
  ...(field3 && { Field3: field3 }),
}
```

---

## 2. Pre-Booking API Patterns

### 2.1 AirShopping - Flight Search

```typescript
async searchFlights(params: {
  transactionId: string;
  sender?: SenderType;
  originDestList: Array<{
    origin: string;
    destination: string;
    departureDate: string;
  }>;
  passengers: Array<{ type: string; count: number }>;
  cabin?: string;
  airlinePreference?: string[];
  directOnly?: boolean;
}): Promise<AirShoppingResponse> {
  // Use PaxList builder helper
  const paxList = this.buildPaxList(params.passengers);

  // Transform OriginDestList
  const originDestList = params.originDestList.map((od) => ({
    OriginCode: od.origin,
    DestCode: od.destination,
    DepartureDate: od.departureDate,
  }));

  const query = {
    Query: {
      OriginDestList: originDestList,
      PaxList: paxList,
      Cabin: params.cabin,
      Criteria: {
        Direct: params.directOnly,
        AirlinePreference: params.airlinePreference
          ? { AirlineID: params.airlinePreference }
          : undefined,
      },
    },
  };

  return this.client.airShopping(query, {
    transactionId: params.transactionId,
    sender: params.sender,
  });
}

// PaxList builder helper method
private buildPaxList(passengers: Array<{ type: string; count: number }>) {
  const paxList: Array<{ PaxID: string; Ptc: string }> = [];
  let paxIndex = 1;

  for (const pax of passengers) {
    for (let i = 0; i < pax.count; i++) {
      paxList.push({
        PaxID: `PAX${paxIndex++}`,
        Ptc: pax.type,  // ADT, CHD, INF
      });
    }
  }

  return paxList;
}
```

### 2.2 OfferPrice - Price Details

```typescript
async getOfferPrice(params: {
  transactionId: string;
  sender?: SenderType;
  offers: Array<{
    responseId: string;
    offerId: string;
    owner: string;
    offerItems: Array<{
      offerItemId: string;
      paxRefId: string[];
      seatSelection?: { column: string; row: string };
      bookingInstructions?: { text?: string[]; ositext?: string[] };
    }>;
  }>;
  paxList: Array<{ paxId: string; ptc: string }>;
}): Promise<OfferPriceResponse> {
  const query = {
    Query: {
      // Multiple offer support (array)
      Offers: params.offers.map((offer) => ({
        ResponseID: offer.responseId,
        OfferID: offer.offerId,
        Owner: offer.owner,
        OfferItems: offer.offerItems.map((item) => ({
          OfferItemID: item.offerItemId,
          PaxRefID: item.paxRefId,
          // Workflow-specific optional fields
          ...(item.seatSelection && {
            SeatSelection: {
              Column: item.seatSelection.column,
              Row: item.seatSelection.row,
            },
          }),
          ...(item.bookingInstructions && {
            BookingInstructions: {
              Text: item.bookingInstructions.text,
              Ositext: item.bookingInstructions.ositext,
            },
          }),
        })),
      })),
      PaxList: params.paxList.map((pax) => ({
        PaxID: pax.paxId,
        Ptc: pax.ptc,
      })),
    },
  };

  return this.client.offerPrice(query, {
    transactionId: params.transactionId,
    sender: params.sender,
  });
}
```

### 2.3 OrderCreate - Booking Creation (Most Complex)

```typescript
async createOrder(params: {
  transactionId: string;
  sender?: SenderType;
  orders: Array<OrderType>;
  paxList: Array<PaxType>;
  contactInfoList?: Array<ContactInfoType>;
  paymentList?: Array<PaymentType>;
}): Promise<OrderCreateResponse> {
  const query: Record<string, unknown> = {
    Query: {
      // Order array transformation
      Order: params.orders.map((order) => ({
        ResponseID: order.responseId,
        OfferID: order.offerId,
        Owner: order.owner,
        OfferItems: order.offerItems.map((item) => ({
          OfferItemID: item.offerItemId,
          PaxRefID: item.paxRefId,
          ...(item.seatSelection && {
            SeatSelection: {
              Column: item.seatSelection.column,
              Row: item.seatSelection.row,
            },
          }),
          ...(item.bookingInstructions && {
            BookingInstructions: {
              Text: item.bookingInstructions.text,
              Ositext: item.bookingInstructions.ositext,
            },
          }),
        })),
      })),
      // PaxList transformation (complex logic)
      PaxList: this.buildOrderPaxList(params.paxList),
    },
  };

  // Add ContactInfoList (only when present)
  if (params.contactInfoList && params.contactInfoList.length > 0) {
    (query.Query as Record<string, unknown>).ContactInfoList =
      this.buildContactInfoList(params.contactInfoList);
  }

  // Add PaymentList (for immediate ticketing)
  if (params.paymentList) {
    (query.Query as Record<string, unknown>).PaymentList =
      this.buildPaymentList(params.paymentList);
  }

  return this.client.orderCreate(query, {
    transactionId: params.transactionId,
    sender: params.sender,
  });
}
```

---

## 3. Complex Transformation Patterns (CRITICAL)

> **Gender Field Uppercase Conversion Required (CRITICAL)**
>
> PolarHub API only accepts uppercase Gender values (`"MALE"`, `"FEMALE"`, `"UNSPECIFIED"`).
>
> **All** Gender fields must have `?.toUpperCase()` applied:
> - `Individual.Gender` - within passenger personal info
> - `PaxList.Gender` (top-level) - required by some airlines
> - `IdentityDoc.Gender` - within passport info
>
> ```typescript
> // WRONG - causes 400 "Failed to read request"
> Gender: pax.individual.gender,  // "Male" → fails!
>
> // CORRECT
> Gender: pax.individual.gender?.toUpperCase(),  // "MALE" → success
> ```

### 3.1 PaxList Transformation (for OrderCreate)

```typescript
private buildOrderPaxList(paxList: Array<PaxType>) {
  return paxList.map((pax) => ({
    PaxID: pax.paxId,
    Ptc: pax.ptc,

    // Individual info (names converted to uppercase)
    Individual: {
      NameTitle: pax.individual.nameTitle,
      GivenName: pax.individual.givenName.map((n) => n.toUpperCase()),
      Surname: pax.individual.surname.toUpperCase(),
      Birthdate: pax.individual.birthdate,
      Gender: pax.individual.gender?.toUpperCase(),
    },

    // Some airlines require top-level Gender as well
    Gender: pax.individual.gender?.toUpperCase(),

    // ContactInfoRefID (conditional)
    ...(pax.contactInfoRefId && {
      ContactInfoRefID: pax.contactInfoRefId,
    }),

    // IdentityDoc branching logic (CRITICAL)
    ...(pax.identityDoc
      ? {
          // Include passport info when IdentityDoc exists
          IdentityDoc: pax.identityDoc.map((doc) => ({
            IdentityDocumentType: doc.identityDocType,
            IdentityDocumentNumber: doc.identityDocId,
            ExpiryDate: doc.expiryDate,
            IssuingCountryCode: doc.issuingCountryCode,
            CitizenshipCountryCode: doc.citizenshipCountryCode,
            ResidenceCountryCode: doc.issuingCountryCode,
            Gender: pax.individual.gender?.toUpperCase(),
          })),
        }
      : {
          // Use country codes from FE when no IdentityDoc
          // CRITICAL: No hardcoding! Must be provided by FE
          ...(pax.citizenshipCountryCode && {
            CitizenshipCountryCode: pax.citizenshipCountryCode,
          }),
          ...(pax.residenceCountryCode && {
            ResidenceCountryCode: pax.residenceCountryCode,
          }),
        }),
  }));
}
```

### 3.2 ContactInfoList Transformation

```typescript
private buildContactInfoList(contactInfoList: Array<ContactInfoType>) {
  return contactInfoList.map((ci) => ({
    ContactInfoID: ci.contactInfoId,

    // EmailAddress: string to string[] wrapping
    ...(ci.emailAddress && {
      EmailAddress: [ci.emailAddress],
    }),

    // Phone: object to array wrapping
    ...(ci.phone && {
      Phone: [
        {
          // Label is provided by FE (no hardcoding!)
          ...(ci.phone.label && { Label: ci.phone.label }),
          CountryDialingCode: ci.phone.countryDialingCode,
          PhoneNumber: ci.phone.phoneNumber,
        },
      ],
    }),

    // PostalAddress (required for BA)
    ...(ci.postalAddress && {
      PostalAddress: [
        {
          Street: ci.postalAddress.street,
          CityName: ci.postalAddress.cityName,
          PostalCode: ci.postalAddress.postalCode,
          CountryCode: ci.postalAddress.countryCode,
        },
      ],
    }),

    ContactRefusedInd: false,
  }));
}
```

### 3.3 PaymentList Transformation (3 Payment Methods)

> **CRITICAL**: The Service's `buildPaymentList` requires a `paymentMethod` object structure.
> Controllers using simplified DTOs (type field) must transform using `transformPaymentList`!

#### Service Level: buildPaymentList (paymentMethod object-based)

```typescript
private buildPaymentList(paymentList: Array<PaymentType>) {
  return paymentList.map((p) => {
    // Determine payment type (Cash | Card | Ag)
    let type = 'Cash';
    if (p.paymentMethod.card) {
      type = 'Card';
    } else if (p.paymentMethod.agentDeposit) {
      type = 'Ag';  // Agent Deposit used by TR airline, etc.
    }

    const payment: Record<string, unknown> = {
      Type: type,
      Amount: p.amount.amount,
      CurCode: p.amount.currencyCode,
    };

    // Card payment details
    if (p.paymentMethod.card) {
      payment.PaymentCardMethod = {
        CardCode: p.paymentMethod.card.cardCode,
        CardNumber: p.paymentMethod.card.cardNumber,
        CardHolderName: p.paymentMethod.card.cardHolderName,
        EffectiveExpireDate: {
          Expiration: p.paymentMethod.card.expiration,
        },
        SeriesCode: p.paymentMethod.card.seriesCode,
      };
    }

    // Payment allocation fields (optional)
    if (p.orderItemId?.length > 0) {
      payment.OrderItemID = p.orderItemId;
    }
    if (p.offerItemId?.length > 0) {
      payment.OfferItemID = p.offerItemId;
    }
    if (p.paxRefId?.length > 0) {
      payment.PaxRefID = p.paxRefId;
    }

    return payment;
  });
}
```

#### Controller Level: transformPaymentList (simplified DTO to Service structure)

> **MUST**: Controllers using simplified DTOs (type field) must always perform this transformation!
> Without this transformation, `type: 'Ag'` will be incorrectly converted to `type: 'Cash'` in the Service.

```typescript
/**
 * PaymentList transformation (DTO to Service)
 *
 * CRITICAL: Must set appropriate paymentMethod based on type
 * - Cash → cash: { cashPaymentInd: true }
 * - Ag → agentDeposit: { agentDepositId: '' }
 * - Card → card: { ... } (extend when card details are needed)
 *
 * WRONG - type is ignored and defaults to Cash
 * paymentList: request.paymentList  // Ag converted to Cash!
 *
 * CORRECT - transform to paymentMethod object before passing
 * paymentList: this.transformPaymentList(request.paymentList)
 */
private transformPaymentList(paymentList?: PaymentDto[]) {
  if (!paymentList) return undefined;

  return paymentList.map((p) => ({
    paymentMethod: {
      cash: p.type === 'Cash' ? { cashPaymentInd: true } : undefined,
      agentDeposit: p.type === 'Ag' ? { agentDepositId: '' } : undefined,
      // Card requires card details (cardNumber, etc.), implement after DTO extension
    },
    amount: {
      currencyCode: p.curCode,
      amount: p.amount,
    },
    orderItemId: p.orderItemId,
    offerItemId: p.offerItemId,
    paxRefId: p.paxRefId,
  }));
}
```

#### Payment Type Transformation Flow

```
FE Request (DTO)          Controller                Service               PolarHub
┌──────────────┐      ┌─────────────────┐      ┌──────────────┐      ┌────────────┐
│ type: 'Ag'   │ ──→  │ transformPayment│ ──→  │ buildPayment │ ──→  │ Type: 'Ag' │
│ amount: 100  │      │ → agentDeposit  │      │ List         │      │ Amount:100 │
└──────────────┘      └─────────────────┘      └──────────────┘      └────────────┘

When transformation is missing:
type: 'Ag' → paymentMethod: {} → type = 'Cash' (default) → Type: 'Cash'
```
```

---

## 4. Post-Booking API Patterns

### 4.1 OrderRetrieve - Booking Retrieval (Simple)

```typescript
async getOrder(params: {
  transactionId: string;
  sender?: SenderType;
  orderId: string;
}): Promise<OrderRetrieveResponse> {
  // Simple pass-through
  return this.client.orderRetrieve(params.orderId, {
    transactionId: params.transactionId,
    sender: params.sender,
  });
}
```

### 4.2 OrderChange - Booking Modification (7 Modes)

```typescript
async changeOrder(params: {
  transactionId: string;
  sender?: SenderType;
  orderId: string;
  changeOrderChoice: ChangeOrderChoiceType;
  reasonCode?: string;
  paxList?: Array<PaxType>;
  paymentList?: Array<PaymentType>;
  contactInfoList?: Array<ContactInfoType>;
}): Promise<{ transactionId: string; response: PolarHubResponse }> {
  const changeOrderChoice: Record<string, unknown> = {};

  // 1. AcceptSelectedQuotedOfferList (seat/service changes, itinerary change after ticketing)
  if (params.changeOrderChoice.acceptSelectedQuotedOfferList) {
    changeOrderChoice.AcceptSelectedQuotedOfferList = {
      SelectedPricedOffer: params.changeOrderChoice.acceptSelectedQuotedOfferList
        .selectedPricedOffer.map((o) => ({
          OfferID: o.offerId,
          Owner: o.owner,
          ResponseID: o.responseId,  // Required for itinerary changes (uses OrderID value)
          OfferItems: o.offerItems.map((item) => ({
            OfferItemID: item.offerItemId,
            PaxRefID: item.paxRefId,
            ...(item.seatSelection && {
              SeatSelection: {
                Column: item.seatSelection.column,
                Row: item.seatSelection.row,
              },
            }),
          })),
        })),
    };
  }

  // 2. AcceptOrderItemList (Hold confirmation)
  if (params.changeOrderChoice.acceptOrderItemList) {
    changeOrderChoice.AcceptOrderItemList = {
      Owner: params.changeOrderChoice.acceptOrderItemList.owner,
      ...(params.changeOrderChoice.acceptOrderItemList.offerItemRefId && {
        OfferItemRefID: params.changeOrderChoice.acceptOrderItemList.offerItemRefId,
      }),
    };
  }

  // 3. AcceptRepricedOrder (Hold itinerary change)
  if (params.changeOrderChoice.acceptRepricedOrder) {
    changeOrderChoice.AcceptRepricedOrder = {
      OfferRefID: params.changeOrderChoice.acceptRepricedOrder.offerRefId,
    };
  }

  // 4. UpdatePax (passenger info change)
  // 3 modes: Add (newPaxRefId only), Delete (currentPaxRefId only), Update (both)
  if (params.changeOrderChoice.updatePax) {
    changeOrderChoice.UpdatePax = params.changeOrderChoice.updatePax.map((p) => ({
      ...(p.currentPaxRefId && { CurrentPaxRefID: p.currentPaxRefId }),
      ...(p.newPaxRefId && { NewPaxRefID: p.newPaxRefId }),
    }));
  }

  // 5. AcceptChange (OCN acceptance)
  if (params.changeOrderChoice.acceptChange) {
    changeOrderChoice.AcceptChange = {
      OrderItemRefID: params.changeOrderChoice.acceptChange.orderItemRefId,
    };
  }

  // Query construction (ReasonCode is at Query level!)
  const query: Record<string, unknown> = {
    Query: {
      OrderID: params.orderId,
      ...(params.reasonCode && { ReasonCode: params.reasonCode }),
      ChangeOrderChoice: changeOrderChoice,
    },
  };

  // Add PaxList, PaymentList, ContactInfoList
  if (params.paxList) {
    (query.Query as Record<string, unknown>).PaxList =
      this.buildChangePaxList(params.paxList);
  }
  if (params.paymentList) {
    (query.Query as Record<string, unknown>).PaymentList =
      this.buildPaymentList(params.paymentList);
  }
  if (params.contactInfoList?.length > 0) {
    (query.Query as Record<string, unknown>).ContactInfoList =
      this.buildChangeContactInfoList(params.contactInfoList);
  }

  const response = await this.client.orderChange(query, {
    transactionId: params.transactionId,
    sender: params.sender,
  });

  return { transactionId: params.transactionId, response };
}
```

### 4.3 OrderQuote SelectedOffer Pattern (Service/Seat)

> **CRITICAL**: When mapping `SelectedOffer`, `BookingInstructions` and `ResponseID` **must be included**!

```typescript
// Service mapping
if (params.selectedOffer) {
  query.SelectedOffer = params.selectedOffer.map((o) => ({
    OfferID: o.offerId,
    Owner: o.owner,
    // ResponseID (required for WF_TKT_VOLCHANGE, etc.!)
    ...(o.responseId && { ResponseID: o.responseId }),
    OfferItems: o.offerItems.map((item) => ({
      OfferItemID: item.offerItemId,
      PaxRefID: item.paxRefId,
      // SeatSelection (seat)
      ...(item.seatSelection && {
        SeatSelection: {
          Column: item.seatSelection.column,
          Row: item.seatSelection.row,
        },
      }),
      // BookingInstructions (service - baggage, etc.) - watch for omission!
      ...(item.bookingInstructions && {
        BookingInstructions: {
          ...(item.bookingInstructions.text && {
            Text: item.bookingInstructions.text,
          }),
          ...(item.bookingInstructions.ositext && {
            Ositext: item.bookingInstructions.ositext,
          }),
        },
      }),
    })),
  }));
}
```

---

### 4.4 RepricedOrderID Pattern (Shared by OrderQuote and OrderChange)

> **CRITICAL**: The `repricedOrderId` used for deferred ticketing (WF_HELD_CONFIRM) must be mapped as an **object**!

```typescript
// WRONG - passed as string
repricedOrderId: request.repricedOrderId?.orderId,  // orderItemRefId omitted!

// CORRECT - passed as object
repricedOrderId: request.repricedOrderId
  ? {
      orderId: request.repricedOrderId.orderId,
      orderItemRefId: request.repricedOrderId.orderItemRefId,
    }
  : undefined,
```

**Service Mapping:**
```typescript
// Same pattern for both OrderQuote and OrderChange
if (params.repricedOrderId) {
  query.RepricedOrderID = {
    OrderID: params.repricedOrderId.orderId,
    ...(params.repricedOrderId.orderItemRefId && {
      OrderItemRefID: params.repricedOrderId.orderItemRefId,
    }),
  };
}
```

**FE to PolarHub Transformation Example:**
```typescript
// FE request (camelCase)
{
  "repricedOrderId": {
    "orderId": "TSDEV-20260126-xxx",
    "orderItemRefId": ["AY1059O3QVT00_AIR-1-2", "AY1059O3QVT00_SRV14"]
  }
}

// PolarHub Query (PascalCase)
{
  "Query": {
    "RepricedOrderID": {
      "OrderID": "TSDEV-20260126-xxx",
      "OrderItemRefID": ["AY1059O3QVT00_AIR-1-2", "AY1059O3QVT00_SRV14"]
    }
  }
}
```

---

### 4.4 OrderReshop - Rebooking Search

> **CRITICAL**: For deferred ticketing (LH, EK, etc.), use the `repricedOrderRefId` field!

```typescript
async reshopOrder(params: {
  transactionId: string;
  sender?: SenderType;
  orderId: string;
  actionContext?: string;  // '8' = Voluntary, '9' = Involuntary
  updateOrder: {
    reshopOrder?: {
      serviceOrder: {
        delete?: Array<{ orderItemRefId: string; retainServiceId?: string[] }>;
        add?: {
          originDestList: Array<{
            origin: string;
            destination: string;
            departureDate: string;
          }>;
          cabin?: string;
        };
      };
    };
    cancelOrderRefId?: string;      // Refund search - string! Not object!
    repricedOrderRefId?: string;    // Deferred ticketing (LH, EK, etc.) - string!
  };
}): Promise<{ transactionId: string; response: PolarHubResponse }> {
  const query: Record<string, unknown> = {
    Query: {
      OrderID: params.orderId,
      ...(params.actionContext && { ActionContext: params.actionContext }),
      UpdateOrder: {},
    },
  };

  const updateOrder = query.Query.UpdateOrder as Record<string, unknown>;

  // ReshopOrder (itinerary change)
  if (params.updateOrder.reshopOrder) {
    updateOrder.ReshopOrder = {
      ServiceOrder: {
        ...(params.updateOrder.reshopOrder.serviceOrder.delete && {
          Delete: params.updateOrder.reshopOrder.serviceOrder.delete.map((d) => ({
            OrderItemRefID: d.orderItemRefId,
            ...(d.retainServiceId && { RetainServiceID: d.retainServiceId }),
          })),
        }),
        ...(params.updateOrder.reshopOrder.serviceOrder.add && {
          Add: {
            OriginDestList: params.updateOrder.reshopOrder.serviceOrder.add
              .originDestList.map((od) => ({
                OriginCode: od.origin,
                DestCode: od.destination,
                DepartureDate: od.departureDate,
              })),
            ...(params.updateOrder.reshopOrder.serviceOrder.add.cabin && {
              Cabin: params.updateOrder.reshopOrder.serviceOrder.add.cabin,
            }),
          },
        }),
      },
    };
  }

  // CancelOrderRefID (refund search) - string!
  if (params.updateOrder.cancelOrderRefId) {
    updateOrder.CancelOrderRefID = params.updateOrder.cancelOrderRefId;
  }

  // RepricedOrderRefID (deferred ticketing - LH, EK, etc.) - string!
  if (params.updateOrder.repricedOrderRefId) {
    updateOrder.RepricedOrderRefID = params.updateOrder.repricedOrderRefId;
  }

  const response = await this.client.orderReshop(query, {
    transactionId: params.transactionId,
    sender: params.sender,
  });

  return { transactionId: params.transactionId, response };
}
```

#### 3 Purposes of UpdateOrder

| Field | Purpose | Workflow | Type |
|-------|---------|----------|------|
| `reshopOrder` | Itinerary change search | WF_HELD_ITIN, WF_TKT_VOLCHANGE | Object |
| `cancelOrderRefId` | Refund quote retrieval | WF_TKT_REFUND | **String** |
| `repricedOrderRefId` | **Deferred ticketing (LH, EK, etc.)** | WF_HELD_CONFIRM | **String** |

#### Deferred Ticketing Example (LH, EK, etc.)

```typescript
// FE request
{
  "transactionId": "e802cf622db74c2299c188d4827b5dd6",
  "orderId": "TSDEV-20240312-d20663409d8acb35",
  "updateOrder": {
    "repricedOrderRefId": "TSDEV-20240312-d20663409d8acb35"
  }
}

// PolarHub Query
{
  "Query": {
    "OrderID": "TSDEV-20240312-d20663409d8acb35",
    "UpdateOrder": {
      "RepricedOrderRefID": "TSDEV-20240312-d20663409d8acb35"
    }
  }
}
```

---

## 5. Type Definition Patterns

### 5.1 Service Method Inline Types

```typescript
// Basic Sender type (common to all methods)
sender?: {
  travelAgency: {
    agencyId: string;
    siteCode?: string;
    agencyName?: string;
    contactInfoRefId?: string[];
  };
};

// PaxList type (for AirShopping - simple)
paxList: Array<{ paxId: string; ptc: string }>;

// PaxList type (for OrderCreate - detailed)
paxList: Array<{
  paxId: string;
  ptc: string;
  individual: {
    nameTitle?: string;
    givenName: string[];
    surname: string;
    birthdate: string;
    gender?: string;
  };
  identityDoc?: Array<{
    identityDocType: string;
    identityDocId: string;
    birthdate: string;
    expiryDate: string;
    issuingCountryCode: string;
    citizenshipCountryCode: string;
  }>;
  contactInfoRefId?: string[];
  citizenshipCountryCode?: string;  // When no identityDoc
  residenceCountryCode?: string;    // When no identityDoc
}>;

// ContactInfoList type
contactInfoList?: Array<{
  contactInfoId: string;
  emailAddress?: string;
  phone?: {
    phoneNumber: string;
    countryDialingCode?: string;
    label?: string;  // No hardcoding!
  };
  postalAddress?: {
    street: string[];
    cityName: string;
    postalCode: string;
    countryCode: string;
  };
}>;

// PaymentList type
paymentList?: Array<{
  paymentMethod: {
    cash?: { cashPaymentInd: boolean };
    card?: {
      cardCode: string;
      cardNumber: string;
      cardHolderName: string;
      expiration: string;
      seriesCode: string;
    };
    agentDeposit?: { agentDepositId: string };
  };
  amount: { currencyCode: string; amount: number };
  orderItemId?: string[];
  offerItemId?: string[];
  paxRefId?: string[];
}>;
```

---

## 6. Transformation Checklist

### Before Implementation

- [ ] Create DTO field name to PascalCase transformation list
- [ ] Identify array fields (need to use map)
- [ ] Identify conditional fields (use spread pattern)
- [ ] Check nested object depth
- [ ] Check if string to array wrapping is needed (EmailAddress, etc.)

### After Implementation

- [ ] Are all fields transformed to PascalCase?
- [ ] Is the spread pattern applied to conditional fields?
- [ ] Are array default values handled? (`|| []`)
- [ ] Are there no hardcoded values?
- [ ] Is transactionId passed through?
- [ ] Is sender passed to the client?
- [ ] **Is toUpperCase() applied to Gender fields?** (Individual, PaxList, IdentityDoc)
