---
name: polarhub-dto-templates
description: "PolarHub NestJS DTO templates. Complete examples with class-validator, class-transformer, and @nestjs/swagger decorators."
---

# PolarHub DTO Templates

Complete code templates for reference when writing NestJS DTOs.

---

## 1. Required Import Statements

```typescript
// Required imports at the top of every DTO file
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  Matches,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
```

---

## 2. Basic Field Patterns

### 2.1 Required String Field

```typescript
@ApiProperty({
  description: 'Transaction ID (32-char hex)',
  example: '4ba5a0b50d2c45b3b5eb343b57ba8897',
})
@IsString()
transactionId: string;
```

### 2.2 Optional String Field

```typescript
@ApiPropertyOptional({
  description: 'Cabin class (Y, W, C, F)',
  example: 'Y',
})
@IsOptional()
@IsString()
cabin?: string;
```

### 2.3 Required String Array

```typescript
@ApiProperty({
  type: [String],
  description: 'Passenger reference IDs',
  example: ['PAX1', 'PAX2'],
})
@IsArray()
@IsString({ each: true })
@ArrayMinSize(1)
paxRefId: string[];
```

### 2.4 Optional String Array

```typescript
@ApiPropertyOptional({
  type: [String],
  description: 'Airline preference (IATA codes)',
  example: ['SQ', 'AY'],
})
@IsOptional()
@IsArray()
@IsString({ each: true })
airlinePreference?: string[];
```

### 2.5 Number Field

```typescript
@ApiProperty({
  description: 'Payment amount',
  example: 1500000,
})
@IsNumber()
amount: number;
```

### 2.6 Boolean Field

```typescript
@ApiPropertyOptional({
  description: 'Direct flights only',
  example: true,
})
@IsOptional()
@IsBoolean()
directOnly?: boolean;
```

### 2.7 Pattern Validation Field

```typescript
@ApiProperty({
  description: 'Birth date (YYYY-MM-DD)',
  example: '1990-01-15',
})
@IsString()
@Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
birthdate: string;

@ApiProperty({
  description: 'Country code (ISO 3166-1 alpha-2)',
  example: 'KR',
})
@IsString()
@Matches(/^[A-Z]{2}$/, { message: 'Must be ISO 3166-1 alpha-2 country code' })
countryCode: string;
```

### 2.8 Enum Field

```typescript
@ApiProperty({
  enum: ['ADT', 'CHD', 'INF'],
  description: 'Passenger type',
  example: 'ADT',
})
@IsString()
@IsEnum(['ADT', 'CHD', 'INF'])
ptc: string;

// Or handle as plain string (more flexible)
@ApiProperty({
  enum: ['ADT', 'CHD', 'INF'],
  example: 'ADT',
})
@IsString()
ptc: string;
```

---

## 3. Nested Object Patterns (CRITICAL)

### 3.1 Required Nested Object

```typescript
// Must always use @ValidateNested() + @Type() together!
@ApiProperty({ type: TravelAgencyDto })
@ValidateNested()
@Type(() => TravelAgencyDto)
travelAgency: TravelAgencyDto;
```

### 3.2 Optional Nested Object

```typescript
@ApiPropertyOptional({ type: SeatSelectionDto, description: 'For WF_PB_SEAT' })
@IsOptional()
@ValidateNested()
@Type(() => SeatSelectionDto)
seatSelection?: SeatSelectionDto;
```

### 3.3 Nested Object Array

```typescript
@ApiProperty({ type: [OrderOfferItemDto] })
@IsArray()
@ArrayMinSize(1)
@ValidateNested({ each: true })  // each: true is required!
@Type(() => OrderOfferItemDto)
offerItems: OrderOfferItemDto[];
```

### 3.4 Optional Nested Object Array

```typescript
@ApiPropertyOptional({ type: [IdentityDocDto], description: 'Passport info' })
@IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => IdentityDocDto)
identityDoc?: IdentityDocDto[];
```

---

## 4. Common DTO Class Templates

### 4.1 Sender DTO

```typescript
/**
 * Travel Agency information
 * If not provided by FE, environment variable values are used (fallback)
 */
export class TravelAgencyDto {
  @ApiProperty({
    description: 'Travel Agency ID (required)',
    example: 'YOUR_TENANT_ID',
  })
  @IsString()
  agencyId: string;

  @ApiPropertyOptional({
    description: 'Site code',
    example: '01',
  })
  @IsOptional()
  @IsString()
  siteCode?: string;

  @ApiPropertyOptional({
    description: 'Agency name',
    example: 'Whitelabel Agency',
  })
  @IsOptional()
  @IsString()
  agencyName?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Contact info reference IDs',
    example: ['CTC_TA1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactInfoRefId?: string[];
}

export class SenderDto {
  @ApiProperty({ type: TravelAgencyDto })
  @ValidateNested()
  @Type(() => TravelAgencyDto)
  travelAgency: TravelAgencyDto;
}
```

### 4.2 Individual DTO (Passenger Personal Information)

```typescript
export class IndividualDto {
  @ApiPropertyOptional({
    enum: ['MR', 'MRS', 'MS', 'MSTR', 'MISS'],
    example: 'MR',
  })
  @IsOptional()
  @IsString()
  nameTitle?: string;

  @ApiProperty({
    type: [String],
    description: 'Given name(s) - uppercase',
    example: ['GILDONG'],
  })
  @IsArray()
  @IsString({ each: true })
  givenName: string[];

  @ApiProperty({
    description: 'Surname - uppercase',
    example: 'HONG',
  })
  @IsString()
  surname: string;

  @ApiProperty({
    example: '1990-01-15',
    description: 'Birth date (YYYY-MM-DD)',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  birthdate: string;

  @ApiPropertyOptional({ enum: ['Male', 'Female'] })
  @IsString()
  @IsOptional()
  gender?: 'Male' | 'Female';
}
```

### 4.3 IdentityDoc DTO (Passport Information)

**IMPORTANT**: `birthdate` exists in both Individual and IdentityDoc.
**PolarHub API often requires birthdate within IdentityDoc as mandatory.**

```typescript
export class IdentityDocDto {
  @ApiProperty({ description: 'Document type', example: 'PT' })
  @IsString()
  identityDocType: string;

  @ApiProperty({ description: 'Document number', example: 'M12345678' })
  @IsString()
  identityDocId: string;

  // IMPORTANT: birthdate within IdentityDoc is often mandatory!
  // Use the same value as Individual.birthdate
  @ApiProperty({
    description: 'Birth date in document (YYYY-MM-DD) - REQUIRED for most airlines',
    example: '1990-01-15',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthdate: string;

  @ApiProperty({
    description: 'Expiry date (must be 6+ months from departure)',
    example: '2030-01-01',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  expiryDate: string;

  @ApiProperty({ description: 'Issuing country ISO code', example: 'KR' })
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  issuingCountryCode: string;

  @ApiProperty({ description: 'Citizenship country ISO code', example: 'KR' })
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  citizenshipCountryCode: string;

  @ApiPropertyOptional({ description: 'Residence country code' })
  @IsOptional()
  @IsString()
  residenceCountryCode?: string;

  @ApiPropertyOptional({ description: 'Gender in document (Male, Female)' })
  @IsOptional()
  @IsString()
  gender?: string;
}
```

### 4.4 PaxDetail DTO (Passenger Details)

```typescript
export class PaxDetailDto {
  @ApiProperty({ example: 'PAX1', description: 'Passenger ID from PaxList' })
  @IsString()
  paxId: string;

  @ApiProperty({ enum: ['ADT', 'CHD', 'INF'], example: 'ADT' })
  @IsString()
  ptc: string;

  @ApiProperty({ type: IndividualDto })
  @ValidateNested()
  @Type(() => IndividualDto)
  individual: IndividualDto;

  @ApiPropertyOptional({ type: [IdentityDocDto], description: 'Passport info' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdentityDocDto)
  identityDoc?: IdentityDocDto[];

  @ApiPropertyOptional({ type: [String], description: 'Contact info reference IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactInfoRefId?: string[];

  // Used when no identityDoc (no hardcoding!)
  @ApiPropertyOptional({
    description: 'Citizenship country ISO code (required if no identityDoc)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'Must be ISO 3166-1 alpha-2 country code' })
  citizenshipCountryCode?: string;

  @ApiPropertyOptional({
    description: 'Residence country ISO code (required if no identityDoc)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'Must be ISO 3166-1 alpha-2 country code' })
  residenceCountryCode?: string;
}
```

### 4.5 Phone DTO

```typescript
export class PhoneDto {
  @ApiProperty({ example: '010-1234-5678' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ example: '82' })
  @IsOptional()
  @IsString()
  countryDialingCode?: string;

  @ApiPropertyOptional({
    description: 'Phone label (Mobile, Home, Work, etc.)',
    example: 'Mobile',
  })
  @IsOptional()
  @IsString()
  label?: string;  // No hardcoding! Provided by FE
}
```

### 4.6 PostalAddress DTO (Required for BA)

```typescript
export class PostalAddressDto {
  @ApiProperty({ type: [String], example: ['123 Main Street'] })
  @IsArray()
  @IsString({ each: true })
  street: string[];

  @ApiProperty({ example: 'Seoul' })
  @IsString()
  cityName: string;

  @ApiProperty({ example: '06000' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 'KR' })
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  countryCode: string;
}
```

### 4.7 ContactInfo DTO

**CRITICAL**: `emailAddress` and `phone` are **array** types!

```typescript
export class ContactInfoDto {
  @ApiProperty({ example: 'CI_PAX1' })
  @IsString()
  contactInfoId: string;

  // CRITICAL: Array type! Not a single string
  @ApiPropertyOptional({
    type: [String],
    description: 'Email addresses (MUST be array)',
    example: ['user@example.com'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emailAddress?: string[];

  // CRITICAL: Array type!
  @ApiPropertyOptional({ type: [PhoneDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PhoneDto)
  phone?: PhoneDto[];

  @ApiPropertyOptional({ type: [PostalAddressDto], description: 'Required for BA' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PostalAddressDto)
  postalAddress?: PostalAddressDto[];

  @ApiPropertyOptional({ description: 'Contact refused indicator' })
  @IsOptional()
  @IsBoolean()
  contactRefusedInd?: boolean;
}
```

### 4.8 Criteria DTO (Search/Fare Criteria)

```typescript
export class ProgramCriteriaDto {
  @ApiProperty({ example: 'SQ' })
  @IsString()
  airlineId: string;

  @ApiPropertyOptional({ example: 'CONTRACT001' })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiPropertyOptional({ example: 'CORPORATE' })
  @IsOptional()
  @IsString()
  typeCode?: string;
}

export class PromotionCriteriaDto {
  @ApiPropertyOptional({ example: 'PROMO2026' })
  @IsOptional()
  @IsString()
  promotionCode?: string;
}

export class SpecialFareCriteriaDto {
  @ApiPropertyOptional({ example: 'STUDENT' })
  @IsOptional()
  @IsString()
  typeCode?: string;
}

export class ExistingOrderCriteriaDto {
  @ApiProperty({ example: 'ORD123456' })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({ type: [String], example: ['PAX1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxRefId?: string[];
}

export class AirlinePreferenceDto {
  @ApiPropertyOptional({ type: [String], example: ['SQ', 'AY'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  airlineId?: string[];
}

export class CriteriaDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  direct?: boolean;

  @ApiPropertyOptional({ type: AirlinePreferenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AirlinePreferenceDto)
  airlinePreference?: AirlinePreferenceDto;

  @ApiPropertyOptional({ type: [ProgramCriteriaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramCriteriaDto)
  programCriteria?: ProgramCriteriaDto[];

  @ApiPropertyOptional({ type: [PromotionCriteriaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionCriteriaDto)
  promotionCriteria?: PromotionCriteriaDto[];

  @ApiPropertyOptional({ type: [SpecialFareCriteriaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialFareCriteriaDto)
  specialFareCriteria?: SpecialFareCriteriaDto[];

  @ApiPropertyOptional({ type: ExistingOrderCriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExistingOrderCriteriaDto)
  existingOrderCriteria?: ExistingOrderCriteriaDto;
}
```

### 4.9 ResponseParameter DTO

```typescript
export class LanguageUsageDto {
  @ApiProperty({ example: 'ko' })
  @IsString()
  langCode: string;

  @ApiPropertyOptional({ example: 'Written' })
  @IsOptional()
  @IsString()
  langUsageType?: string;
}

export class ResponseParameterDto {
  @ApiProperty({ example: 'KRW' })
  @IsString()
  currencyCode: string;

  @ApiPropertyOptional({ type: LanguageUsageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LanguageUsageDto)
  languageUsage?: LanguageUsageDto;
}
```

### 4.10 FopPromotion DTO (Card/Payment Promotion)

```typescript
export class PtcPromotionAmountDto {
  @ApiProperty({ example: 'ADT' })
  @IsString()
  ptc: string;

  @ApiProperty({ type: AmountDto })
  @ValidateNested()
  @Type(() => AmountDto)
  amount: AmountDto;
}

export class FopPromotionDto {
  @ApiProperty({ example: 'VISA2026' })
  @IsString()
  promotionCode: string;

  @ApiPropertyOptional({
    description: 'A=Card, C=Cash, K=KakaoPay, S=SamsungPay',
    example: 'A',
  })
  @IsOptional()
  @IsString()
  paymentType?: string;

  @ApiPropertyOptional({ type: AmountDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AmountDto)
  totalPromotionAmount?: AmountDto;

  @ApiPropertyOptional({ type: [PtcPromotionAmountDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PtcPromotionAmountDto)
  ptcPromotionAmount?: PtcPromotionAmountDto[];

  @ApiPropertyOptional({ example: 'VI' })
  @IsOptional()
  @IsString()
  cardCode?: string;

  @ApiPropertyOptional({ example: 'VISA' })
  @IsOptional()
  @IsString()
  cardName?: string;
}
```

### 4.11 LoyaltyProgramAccount DTO (Mileage - Supported by AF, KL only)

```typescript
export class LoyaltyProgramAccountDto {
  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'FB' })
  @IsOptional()
  @IsString()
  programCode?: string;

  @ApiPropertyOptional({ example: 'Flying Blue' })
  @IsOptional()
  @IsString()
  programName?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsString()
  signInId?: string;

  @ApiPropertyOptional({ example: 'GOLD' })
  @IsOptional()
  @IsString()
  tierCode?: string;

  @ApiPropertyOptional({ example: 'Gold Member' })
  @IsOptional()
  @IsString()
  tierName?: string;
}
```

### 4.12 RepricedOrderId, Affect DTO (Shared by OrderQuote and OrderChange)

> **IMPORTANT**: `RepricedOrderIdDto` is used by both OrderQuote and OrderChange.
> - OrderQuote: Maps to `Query.RepricedOrderID`
> - OrderChange (deferred ticketing): Maps to `Query.RepricedOrderID` (can be used instead of changeOrderChoice)

```typescript
/**
 * RepricedOrderId DTO
 *
 * Purpose:
 * - OrderQuote: Deferred ticketing fare recalculation
 * - OrderChange: Deferred ticketing (WF_HELD_CONFIRM) - maps directly to Query.RepricedOrderID
 *
 * IMPORTANT: Different from OrderChange.changeOrderChoice.acceptRepricedOrder!
 * - acceptRepricedOrder: { offerRefId: string[] } - simple OfferRefID array
 * - repricedOrderId: { orderId, orderItemRefId } - allows OrderItemRefID specification
 */
export class RepricedOrderIdDto {
  @ApiProperty({ description: 'Order ID to be repriced', example: 'TSDEV-20260126-424c888145864d24' })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'OrderItemID(s) to be repriced',
    example: ['AY1059O3QVT00_AIR-1-2', 'AY1059O3QVT00_SRV14'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderItemRefId?: string[];
}

export class AffectDto {
  @ApiProperty({ description: 'OrderItem ID that is affected', example: 'OI1' })
  @IsString()
  orderItemRefId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of RetainService IDs',
    example: ['SVC1', 'SVC2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  retainServiceId?: string[];
}
```

### 4.13 Payment DTO

```typescript
export class CashPaymentDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  cashPaymentInd: boolean;
}

export class CardPaymentDto {
  @ApiProperty({ example: 'VI' })
  @IsString()
  cardCode: string;

  @ApiProperty({ example: '4111111111111111' })
  @IsString()
  cardNumber: string;

  @ApiProperty({ example: 'HONG GILDONG' })
  @IsString()
  cardHolderName: string;

  @ApiProperty({ description: 'MM/YY format', example: '12/25' })
  @IsString()
  expiration: string;

  @ApiProperty({ description: 'CVV', example: '123' })
  @IsString()
  seriesCode: string;
}

export class AgentDepositDto {
  @ApiProperty({ example: 'AG001' })
  @IsString()
  agentDepositId: string;
}

export class PaymentMethodDto {
  @ApiPropertyOptional({ type: CashPaymentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CashPaymentDto)
  cash?: CashPaymentDto;

  @ApiPropertyOptional({ type: CardPaymentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CardPaymentDto)
  card?: CardPaymentDto;

  @ApiPropertyOptional({ type: AgentDepositDto, description: 'TR only' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgentDepositDto)
  agentDeposit?: AgentDepositDto;
}

export class AmountDto {
  @ApiProperty({ example: 'KRW' })
  @IsString()
  currencyCode: string;

  @ApiProperty({ example: 1500000 })
  @IsNumber()
  amount: number;
}

export class PaymentDto {
  @ApiProperty({ type: PaymentMethodDto })
  @ValidateNested()
  @Type(() => PaymentMethodDto)
  paymentMethod: PaymentMethodDto;

  @ApiProperty({ type: AmountDto })
  @ValidateNested()
  @Type(() => AmountDto)
  amount: AmountDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderItemId?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  offerItemId?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxRefId?: string[];
}
```

---

## 5. API-Specific Request DTO Templates

### 5.1 AirShopping Request DTO

```typescript
export class PassengerDto {
  @ApiProperty({ enum: ['ADT', 'CHD', 'INF'], example: 'ADT' })
  @IsString()
  type: string;

  @ApiProperty({ minimum: 1, example: 2 })
  @IsNumber()
  count: number;
}

export class OriginDestDto {
  @ApiProperty({ description: 'Origin airport code', example: 'ICN' })
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  origin: string;

  @ApiProperty({ description: 'Destination airport code', example: 'SIN' })
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  destination: string;

  @ApiProperty({ description: 'Departure date', example: '2026-03-15' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  departureDate: string;
}

export class AirShoppingRequestDto {
  @ApiProperty({
    description: 'Transaction ID (32-char hex, generated by FE)',
    example: '4ba5a0b50d2c45b3b5eb343b57ba8897',
  })
  @IsString()
  @Matches(/^[a-f0-9]{32}$/i)
  transactionId: string;

  @ApiPropertyOptional({ type: SenderDto, description: 'Optional - uses env if not provided' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SenderDto)
  sender?: SenderDto;

  @ApiProperty({ type: [OriginDestDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OriginDestDto)
  originDestList: OriginDestDto[];

  @ApiProperty({ type: [PassengerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers: PassengerDto[];

  @ApiPropertyOptional({ enum: ['Y', 'W', 'C', 'F'], example: 'Y' })
  @IsOptional()
  @IsString()
  cabin?: string;

  // Search criteria (recommended - full structure)
  @ApiPropertyOptional({ type: CriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriteriaDto)
  criteria?: CriteriaDto;

  // Response settings (currency, language)
  @ApiPropertyOptional({ type: ResponseParameterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResponseParameterDto)
  responseParameter?: ResponseParameterDto;

  // Legacy fields (deprecated - use criteria instead)
  @ApiPropertyOptional({ type: [String], example: ['SQ', 'AY'], deprecated: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  airlinePreference?: string[];

  @ApiPropertyOptional({ example: false, deprecated: true })
  @IsOptional()
  @IsBoolean()
  directOnly?: boolean;
}
```

### 5.2 OrderCreate Request DTO

```typescript
export class OrderCreateRequestDto {
  @ApiProperty({
    description: 'Transaction ID (same as AirShopping/OfferPrice)',
    example: '4ba5a0b50d2c45b3b5eb343b57ba8897',
  })
  @IsString()
  @Matches(/^[a-f0-9]{32}$/i)
  transactionId: string;

  @ApiPropertyOptional({ type: SenderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SenderDto)
  sender?: SenderDto;

  @ApiProperty({ type: [OrderSelectionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderSelectionDto)
  orders: OrderSelectionDto[];

  @ApiProperty({ type: [PaxDetailDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaxDetailDto)
  paxList: PaxDetailDto[];

  @ApiPropertyOptional({ type: [ContactInfoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactInfoDto)
  contactInfoList?: ContactInfoDto[];

  @ApiPropertyOptional({
    type: [PaymentDto],
    description: 'Required for WF_PB_IMMEDIATE (immediate ticketing)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  paymentList?: PaymentDto[];
}
```

### 5.3 OrderQuote Request DTO

```typescript
export class QuoteSelectedOfferDto {
  @ApiProperty({ example: 'OFFER123' })
  @IsString()
  offerId: string;

  @ApiProperty({ example: 'SQ' })
  @IsString()
  owner: string;

  @ApiPropertyOptional({ example: 'RESP123' })
  @IsOptional()
  @IsString()
  responseId?: string;

  @ApiProperty({ type: [OfferItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OfferItemDto)
  offerItems: OfferItemDto[];

  @ApiPropertyOptional({ type: FopPromotionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FopPromotionDto)
  fopPromotion?: FopPromotionDto;
}

export class OrderQuoteRequestDto {
  @ApiProperty({
    description: 'Transaction ID (same as OrderRetrieve)',
    example: '4ba5a0b50d2c45b3b5eb343b57ba8897',
  })
  @IsString()
  @Matches(/^[a-f0-9]{32}$/i)
  transactionId: string;

  @ApiPropertyOptional({ type: SenderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SenderDto)
  sender?: SenderDto;

  @ApiProperty({ description: 'Order ID to quote', example: 'ORD123456' })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    description: 'Action context (8 = Voluntary, 9 = Involuntary)',
    example: '8',
  })
  @IsOptional()
  @IsString()
  actionContext?: string;

  // Mode 1: Seat/service quote
  @ApiPropertyOptional({ type: QuoteSelectedOfferDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuoteSelectedOfferDto)
  selectedOffer?: QuoteSelectedOfferDto;

  // Mode 2: Deferred ticketing fare recalculation (WF_HELD_CONFIRM)
  @ApiPropertyOptional({ type: RepricedOrderIdDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RepricedOrderIdDto)
  repricedOrderId?: RepricedOrderIdDto;

  // Affected OrderItem + RetainService specification
  @ApiPropertyOptional({ type: [AffectDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AffectDto)
  affect?: AffectDto[];

  // Special fares, programs, promotions
  @ApiPropertyOptional({ type: CriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriteriaDto)
  criteria?: CriteriaDto;

  // Response settings (currency, language)
  @ApiPropertyOptional({ type: ResponseParameterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResponseParameterDto)
  responseParameter?: ResponseParameterDto;
}
```

---

## 6. Swagger Example Writing Guide

### 6.1 Complete Request Example (Swagger @ApiProperty example)

```typescript
@ApiProperty({
  example: [
    {
      contactInfoId: 'CI_PAX1',
      emailAddress: 'user@example.com',
      phone: { phoneNumber: '01012345678', countryDialingCode: '82', label: 'Mobile' },
    },
    {
      contactInfoId: 'CTC_TA1',
      emailAddress: 'agency@example.com',
      phone: { phoneNumber: '234486101', countryDialingCode: '82', label: 'Work' },
      postalAddress: {
        street: ['8F, 78 Namdaemun-ro, Jung-gu'],
        cityName: 'Seoul',
        postalCode: '04527',
        countryCode: 'KR',
      },
    },
  ],
})
contactInfoList: ContactInfoDto[];
```

---

## 7. DTO Checklist

### Before Writing

- [ ] All necessary imports included
- [ ] Field types verified in OpenAPI spec
- [ ] Required array checked (for optional status)

### During Writing

- [ ] Required fields: `@ApiProperty`, `@IsString/@IsNumber/...`
- [ ] Optional fields: `@ApiPropertyOptional`, `@IsOptional`, `?` suffix
- [ ] Array fields: `@IsArray`, `@IsString({ each: true })`, `[Type]`
- [ ] Nested objects: `@ValidateNested()`, `@Type(() => NestedDto)`
- [ ] Nested arrays: `@ValidateNested({ each: true })`, `@Type(() => ItemDto)`
- [ ] Pattern validation: `@Matches(/pattern/)` (dates, country codes, etc.)

### After Writing

- [ ] Do all fields have description and example?
- [ ] Are there no hardcoded values?
- [ ] Are separate DTO classes used instead of inline types?
- [ ] No TypeScript compilation errors?

---

## 8. Common DTO Validation Errors (CRITICAL)

### 8.1 "property X should not exist" Error

**Cause**: `forbidNonWhitelisted: true` setting rejects fields not defined in the DTO

**Solution**:
1. Check if the field is defined in the DTO
2. Verify the server is running with the latest code (may need a server restart)
3. Check that `@Type()` decorator is not missing

### 8.2 "emailAddress must be a string" Error

**Cause**: `emailAddress` is an **array** (`string[]`) type but a single string was sent

**Correct usage**:
```typescript
// WRONG
"emailAddress": "user@example.com"

// CORRECT
"emailAddress": ["user@example.com"]
```

### 8.3 "identityDoc.birthdate must match" Error

**Cause**: `birthdate` field within `IdentityDoc` is missing or has format error

**Solution**:
```typescript
"identityDoc": [{
  "identityDocType": "PT",
  "identityDocId": "M12345678",
  "birthdate": "1990-01-15",  // ← Required! Same value as Individual.birthdate
  "expiryDate": "2030-01-01",
  "issuingCountryCode": "KR",
  "citizenshipCountryCode": "KR"
}]
```

### 8.4 Array vs Single Object Confusion

**CRITICAL**: The following fields are **arrays**:
- `emailAddress: string[]`
- `phone: PhoneDto[]`
- `postalAddress: PostalAddressDto[]`
- `identityDoc: IdentityDocDto[]`
- `givenName: string[]`
- `contactInfoRefId: string[]`

### 8.5 Gender Value Format

**PolarHub API Gender values**:
```typescript
// Individual.gender - Title case
"gender": "Male" | "Female"

// IdentityDoc.gender - Title case
"gender": "Male" | "Female"
```

---

## 9. Required Fields Summary by API

| API | Required Fields | Notes |
|-----|----------------|-------|
| AirShopping | transactionId, originDestList, passengers | airlinePreference possible via criteria |
| OfferPrice | transactionId, offers, paxList | offers.offerItems required |
| OrderCreate | transactionId, orders, paxList | identityDoc.birthdate required |
| OrderRetrieve | transactionId, orderId | - |
| OrderCancel | transactionId, orderId | refundQuoteId required for refunds |
