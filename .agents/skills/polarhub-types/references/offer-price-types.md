# OfferPrice Types Reference

Type definitions for each OfferPrice API workflow.

## Workflow Types

```typescript
export type OfferPriceWorkflow =
  | 'WF_PB_DEFERRED'      // Deferred ticketing
  | 'WF_PB_IMMEDIATE'     // Immediate ticketing
  | 'WF_PB_SEAT'          // With seat selection
  | 'WF_PB_SERVICE'       // With ancillary services
  | 'WF_PB_SEAT_SERVICE'; // With seat + services
```

## Seat Selection (WF_PB_SEAT, WF_PB_SEAT_SERVICE)

```typescript
export interface SeatSelectionType {
  Column: string;  // A-K (seat column)
  Row: string;     // Seat row number
}
```

## Booking Instructions (WF_PB_SERVICE, WF_PB_SEAT_SERVICE)

```typescript
export interface BookingInstructionsType {
  Text?: string[];     // Service text (e.g., "TTL10KG")
  Ositext?: string[];  // OSI text pattern (e.g., "TTL\\s?%WVAL%KG")
}
```

## Offer Item Request (Optional fields per workflow)

```typescript
export interface OfferItemRequestType {
  OfferItemID: string;
  PaxRefID: string[];
  SeatSelection?: SeatSelectionType;         // WF_PB_SEAT, WF_PB_SEAT_SERVICE
  BookingInstructions?: BookingInstructionsType;  // WF_PB_SERVICE, WF_PB_SEAT_SERVICE
}
```

## Request Types

```typescript
export interface OfferPriceOfferType {
  ResponseID: string;
  OfferID: string;
  Owner: string;
  OfferItems: OfferItemRequestType[];
}

export interface OfferPriceQuery {
  Offers: OfferPriceOfferType[];  // Supports multiple offers!
  PaxList: PaxCodeType[];
  Criteria?: CriteriaType;
  ResponseParameter?: ResponseParameterType;
}

export interface OfferPriceRQ {
  Sender: { TravelAgency: TravelAgencyType };
  PointOfSale: string;
  TransactionID: string;
  Query: OfferPriceQuery;
}
```

## Response Types

```typescript
export interface PricedOfferType {
  ResponseID: string;
  OfferID: string;
  Owner: string;
  TotalPrice: TotalPriceType;
  OfferTimeLimit?: string;  // ISO 8601 datetime
  PaymentTimeLimit?: string;
  JourneyOverview?: JourneyOverviewType[];
  MatchResult?: 'RT' | 'OW';  // RoundTrip, OneWay
  BaggageAllowance?: BaggageAllowanceType[];
  OfferItem: OfferItemType[];
}

export interface OfferPriceRS {
  ResultMessage: ResultMessageType;
  Recipient: { TravelAgency: TravelAgencyType };
  PointOfSale: string;
  TransactionID: string;
  PricedOffer?: PricedOfferType;
  DataLists?: DataListType;
  AugmentationPoint?: { Any: object[] };
}

export interface JourneyOverviewType {
  JourneyID: string;
  CabinInfo?: CabinInfoType[];
}

export interface CabinInfoType {
  CabinCode: CabinCode;
  CabinName?: string;
  RBD?: string;  // Reservation Booking Designator
}
```
