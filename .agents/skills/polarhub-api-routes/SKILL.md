---
name: polarhub-api-routes
description: PolarHub API route implementation patterns. Used when implementing PolarHub NDC API routes in NestJS middleware. Includes 17 workflows (5 Prime Booking + 12 Post-Booking), 10 API endpoints, and OfferPrice multi-offer support. Use when implementing API routes for AirShopping, OfferPrice, OrderCreate, OrderRetrieve, OrderChange, OrderCancel, SeatAvailability, ServiceList, OrderReshop, OrderQuote.
---

# PolarHub API Route Implementation

Core patterns for implementing NestJS API routes.

## References

See the following files for detailed documentation:

### Base Documents
- **[references/workflows.md](references/workflows.md)** - 17 workflow definitions
- **[references/api-examples.md](references/api-examples.md)** - Implementation examples for each API

### Per-API Detailed Guides (10)

#### Pre-Booking APIs
| API | Guide | Description |
|-----|-------|-------------|
| AirShopping | **[air-shopping-guide.md](references/air-shopping-guide.md)** | Flight search (Prime starting point) |
| SeatAvailability | **[seat-availability-guide.md](references/seat-availability-guide.md)** | Seat information retrieval |
| ServiceList | **[service-list-guide.md](references/service-list-guide.md)** | Ancillary service retrieval |
| OfferPrice | **[offer-price-guide.md](references/offer-price-guide.md)** | Price detail retrieval |
| OrderCreate | **[order-create-guide.md](references/order-create-guide.md)** | Booking creation (Prime endpoint) |

#### Post-Booking APIs
| API | Guide | Description |
|-----|-------|-------------|
| OrderRetrieve | **[order-retrieve-guide.md](references/order-retrieve-guide.md)** | Booking retrieval (Post starting point) |
| OrderChange | **[order-change-guide.md](references/order-change-guide.md)** | Booking modification (7 types) |
| OrderCancel | **[order-cancel-guide.md](references/order-cancel-guide.md)** | Booking cancellation/refund |
| OrderReshop | **[order-reshop-guide.md](references/order-reshop-guide.md)** | Itinerary change/refund quote |
| OrderQuote | **[order-quote-guide.md](references/order-quote-guide.md)** | Seat/service quote |

---

## Middleware Route Prefix (CRITICAL)

> **MUST**: All Controller routes must use the `middleware/polarhub/` prefix.

| API | Middleware Route |
|-----|------------------|
| AirShopping | `POST /middleware/polarhub/air-shopping` |
| OfferPrice | `POST /middleware/polarhub/offer-price` |
| OrderCreate | `POST /middleware/polarhub/order` |
| OrderRetrieve | `POST /middleware/polarhub/order/retrieve` |
| OrderCancel | `POST /middleware/polarhub/order/cancel` |
| OrderChange | `POST /middleware/polarhub/order-change` |
| OrderReshop | `POST /middleware/polarhub/order-reshop` |
| OrderQuote | `POST /middleware/polarhub/order-quote` |
| SeatAvailability | `POST /middleware/polarhub/seat-availability` |
| ServiceList | `POST /middleware/polarhub/service-list` |

```typescript
// CORRECT
@Controller('polarhub/air-shopping')

// WRONG - do NOT include global prefix in @Controller
@Controller('middleware/polarhub/air-shopping')  // Prohibited!
```

---

## Required Request Structure

All PolarHub API requests must include the following structure:

```typescript
// HTTP Headers (added automatically by auth layer):
// X-Tide-Tenant-Id: TENANT_ID  (always included from POLARHUB_TENANT_ID)

// Request Body:
{
  "Sender": {
    "TravelAgency": {
      "AgencyID": "TENANT_ID",
      "ContactInfoRefID": ["CTC_TA1"]  // Auto-injected from environment variable!
    }
  },
  "PointOfSale": "KR",
  "Query": { ... },
  "TransactionID": "32_char_UUID"
}
```

### ContactInfoRefID Auto-Injection (CRITICAL - 2026-01-21)

> `sender.travelAgency.contactInfoRefId` is **always force-injected** from the environment variable (`POLARHUB_AGENCY_CONTACT_ID`).

- FE does not provide sender --> Default sender is auto-generated from environment variables
- FE provides sender --> Only contactInfoRefId is force-replaced with the environment variable value

### Service Layer Wrapping Pattern
```typescript
// CRITICAL: transactionId is provided by FE (middleware must not generate it!)
// CRITICAL: contactInfoRefId is auto-injected from environment variable!
private async request<T>(endpoint: string, query: Record<string, unknown>, options: RequestOptions): Promise<T> {
  const requestBody = {
    Sender: {
      TravelAgency: {
        AgencyID: this.config.tenantId,
        ContactInfoRefID: [this.config.agencyContactId],  // Force-injected from environment variable!
      }
    },
    PointOfSale: options?.pointOfSale || 'KR',
    Query: query,
    TransactionID: options.transactionId,  // Must be provided by FE
  };
  // HMAC authentication and request dispatch
}
```

---

## CRITICAL: Implementation Verification Checklist

**Always check the following checklist when writing/modifying code.**

### 0. OpenAPI Spec Type Verification (MUST DO FIRST!)

> **CRITICAL**: Always verify field types in `spec/polarhub.openapi.json` before implementing DTOs/Services.

```bash
# Verify field type (e.g., CancelOrderRefID)
grep -A 5 '"CancelOrderRefID"' spec/polarhub.openapi.json
# Result: "type": "string" --> String type!

# Check details from schema URL
cat spec/schema-llms-index.json | jq '.[] | select(.name == "OrderReshopRQ")'
```

#### Mistake Prevention: Primitive vs Object Types

| Field | Wrong assumption | Actual spec |
|-------|-----------------|-------------|
| `CancelOrderRefID` | `{ OrderID: "..." }` (object) | `"ORDER_ID"` (string) |
| `RepricedOrderRefID` | `{ OrderID: "..." }` (object) | `"ORDER_ID"` (string) |
| `OrderItemRefID` (Delete) | `string[]` (array) | `Array<{ OrderItemRefID: string }>` (object array) |

**Rule**: Do not assume based on similar field names being objects -- **always verify the spec!**

### 1. DTO --> Service --> PolarHub Structure Consistency Verification

| Layer | Field Name Convention | Example |
|-------|----------------------|---------|
| **DTO (NestJS)** | camelCase | `offers`, `offerItems`, `paxRefId` |
| **Service parameters** | camelCase | `offers`, `offerItems`, `paxRefId` |
| **PolarHub Query** | PascalCase | `Offers`, `OfferItems`, `PaxRefID` |

### 2. Common Mistake Prevention (MUST CHECK)

| Wrong implementation | Correct implementation | Affected API |
|---------------------|----------------------|--------------|
| `Query.Offer` (singular) | `Query.Offers` (plural, array) | OfferPrice |
| `OfferItemIDs: string[]` | `OfferItems: Array<{OfferItemID, PaxRefID}>` | OfferPrice |
| `offer: { offerId }` | `offer: { responseId, offerId, owner }` | SeatAvailability, ServiceList |
| `paxRefId: string` | `paxRefId: string[]` (array) | OfferPrice, OrderChange |
| `changeRequest: {}` | `changeOrderChoice: ChangeOrderChoiceDto` | OrderChange |
| `reshopRequest: {}` | `updateOrder: UpdateOrderDto` | OrderReshop |

### 3. Guide Document vs Code Comparison Verification

**Always check the corresponding API guide before/after implementation:**

```bash
# Check guide document
cat .claude/skills/polarhub-api-routes/references/{api-name}-guide.md

# Compare with current code
diff <(grep -A50 "Query:" {api}-guide.md) <(grep -A50 "Query" polarhub.service.ts)
```

### 4. Required Implementation Verification Commands

```bash
# Verify DTO field names (camelCase)
grep -E "^\s+@?(Is|Api|Valid)" src/lib/polarhub/dto/*.dto.ts

# Verify Service --> PolarHub transformation (PascalCase)
grep -E "(Offers|OfferItems|PaxRefID|SelectedOffer)" src/lib/polarhub/polarhub.service.ts

# Verify Controller --> Service mapping
grep -E "\.(changeOrder|reshopOrder|getOfferPrice|getSeatAvailability|getServiceList|getOrderQuote)\(" src/lib/polarhub/controllers/*.ts
```

---

## Full Response Return Principle

**Do not transform the PolarHub response in the Controller; return the full original response:**

```typescript
// GOOD - Return full original response
return { transactionId, ...response };

// BAD - Data loss
return { transactionId, offers: response.Offer?.map(o => ({ offerId: o.OfferID })) };
```

---

## 10 API Summary

### Middleware Endpoints (Frontend --> Middleware)

| API | Method | Middleware Endpoint | Description |
|-----|--------|---------------------|-------------|
| AirShopping | POST | `/middleware/polarhub/air-shopping` | Flight search |
| OfferPrice | POST | `/middleware/polarhub/offer-price` | Price detail retrieval |
| OrderCreate | POST | `/middleware/polarhub/order` | Booking creation |
| OrderRetrieve | POST | `/middleware/polarhub/order/retrieve` | Booking retrieval |
| OrderCancel | POST | `/middleware/polarhub/order/cancel` | Booking cancellation |
| ServiceList | POST | `/middleware/polarhub/service-list` | Ancillary service retrieval |
| SeatAvailability | POST | `/middleware/polarhub/seat-availability` | Seat retrieval |
| OrderChange | POST | `/middleware/polarhub/order-change` | Booking modification |
| OrderReshop | POST | `/middleware/polarhub/order-reshop` | Rebooking search |
| OrderQuote | POST | `/middleware/polarhub/order-quote` | Change quote |

**CRITICAL - HTTP Method Principle:**
- **All APIs use POST** (per PolarHub API HTTP spec)
- TransactionID is **provided by FE** (pass-through)
- Return TransactionID via response header `X-Transaction-Id`

### PolarHub Endpoints (Middleware --> PolarHub)

| API | Path | Role |
|-----|------|------|
| AirShopping | `/hub/polarpie/v2/airShopping` | Flight search (starting point) |
| OfferPrice | `/hub/polarpie/v2/offerPrice` | Price detail retrieval |
| OrderCreate | `/hub/polarpie/v2/order` | Booking creation (endpoint) |
| OrderRetrieve | `/hub/polarpie/v2/orderRetrieve` | Booking retrieval (starting point) |
| OrderCancel | `/hub/polarpie/v2/orderCancel` | Booking cancellation |
| OrderChange | `/hub/polarpie/v2/orderChange` | Booking modification (7 types) |
| ServiceList | `/hub/polarpie/v2/serviceList` | Ancillary service retrieval |
| SeatAvailability | `/hub/polarpie/v2/seatAvailability` | Seat retrieval |
| OrderReshop | `/hub/polarpie/v2/orderReshop` | Rebooking search |
| OrderQuote | `/hub/polarpie/v2/orderQuote` | Change quote |

---

## Workflow Quick Reference

### Prime Booking (5)
```
WF_PB_DEFERRED:     AirShopping → OfferPrice → OrderCreate
WF_PB_IMMEDIATE:    AirShopping → OfferPrice → OrderCreate (+FOP)
WF_PB_SEAT:         AirShopping → SeatAvailability → OfferPrice → OrderCreate
WF_PB_SERVICE:      AirShopping → ServiceList → OfferPrice → OrderCreate
WF_PB_SEAT_SERVICE: AirShopping → SeatAvailability → ServiceList → OfferPrice → OrderCreate
```

### Post-Booking Held (7)
```
WF_HELD_SEAT:    OrderRetrieve → SeatAvailability → OrderChange
WF_HELD_SERVICE: OrderRetrieve → ServiceList → OrderQuote → OrderChange
WF_HELD_CONFIRM: OrderRetrieve → OrderChange (+PaymentList)
WF_HELD_CANCEL:  OrderRetrieve → OrderCancel
WF_HELD_ITIN:    OrderRetrieve → OrderReshop → OrderChange
WF_HELD_PAX:     OrderRetrieve → OrderChange (UpdatePax)
WF_HELD_SPLIT:   OrderRetrieve → OrderChange (UpdatePax + DIV)
```

### Post-Booking Ticketed (5)
```
WF_TKT_SEAT:      OrderRetrieve → SeatAvailability → OrderQuote → OrderChange
WF_TKT_SERVICE:   OrderRetrieve → ServiceList → OrderQuote → OrderChange
WF_TKT_VOLCHANGE: OrderRetrieve → OrderReshop → OrderQuote → OrderChange  ⚠️ AcceptSelectedQuotedOfferList + ResponseID required!
WF_TKT_REFUND:    OrderRetrieve → OrderReshop → OrderCancel
WF_TKT_OCN:       OrderRetrieve → OrderChange (AcceptChange)
```

> **WF_TKT_VOLCHANGE Note (Confirmed 2026-01-15)**:
> - Using `AcceptRepricedOrder` causes "INVALID SEGMENT SELECTION" error
> - Must use `AcceptSelectedQuotedOfferList`
> - `ResponseID` field required (use OrderID value)
> - Details: [references/order-change-guide.md](references/order-change-guide.md)

---

## Transaction ID Management (Pass-through Principle)

**CRITICAL: TransactionID is generated by FE; middleware only passes it through!**

```typescript
// CORRECT - Pass through the transactionId received from FE as-is
@Post()
async searchFlights(@Body() request: AirShoppingRequestDto) {
  return await this.service.searchFlights({
    transactionId: request.transactionId,  // Provided by FE
    // ...
  });
}

// WRONG - Generation by middleware is prohibited
const txnId = generateTransactionId();  // Absolutely prohibited!
```

### FE Responsibility
```typescript
// Pre-Booking: FE maintains the same ID
const txnId = crypto.randomUUID().replace(/-/g, '');  // Generated by FE
AirShopping(txnId) → OfferPrice(txnId) → OrderCreate(txnId)

// Post-Booking: FE generates a new ID
const postTxnId = crypto.randomUUID().replace(/-/g, '');  // Newly generated by FE
OrderRetrieve(postTxnId) → SeatAvailability(postTxnId) → OrderChange(postTxnId)
```

---

## OfferPrice Multi-Offer

**OfferPrice can request multiple Offers simultaneously:**

```typescript
// DTO
export class OfferPriceRequestDto {
  transactionId: string;
  offers: OfferSelectionDto[];  // Array!
}

// Request
{ "Query": { "Offers": [offer1, offer2, offer3], "PaxList": [...] } }
```

Fields by workflow:
- **DEFERRED/IMMEDIATE**: Basic (OfferItemID, PaxRefID)
- **WF_PB_SEAT**: + `SeatSelection: { Column, Row }`
- **WF_PB_SERVICE**: + `BookingInstructions: { Text, Ositext }`

Details: [references/offer-price-guide.md](references/offer-price-guide.md)

---

## Core Patterns

### PaxList Generation and Required Status
```typescript
const paxList = [];
let paxIndex = 1;
for (const pax of passengers) {
  for (let i = 0; i < pax.count; i++) {
    paxList.push({ PaxID: `PAX${paxIndex++}`, Ptc: pax.type });
  }
}
```

**PaxList Required Status (CRITICAL):**

| Flow | Based on | paxList |
|------|----------|---------|
| **Prime Booking** | `offer` | Required (offer does not contain passenger info) |
| **Post-Booking** | `order` | Optional (order already contains passenger info) |

```typescript
// Prime Booking - paxList required
{ offer: { responseId, offerId, owner }, paxList: [...] }

// Post-Booking - paxList optional
{ order: { orderId } }  // Possible without paxList
{ order: { orderId }, paxList: [...] }  // Can also provide paxList
```

### Individual Object
```typescript
Individual: {
  NameTitle: 'MR',
  GivenName: ['GILDONG'],  // Array
  Surname: 'HONG',
  Birthdate: '1990-01-15',
  Gender: 'Male'
}
```

### ContactInfo Linking
```typescript
const contactId = `CI_${pax.paxId}`;
paxList.push({ ..., ContactInfoRefID: [contactId] });
contactInfoList.push({ ContactInfoID: contactId, ... });
```

---

## Airline Workflow Support

| Tier | Airlines | Support |
|------|----------|---------|
| Full | AY, SQ, KL | All 17 |
| High | AF, TK, HA | Most |
| Medium | QR, EK, LH | Some Post-Booking |
| Basic | AA, BA | Prime + Refund only |
| Minimal | TR | Prime + Hold only |
| None | KE | Not supported |

Details: `asset/carrier_support_matrix.yaml`
