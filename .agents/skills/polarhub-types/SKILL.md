---
name: polarhub-types
description: PolarHub NDC API TypeScript type definitions. Use when type definitions are needed for PolarHub API integration. Includes 40+ interfaces (PaxType, OfferType, OrderCreateQuery, PaymentType, etc.). Use when implementing PolarHub API types or interfaces.
---

# PolarHub TypeScript Type Definitions

TypeScript type definitions for the PolarHub API.

## CRITICAL: Spec Verification Required Before Type Definition

> **MUST**: Always verify actual types in `spec/polarhub.openapi.json` before defining types/interfaces.

### How to Verify Specs
```bash
# Check type of a specific field
grep -A 5 '"CancelOrderRefID"' spec/polarhub.openapi.json
# Example result: "type": "string" → it's a string!

# Check schema document URL
cat spec/schema-llms-index.json | jq '.[] | select(.name == "OrderReshopRQ")'
```

### Caution: Primitive vs Object Types

| Field | Wrong Assumption | Actual Spec |
|-------|-----------------|-------------|
| `CancelOrderRefID` | `{ OrderID: string }` | `string` |
| `RepricedOrderRefID` | `{ OrderID: string }` | `string` |

**Rule**: Do not assume based on similarly named fields -- **always verify in the spec!**

---

## References

See the following files for detailed type definitions:

- **[references/common-types.md](references/common-types.md)** - Common types (Pax, Contact, Payment, etc.)
- **[references/api-types.md](references/api-types.md)** - Per-API request/response types
- **[references/offer-price-types.md](references/offer-price-types.md)** - OfferPrice workflow-specific types
- **[references/post-booking-types.md](references/post-booking-types.md)** - OrderChange, OrderReshop, OrderQuote
- **[references/workflow-types.md](references/workflow-types.md)** - 17 workflow definitions

---

## Type Quick Reference

### Passenger Types (lib/polarhub/types/common.ts)

```typescript
type PassengerTypeCode = 'ADT' | 'CHD' | 'INF';

interface PaxCodeType {
  PaxID: string;
  Ptc: PassengerTypeCode;
  BirthDate?: string;  // YYYY-MM-DD
}

interface PaxType extends PaxCodeType {
  Individual?: IndividualType;
  ContactInfoRefID?: string[];
  IdentityDoc?: IdentityDocType[];
}

interface IndividualType {
  NameTitle?: string;  // MR, MRS, MS
  GivenName: string[];  // Array!
  Surname: string;
  Birthdate?: string;
  Gender?: 'Male' | 'Female' | 'Unspecified';
}
```

### Cabin Class

```typescript
type CabinCode = 'Y' | 'W' | 'C' | 'F';
// Y: Economy, W: Premium Economy, C: Business, F: First
```

### Amount

```typescript
interface AmountType {
  Amount: number;
  CurCode: string;  // ISO 4217 (KRW, USD, EUR)
}
```

### Payment Types

```typescript
type PaymentTypeCode = 'CA' | 'CC' | 'EP' | 'AG';
// CA: BSP Cash, CC: Credit Card, EP: EasyPay, AG: Agent Deposit

interface PaymentType {
  Type: string;
  Amount: number;
  CurCode: string;
  PaymentCardMethod?: PaymentCardMethod;
  PaxRefID?: string[];
}
```

---

## API Request/Response Types

### AirShopping

```typescript
interface AirShoppingQuery {
  OriginDestList: OriginDestRequestType[];
  PaxList: PaxCodeType[];
  Cabin?: CabinCode;
  Criteria?: CriteriaType;
}

interface AirShoppingRS {
  ResultMessage: ResultMessageType;
  TransactionID: string;
  Offer?: OfferType[];
}
```

### OfferPrice (Multiple Offer Support)

```typescript
interface OfferPriceQuery {
  Offers: OfferPriceOfferType[];  // Array! Multiple offers possible
  PaxList: PaxCodeType[];
}

interface OfferPriceOfferType {
  ResponseID: string;
  OfferID: string;
  Owner: string;
  OfferItems: OfferItemRequestType[];
}

// Workflow-specific optional fields
interface OfferItemRequestType {
  OfferItemID: string;
  PaxRefID: string[];
  SeatSelection?: SeatSelectionType;         // WF_PB_SEAT
  BookingInstructions?: BookingInstructionsType;  // WF_PB_SERVICE
}
```

### OrderCreate

```typescript
interface OrderCreateQuery {
  Order: OrderOfferType[];
  PaxList: PaxType[];
  PaymentList?: PaymentType[];  // Required for WF_PB_IMMEDIATE
  ContactInfoList?: ContactInfoType[];
}
```

### Order Response

```typescript
interface OrderViewRS {
  ResultMessage: ResultMessageType;
  TransactionID: string;
  Order?: OrderViewOrderType;
}

interface OrderViewOrderType {
  OrderID: string;
  OrderStatus: 'OK' | 'X';
  BookingReference?: BookingReferenceType[];
}
```

---

## Workflow Types

### Prime Booking (5 types)

```typescript
type PrimeBookingWorkflow =
  | 'WF_PB_DEFERRED'      // Deferred ticketing
  | 'WF_PB_IMMEDIATE'     // Immediate ticketing
  | 'WF_PB_SEAT'          // With seat selection
  | 'WF_PB_SERVICE'       // With ancillary services
  | 'WF_PB_SEAT_SERVICE'; // With seat + services
```

### Post-Booking Held (7 types)

```typescript
type PostBookingHeldWorkflow =
  | 'WF_HELD_SEAT'     // Seat change
  | 'WF_HELD_SERVICE'  // Service addition
  | 'WF_HELD_CONFIRM'  // Booking confirmation
  | 'WF_HELD_CANCEL'   // Booking cancellation
  | 'WF_HELD_ITIN'     // Itinerary change
  | 'WF_HELD_PAX'      // Passenger info change
  | 'WF_HELD_SPLIT';   // PNR split
```

### Post-Booking Ticketed (5 types)

```typescript
type PostBookingTicketedWorkflow =
  | 'WF_TKT_SEAT'       // Seat change
  | 'WF_TKT_SERVICE'    // Service addition
  | 'WF_TKT_VOLCHANGE'  // Voluntary itinerary change
  | 'WF_TKT_REFUND'     // Refund
  | 'WF_TKT_OCN';       // Involuntary change acceptance
```

---

## OrderChange 7 Types

```typescript
interface ChangeOrderChoice {
  // Choose one - mutually exclusive
  AcceptSelectedQuotedOfferList?: { ... };  // Seat/service change
  UpdatePax?: UpdatePaxType[];               // Passenger info change
  AcceptChange?: { ... };                    // Involuntary change acceptance
  AcceptOrderItemList?: { ... };             // Booking confirmation
  // ... etc.
}
```

---

## Workflow Support by Airline

| Tier | Airlines | Support Scope |
|------|----------|---------------|
| **Full** | AY, SQ, KL | All 17 workflows |
| **High** | AF, TK, HA | Most workflows |
| **Medium** | QR, EK, LH | Some Post-Booking |
| **Basic** | AA, BA | Prime + Refund only |
| **Minimal** | TR | Prime + Hold only |
| **None** | KE | Not supported |

---

## Helper Functions

```typescript
// Check workflow support
function isWorkflowSupported(carrier: string, workflow: WorkflowId): boolean;

// Get supported workflows by airline
function getSupportedWorkflows(carrier: string): WorkflowId[];

// Get API sequence by workflow
function getApiSequence(workflowId: WorkflowId): string[];

// Get workflows by phase
function getWorkflowsByPhase(phase: string): WorkflowDefinition[];
```

---

## Type File Structure (lib/polarhub/types/)

```
types/
├── common.ts           # Common types
├── air-shopping.ts     # AirShopping API
├── offer-price.ts      # OfferPrice API (per workflow)
├── order.ts            # OrderCreate, OrderRetrieve
├── seat-availability.ts # SeatAvailability API
├── service-list.ts     # ServiceList API
├── order-change.ts     # OrderChange API
├── order-reshop.ts     # OrderReshop API
├── order-quote.ts      # OrderQuote API
├── workflow-types.ts   # 17 workflow definitions
└── workflow-support.ts # Airline support matrix
```
