# API Types Reference

Request/response type definitions for each API.

## AirShopping

```typescript
export interface AirShoppingQuery {
  OriginDestList: OriginDestRequestType[];
  PaxList: PaxCodeType[];
  Cabin?: CabinCode;
  Criteria?: CriteriaType;
  ResponseParameter?: ResponseParameterType;
}

export interface AirShoppingRS {
  ResultMessage: ResultMessageType;
  TransactionID: string;
  Offer?: OfferType[];
  DataLists?: DataListType;
}

export interface OfferType {
  ResponseID: string;
  OfferID: string;
  Owner: string;
  TotalPrice: TotalPriceType;
  OfferItem: OfferItemType[];
  BaggageAllowance?: BaggageAllowanceType[];
}
```

## Order Types

```typescript
export interface OrderCreateQuery {
  Order: OrderOfferType[];
  PaxList: PaxType[];
  PaymentList?: PaymentType[];
  ContactInfoList?: ContactInfoType[];
}

export interface OrderViewRS {
  ResultMessage: ResultMessageType;
  TransactionID: string;
  Order?: OrderViewOrderType;
}

export interface OrderViewOrderType {
  OrderID: string;
  OrderStatus: 'OK' | 'X';
  TotalPrice?: TotalPriceType;
  BookingReference?: BookingReferenceType[];
}

export interface BookingReferenceType {
  Id: string;  // PNR
  AirlineID?: string;
}
```

## SeatAvailability

```typescript
export interface SeatAvailabilityQuery {
  Order?: { OrderID: string };           // Post-Booking (choose one)
  Offer?: {                              // Prime Booking (choose one)
    ResponseID: string;
    OfferID: string;
    Owner: string;
  };
  PaxList?: PaxCodeType[];
  Criteria?: CriteriaType;
  ResponseParameter?: ResponseParameterType;  // Currency/language settings
}

export interface SeatAvailabilityRS {
  ResultMessage: ResultMessageType;
  TransactionID: string;
  SeatMap?: SeatMapType[];
  DataLists?: DataListType;
}

export interface SeatMapType {
  SegmentRef: string;
  CabinClass: CabinCode;
  Rows: SeatRowType[];
}

export interface SeatRowType {
  RowNumber: string;
  Seats: SeatType[];
}

export interface SeatType {
  Column: string;           // A-K
  Available: boolean;
  Characteristics?: string[];  // Window, Aisle, ExtraLegroom
  Price?: AmountType;
  OfferItemID?: string;
}
```

## ServiceList

```typescript
export interface ServiceListQuery {
  Order?: { OrderID: string };           // Post-Booking (choose one)
  Offer?: {                              // Prime Booking (choose one)
    ResponseID: string;
    OfferID: string;
    Owner: string;
  };
  PaxList?: PaxCodeType[];
  Criteria?: CriteriaType;
  ResponseParameter?: ResponseParameterType;  // Currency/language settings
}

export interface ServiceListRS {
  ResultMessage: ResultMessageType;
  TransactionID: string;
  ALaCarteOffer?: ALaCarteOfferType[];
  DataLists?: DataListType;
}

export type ServiceCategory = 'BAGGAGE' | 'SEAT' | 'MEAL' | 'LOUNGE' | 'OTHER';

export interface ALaCarteOfferType {
  OfferID: string;
  Owner: string;
  ServiceCategory: ServiceCategory;
  Name: string;
  Description?: string;
  Price: AmountType;
  OfferItemID: string;
  BookingInstructions?: BookingInstructionsType;
}
```

## Price Types

```typescript
export interface TotalPriceType {
  TotalAmount: AmountType;
  TotalBaseAmount?: AmountType;
  TotalTaxAmount?: AmountType;
  TravelAgencyServiceFee?: ServiceFeeType[];
  AgencyPromotion?: PromotionType;
  FopPromotion?: FopPromotionType;
}

export interface ServiceFeeType {
  Amount: number;
  CurCode: string;
  Description?: string;
}

export interface PromotionType {
  PromotionID?: string;
  DiscountAmount?: AmountType;
}
```
