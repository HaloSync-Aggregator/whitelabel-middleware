# Common Types Reference

Common type definitions used across all PolarHub APIs.

## Travel Agency

```typescript
export interface TravelAgencyType {
  AgencyID: string;
  SiteCode?: string;
  AgencyName?: string;
  ContactInfoRefID?: string[];
}
```

## Passenger Types

```typescript
export type PassengerTypeCode = 'ADT' | 'CHD' | 'INF';

export interface PaxCodeType {
  PaxID: string;
  Ptc: PassengerTypeCode;
  PaxRefID?: string;           // For OfferPrice response mapping
  Birthdate?: string;          // YYYY-MM-DD (required for CHD/INF)
  LoyaltyProgramAccount?: LoyaltyProgramAccountType[];  // Supported by AF, KL only
}

export interface LoyaltyProgramAccountType {
  AccountNumber?: string;
  ProgramCode?: string;
  ProgramName?: string;
  SignInID?: string;
  TierCode?: string;
  TierName?: string;
}

export interface PaxType extends PaxCodeType {
  Individual?: IndividualType;
  ContactInfoRefID?: string[];
  Gender?: 'Male' | 'Female' | 'Unspecified';
  ResidenceCountryCode?: string;
  CitizenshipCountryCode?: string;
  IdentityDoc?: IdentityDocType[];
}

export interface IndividualType {
  IndividualID?: string;
  Birthdate?: string;
  Birthplace?: string;
  Gender?: 'Male' | 'Female' | 'Unspecified';
  NameTitle?: string;  // MR, MRS, MS
  GivenName: string[];
  MiddleName?: string[];
  Surname: string;
  SurnameSuffix?: string;
}

export interface IdentityDocType {
  IdentityDocumentNumber: string;
  IdentityDocumentType: string;  // PT (Passport), etc.
  IssuingCountryCode?: string;
  CitizenshipCountryCode?: string;
  ResidenceCountryCode?: string;
  IssueDate?: string;
  ExpiryDate?: string;
  Birthdate?: string;
  Gender?: 'Male' | 'Female' | 'Unspecified';
  GivenName?: string[];
  Surname?: string;
  Visa?: VisaType[];
}

export interface VisaType {
  VisaNumber?: string;
  VisaType?: string;
  VisaHostCountryCode?: string;
  EnterBeforeDate?: string;
  DurationOfStay?: number;
  NumberOfEntries?: number;
}
```

## Origin Destination

```typescript
export interface OriginDestRequestType {
  OriginCode: string;      // IATA 3-letter code (e.g., ICN)
  DestCode: string;        // IATA 3-letter code (e.g., SIN)
  DepartureDate: string;   // YYYY-MM-DD
}

export interface OriginDestType {
  OriginCode: string;
  DestCode: string;
  OriginDestID: string;
  PaxJourneyRefID?: string[];
}
```

## Cabin Class

```typescript
export type CabinCode = 'Y' | 'W' | 'C' | 'F';
// Y: Economy, W: Premium Economy, C: Business, F: First
```

## Search Criteria

```typescript
export interface CriteriaType {
  Direct?: boolean;
  AirlinePreference?: { AirlineID: string[] };
  ProgramCriteria?: ProgramCriterion[];
  PromotionCriteria?: PromotionCriterion[];
  SpecialFareCriteria?: SpecialFareCriterion[];
  ExistingOrderCriteria?: { OrderID: string; PaxRefID: string[] };
}
```

## Amount & Currency

```typescript
export interface AmountType {
  Amount: number;
  CurCode: string;  // ISO 4217 (KRW, USD, EUR)
}
```

## Contact Info

```typescript
export interface ContactInfoType {
  ContactInfoID: string;
  EmailAddress?: string[];
  Phone?: PhoneType[];
  ContactRefusedInd?: boolean;
  PostalAddress?: PostalAddressType[];
}

export interface PhoneType {
  Label?: string;
  CountryDialingCode?: string;
  PhoneNumber: string;
}

export interface PostalAddressType {
  Street?: string[];
  PostalCode?: string;
  CityName?: string;
  CountryCode?: string;
}
```

## Payment

```typescript
export type PaymentTypeCode = 'CA' | 'CC' | 'EP' | 'AG';
// CA: BSP Cash, CC: Credit Card, EP: EasyPay, AG: Agent Deposit

export interface PaymentType {
  Type: string;        // 'Cash' | 'Card' | 'AgentDeposit'
  Amount: number;
  CurCode: string;
  Card?: PaymentCardMethod;  // When Type is 'Card'
  PaxRefID?: string[];       // Target passenger IDs for payment
  OrderItemID?: string[];    // Target Order Item IDs for payment
  OfferItemID?: string[];    // Target Offer Item IDs for payment
}

export interface PaymentCardMethod {
  CardCode?: string;
  CardNumber?: string;
  CardHolderName?: string;
  EffectiveExpireDate?: { Expiration: string };
  SeriesCode?: string;
}
```

### PolarHub API PaymentList Structure (Actual)

```typescript
// Actual format accepted by PolarHub API
interface PolarHubPayment {
  Type: 'Cash' | 'Card' | 'AgentDeposit';
  Amount: number;
  CurCode: string;  // ISO 4217 (KRW, USD, EUR)
  Card?: {          // Only when Type is 'Card'
    CardCode: string;
    CardNumber: string;
    CardHolderName: string;
    Expiration: string;
    SeriesCode: string;
  };
}
```

### Payment DTOs (NestJS - For Frontend)

```typescript
// Format received from frontend (converted to PolarHub format in Service)
export class CashPaymentDto {
  @IsBoolean() @IsOptional() cashPaymentInd?: boolean = true;
}

export class CardPaymentDto {
  @IsString() cardCode: string;       // VI, MC, AX, JC
  @IsString() cardNumber: string;
  @IsString() cardHolderName: string;
  @IsString() expiration: string;     // MMYY
  @IsString() seriesCode: string;     // CVV
}

export class AgentDepositDto {
  @IsString() agentDepositId: string;  // TR airline exclusive
}

export class PaymentMethodDto {
  @IsOptional() @ValidateNested() @Type(() => CashPaymentDto) cash?: CashPaymentDto;
  @IsOptional() @ValidateNested() @Type(() => CardPaymentDto) card?: CardPaymentDto;
  @IsOptional() @ValidateNested() @Type(() => AgentDepositDto) agentDeposit?: AgentDepositDto;
}

export class PaymentAmountDto {
  @IsString() currencyCode: string;
  @IsNumber() amount: number;
}

export class PaymentDto {
  @ValidateNested() @Type(() => PaymentMethodDto) paymentMethod: PaymentMethodDto;
  @ValidateNested() @Type(() => PaymentAmountDto) amount: PaymentAmountDto;

  // Optional payment allocation fields - pass through to PolarHub
  @IsOptional() @IsArray() @IsString({ each: true }) orderItemId?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) offerItemId?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) paxRefId?: string[];
}
```

## Offer Item (Request)

```typescript
export interface SeatSelectionType {
  Column: string;
  Row: string;
}

export interface BookingInstructionsType {
  Text?: string[];            // General instructions
  Ositext?: string[];         // OSI (Other Service Information)
  SsrCode?: string[];         // SSR codes (FBAG, ABAG, XBA, SEAT, etc.)
  UpgradeMethod?: string;     // Upgrade method
  Method?: string;            // Specific action/process method
  Equipment?: string;         // Equipment/device information
}

export interface OfferItemRequestType {
  OfferItemID: string;
  PaxRefID: string[];
  Qty?: number;               // Quantity (for ancillary services, etc.)
  SeatSelection?: SeatSelectionType;
  BookingInstructions?: BookingInstructionsType;
}
```

## Result Message

```typescript
export interface ResultMessageType {
  Code: string;
  Message: string;
  MessageDetail?: {
    Errors?: ErrorDetail[];
    Warnings?: WarningDetail[];
  };
}
```
