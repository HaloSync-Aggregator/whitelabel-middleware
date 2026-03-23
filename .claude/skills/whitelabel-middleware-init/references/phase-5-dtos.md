# Phase 5: DTOs

## Files to Create (12 files)

| # | File | Path |
|---|------|------|
| 12 | common.dto.ts | src/lib/polarhub/dto/common.dto.ts |
| 13 | air-shopping.dto.ts | src/lib/polarhub/dto/air-shopping.dto.ts |
| 14 | offer-price.dto.ts | src/lib/polarhub/dto/offer-price.dto.ts |
| 15 | order-create.dto.ts | src/lib/polarhub/dto/order-create.dto.ts |
| 16 | order-retrieve.dto.ts | src/lib/polarhub/dto/order-retrieve.dto.ts |
| 17 | order-cancel.dto.ts | src/lib/polarhub/dto/order-cancel.dto.ts |
| 18 | order-change.dto.ts | src/lib/polarhub/dto/order-change.dto.ts |
| 19 | order-quote.dto.ts | src/lib/polarhub/dto/order-quote.dto.ts |
| 20 | order-reshop.dto.ts | src/lib/polarhub/dto/order-reshop.dto.ts |
| 21 | seat-availability.dto.ts | src/lib/polarhub/dto/seat-availability.dto.ts |
| 22 | service-list.dto.ts | src/lib/polarhub/dto/service-list.dto.ts |
| 23 | index.ts | src/lib/polarhub/dto/index.ts |

## File 12: common.dto.ts
**Path**: `src/lib/polarhub/dto/common.dto.ts`
````typescript
/**
 * Common DTOs
 *
 * Common DTO classes for PolarHub API.
 * Reused across all APIs.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==============================================
// Sender DTOs
// ==============================================

/**
 * Travel Agency Information
 */
export class TravelAgencyDto {
  @ApiProperty({ description: 'Agency ID (Tenant ID)', example: 'YOUR_TENANT_ID' })
  @IsString()
  agencyId: string;

  @ApiPropertyOptional({ description: 'Site Code', example: '01' })
  @IsOptional()
  @IsString()
  siteCode?: string;

  @ApiPropertyOptional({
    description: 'Agency Name',
    example: 'Whitelabel Agency',
  })
  @IsOptional()
  @IsString()
  agencyName?: string;

  @ApiPropertyOptional({
    description: 'Contact Info Reference IDs',
    example: ['CTC_TA1'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactInfoRefId?: string[];
}

/**
 * Sender Information - When provided by FE, takes priority over environment variables
 */
export class SenderDto {
  @ApiProperty({ description: 'Travel Agency information', type: TravelAgencyDto })
  @ValidateNested()
  @Type(() => TravelAgencyDto)
  travelAgency: TravelAgencyDto;
}

// ==============================================
// FE Auth Headers DTO
// ==============================================

/**
 * HMAC authentication headers provided by FE (Optional)
 * If all 3 headers are present, they are passed through; otherwise generated from environment variables
 */
export class FEAuthHeadersDto {
  @ApiPropertyOptional({
    description: 'RFC1123 timestamp',
    example: 'Thu, 16 Jan 2026 06:51:52 GMT',
  })
  @IsOptional()
  @IsString()
  'x-date'?: string;

  @ApiPropertyOptional({
    description: 'SHA-512 Digest',
    example: 'SHA-512={base64_hash}',
  })
  @IsOptional()
  @IsString()
  Digest?: string;

  @ApiPropertyOptional({
    description: 'HMAC Authorization',
    example: 'hmac username="YOUR_TENANT_ID", algorithm="hmac-sha512", ...',
  })
  @IsOptional()
  @IsString()
  Authorization?: string;
}

// ==============================================
// Passenger DTOs
// ==============================================

/**
 * Passenger Count - Number of passengers by type
 */
export class PassengerCountDto {
  @ApiProperty({
    description: 'Passenger type code',
    example: 'ADT',
    enum: ['ADT', 'CHD', 'INF'],
  })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Number of passengers', example: 1, minimum: 1 })
  @IsNumber()
  count: number;
}

/**
 * Simple Pax - ID and type only
 */
export class PaxSimpleDto {
  @ApiProperty({ description: 'Passenger ID', example: 'PAX1' })
  @IsString()
  paxId: string;

  @ApiProperty({
    description: 'Passenger type code',
    example: 'ADT',
    enum: ['ADT', 'CHD', 'INF'],
  })
  @IsString()
  ptc: string;
}

/**
 * Individual Information - Passenger personal information
 */
export class IndividualDto {
  @ApiPropertyOptional({ description: 'Name title', example: 'MR' })
  @IsOptional()
  @IsString()
  nameTitle?: string;

  @ApiProperty({
    description: 'Given names (First + Middle)',
    example: ['GILDONG'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  givenName: string[];

  @ApiProperty({ description: 'Surname (Last name)', example: 'HONG' })
  @IsString()
  surname: string;

  @ApiProperty({ description: 'Birth date (YYYY-MM-DD)', example: '1990-01-15' })
  @IsString()
  birthdate: string;

  @ApiPropertyOptional({
    description: 'Gender',
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'UNSPECIFIED'],
  })
  @IsOptional()
  @IsString()
  gender?: string;
}

/**
 * Identity Document - Passport, ID card, etc.
 */
export class IdentityDocDto {
  @ApiProperty({
    description: 'Document type',
    example: 'PT',
    enum: ['PT', 'ID', 'VI'],
  })
  @IsString()
  identityDocType: string;

  @ApiProperty({ description: 'Document number', example: 'M12345678' })
  @IsString()
  identityDocId: string;

  @ApiPropertyOptional({
    description: 'Expiry date (YYYY-MM-DD)',
    example: '2030-12-31',
  })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Issuing country code',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  issuingCountryCode?: string;

  @ApiPropertyOptional({
    description: 'Citizenship country code',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  citizenshipCountryCode?: string;
}

/**
 * Pax Detail - Passenger detailed information (for OrderCreate)
 */
export class PaxDetailDto {
  @ApiProperty({ description: 'Passenger ID', example: 'PAX1' })
  @IsString()
  paxId: string;

  @ApiProperty({
    description: 'Passenger type code',
    example: 'ADT',
    enum: ['ADT', 'CHD', 'INF'],
  })
  @IsString()
  ptc: string;

  @ApiProperty({ description: 'Individual information', type: IndividualDto })
  @ValidateNested()
  @Type(() => IndividualDto)
  individual: IndividualDto;

  @ApiPropertyOptional({
    description: 'Identity documents',
    type: [IdentityDocDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdentityDocDto)
  identityDoc?: IdentityDocDto[];

  @ApiPropertyOptional({
    description: 'Contact info reference IDs',
    example: ['CTC1'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactInfoRefId?: string[];

  @ApiPropertyOptional({
    description: 'Citizenship country code (required if no identityDoc)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  citizenshipCountryCode?: string;

  @ApiPropertyOptional({
    description: 'Residence country code (required if no identityDoc)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  residenceCountryCode?: string;
}

// ==============================================
// Contact Info DTOs
// ==============================================

/**
 * Phone Information
 */
export class PhoneDto {
  @ApiProperty({ description: 'Phone number', example: '01012345678' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Country dialing code', example: '82' })
  @IsOptional()
  @IsString()
  countryDialingCode?: string;

  @ApiPropertyOptional({
    description: 'Phone label (FE provides, not hardcoded)',
    example: 'Mobile',
  })
  @IsOptional()
  @IsString()
  label?: string;
}

/**
 * Postal Address (required for BA)
 */
export class PostalAddressDto {
  @ApiPropertyOptional({
    description: 'Street lines',
    example: ['123 Main St'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  street?: string[];

  @ApiPropertyOptional({ description: 'City name', example: 'Seoul' })
  @IsOptional()
  @IsString()
  cityName?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '06234' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country code', example: 'KR' })
  @IsOptional()
  @IsString()
  countryCode?: string;
}

/**
 * Contact Info - Contact information
 */
export class ContactInfoDto {
  @ApiProperty({ description: 'Contact info ID', example: 'CTC1' })
  @IsString()
  contactInfoId: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  emailAddress?: string;

  @ApiPropertyOptional({ description: 'Phone information', type: PhoneDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PhoneDto)
  phone?: PhoneDto;

  @ApiPropertyOptional({
    description: 'Postal address (required for BA)',
    type: PostalAddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PostalAddressDto)
  postalAddress?: PostalAddressDto;
}

// ==============================================
// Offer DTOs
// ==============================================

/**
 * Origin-Destination
 */
export class OriginDestDto {
  @ApiProperty({ description: 'Origin airport code', example: 'ICN' })
  @IsString()
  origin: string;

  @ApiProperty({ description: 'Destination airport code', example: 'SIN' })
  @IsString()
  destination: string;

  @ApiProperty({
    description: 'Departure date (YYYY-MM-DD)',
    example: '2026-03-15',
  })
  @IsString()
  departureDate: string;
}

/**
 * Seat Selection
 */
export class SeatSelectionDto {
  @ApiProperty({ description: 'Seat column', example: 'A' })
  @IsString()
  column: string;

  @ApiProperty({ description: 'Seat row', example: '10' })
  @IsString()
  row: string;
}

/**
 * Booking Instructions (when including services)
 */
export class BookingInstructionsDto {
  @ApiPropertyOptional({
    description: 'Instruction text',
    example: ['TTL10KG'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  text?: string[];

  @ApiPropertyOptional({
    description: 'OSI text',
    example: ['WHEELCHAIR'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ositext?: string[];
}

/**
 * Offer Item
 */
export class OfferItemDto {
  @ApiProperty({ description: 'Offer item ID', example: 'OFFER_ITEM_1' })
  @IsString()
  offerItemId: string;

  @ApiProperty({
    description: 'Passenger reference IDs',
    example: ['PAX1'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  paxRefId: string[];

  @ApiPropertyOptional({
    description: 'Seat selection (for WF_PB_SEAT workflow)',
    type: SeatSelectionDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeatSelectionDto)
  seatSelection?: SeatSelectionDto;

  @ApiPropertyOptional({
    description: 'Booking instructions (for WF_PB_SERVICE workflow)',
    type: BookingInstructionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BookingInstructionsDto)
  bookingInstructions?: BookingInstructionsDto;
}

/**
 * Offer Selection - for OfferPrice/OrderCreate
 */
export class OfferSelectionDto {
  @ApiProperty({ description: 'Response ID from AirShopping', example: 'RS_xxx' })
  @IsString()
  responseId: string;

  @ApiProperty({ description: 'Offer ID', example: 'OFFER_xxx' })
  @IsString()
  offerId: string;

  @ApiProperty({ description: 'Airline owner code', example: 'SQ' })
  @IsString()
  owner: string;

  @ApiProperty({ description: 'Offer items', type: [OfferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfferItemDto)
  offerItems: OfferItemDto[];
}

// ==============================================
// Payment DTOs
// ==============================================

/**
 * Payment Card
 */
export class PaymentCardDto {
  @ApiProperty({ description: 'Card code (VI, MC, AX)', example: 'VI' })
  @IsString()
  cardCode: string;

  @ApiProperty({ description: 'Card number', example: '4111111111111111' })
  @IsString()
  cardNumber: string;

  @ApiProperty({ description: 'Card holder name', example: 'HONG GILDONG' })
  @IsString()
  cardHolderName: string;

  @ApiProperty({ description: 'Expiration (MMYY)', example: '1228' })
  @IsString()
  expiration: string;

  @ApiPropertyOptional({ description: 'CVV/CVC code', example: '123' })
  @IsOptional()
  @IsString()
  seriesCode?: string;
}

/**
 * Cash Payment
 */
export class CashPaymentDto {
  @ApiProperty({ description: 'Cash payment indicator', example: true })
  @IsBoolean()
  cashPaymentInd: boolean;
}

/**
 * Agent Deposit
 */
export class AgentDepositDto {
  @ApiProperty({ description: 'Agent deposit ID', example: 'AG_001' })
  @IsString()
  agentDepositId: string;
}

/**
 * Payment Method
 */
export class PaymentMethodDto {
  @ApiPropertyOptional({ description: 'Cash payment', type: CashPaymentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CashPaymentDto)
  cash?: CashPaymentDto;

  @ApiPropertyOptional({ description: 'Card payment', type: PaymentCardDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentCardDto)
  card?: PaymentCardDto;

  @ApiPropertyOptional({
    description: 'Agent deposit payment',
    type: AgentDepositDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgentDepositDto)
  agentDeposit?: AgentDepositDto;
}

/**
 * Amount
 */
export class AmountDto {
  @ApiProperty({ description: 'Currency code', example: 'KRW' })
  @IsString()
  currencyCode: string;

  @ApiProperty({ description: 'Amount value', example: 500000 })
  @IsNumber()
  amount: number;
}

/**
 * Payment
 */
export class PaymentDto {
  @ApiProperty({ description: 'Payment method', type: PaymentMethodDto })
  @ValidateNested()
  @Type(() => PaymentMethodDto)
  paymentMethod: PaymentMethodDto;

  @ApiProperty({ description: 'Payment amount', type: AmountDto })
  @ValidateNested()
  @Type(() => AmountDto)
  amount: AmountDto;

  @ApiPropertyOptional({
    description: 'Order item IDs for payment allocation',
    example: ['OI_1'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderItemId?: string[];

  @ApiPropertyOptional({
    description: 'Offer item IDs for payment allocation',
    example: ['OFFER_ITEM_1'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  offerItemId?: string[];

  @ApiPropertyOptional({
    description: 'Passenger reference IDs for payment allocation',
    example: ['PAX1'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxRefId?: string[];
}

// ==============================================
// Response DTOs
// ==============================================

/**
 * Error Detail
 */
export class ErrorDetailDto {
  @ApiPropertyOptional({ description: 'Error owner (airline code)', example: 'SQ' })
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({ description: 'Error message', example: 'Invalid request' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Error code', example: '50101' })
  @IsOptional()
  @IsString()
  code?: string;
}

/**
 * Message Detail
 */
export class MessageDetailDto {
  @ApiPropertyOptional({
    description: 'Error list',
    type: [ErrorDetailDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ErrorDetailDto)
  errors?: ErrorDetailDto[];

  @ApiPropertyOptional({
    description: 'Warning list',
    type: [ErrorDetailDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ErrorDetailDto)
  warnings?: ErrorDetailDto[];
}

/**
 * Result Message - Common response result
 */
export class ResultMessageDto {
  @ApiProperty({ description: 'Result code (0 = success)', example: '0' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Result message', example: 'Success' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Message detail', type: MessageDetailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MessageDetailDto)
  messageDetail?: MessageDetailDto;
}

/**
 * Base Response - Base structure for all API responses
 */
export class BaseResponseDto {
  @ApiProperty({ description: 'Transaction ID', example: 'txn_abc123' })
  @IsString()
  transactionId: string;

  @ApiPropertyOptional({ description: 'Result message', type: ResultMessageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResultMessageDto)
  resultMessage?: ResultMessageDto;

  @ApiPropertyOptional({ description: 'Raw response data from PolarHub' })
  @IsOptional()
  @IsObject()
  response?: Record<string, unknown>;
}

// ==============================================
// Pagination DTO
// ==============================================

/**
 * Pagination Request
 */
export class PaginationRequestDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * Pagination Response
 */
export class PaginationResponseDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  @IsNumber()
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  @IsNumber()
  limit: number;

  @ApiProperty({ description: 'Total number of items', example: 100 })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  @IsNumber()
  totalPages: number;
}

// ==============================================
// Criteria DTOs (CriteriaType4 - full)
// ==============================================

/**
 * Airline Preference
 */
export class AirlinePreferenceDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'List of preferred airline IATA codes',
    example: ['SQ', 'AY', 'KL'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  airlineId?: string[];
}

/**
 * Program Criteria (Contract/Corporate fare)
 */
export class ProgramCriteriaDto {
  @ApiProperty({
    description: 'Airline IATA code',
    example: 'SQ',
  })
  @IsString()
  airlineId: string;

  @ApiPropertyOptional({
    description: 'Contract ID',
    example: 'CONTRACT001',
  })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Account IDs',
    example: ['062355'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accountId?: string[];

  @ApiPropertyOptional({
    description: 'Type code',
    example: 'CORPORATE',
  })
  @IsOptional()
  @IsString()
  typeCode?: string;
}

/**
 * Promotion Criteria (Promotional fare)
 */
export class PromotionCriteriaDto {
  @ApiProperty({
    description: 'Airline IATA code',
    example: 'TR',
  })
  @IsString()
  airlineId: string;

  @ApiPropertyOptional({
    description: 'Promotion ID/Code',
    example: 'TSTNDC',
  })
  @IsOptional()
  @IsString()
  promotionId?: string;
}

/**
 * Special Fare Criteria
 */
export class SpecialFareCriteriaDto {
  @ApiPropertyOptional({
    description: 'Airline IATA code',
    example: 'LH',
  })
  @IsOptional()
  @IsString()
  airlineId?: string;

  @ApiPropertyOptional({
    description: 'Account ID',
    example: '032522',
  })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({
    description: 'Special fare type code',
    example: 'STUDENT',
  })
  @IsOptional()
  @IsString()
  typeCode?: string;
}

/**
 * Existing Order Criteria (Reference to existing order)
 */
export class ExistingOrderCriteriaDto {
  @ApiProperty({
    description: 'Existing order ID',
    example: 'ORD123456',
  })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Passenger reference IDs',
    example: ['PAX1', 'PAX2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxRefId?: string[];
}

/**
 * Search Criteria (CriteriaType4 - full)
 *
 * Used across multiple APIs: AirShopping, OfferPrice, OrderReshop, OrderChange, OrderQuote, SeatAvailability
 */
export class CriteriaDto {
  @ApiPropertyOptional({
    description: 'Direct flights only (true = non-stop flights)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  direct?: boolean;

  @ApiPropertyOptional({
    type: AirlinePreferenceDto,
    description: 'Preferred airlines',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AirlinePreferenceDto)
  airlinePreference?: AirlinePreferenceDto;

  @ApiPropertyOptional({
    type: [ProgramCriteriaDto],
    description: 'Program fare criteria (contract/corporate rates)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramCriteriaDto)
  programCriteria?: ProgramCriteriaDto[];

  @ApiPropertyOptional({
    type: [PromotionCriteriaDto],
    description: 'Promotion fare criteria',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionCriteriaDto)
  promotionCriteria?: PromotionCriteriaDto[];

  @ApiPropertyOptional({
    type: [SpecialFareCriteriaDto],
    description: 'Special fare criteria',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialFareCriteriaDto)
  specialFareCriteria?: SpecialFareCriteriaDto[];

  @ApiPropertyOptional({
    type: ExistingOrderCriteriaDto,
    description: 'Reference to existing order',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExistingOrderCriteriaDto)
  existingOrderCriteria?: ExistingOrderCriteriaDto;
}

// ==============================================
// Response Parameter DTOs (ResponseParameterType5)
// ==============================================

/**
 * Language Usage
 */
export class LanguageUsageDto {
  @ApiProperty({
    description: 'Language code (ISO 639-1)',
    example: 'ko',
  })
  @IsString()
  langCode: string;

  @ApiPropertyOptional({
    description: 'Language usage type',
    example: 'Written',
  })
  @IsOptional()
  @IsString()
  langUsageType?: string;
}

/**
 * Response Parameter (response settings)
 *
 * Used across multiple APIs: AirShopping, OfferPrice, OrderReshop, OrderChange, OrderQuote, SeatAvailability
 */
export class ResponseParameterDto {
  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'KRW',
  })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional({
    type: LanguageUsageDto,
    description: 'Language settings',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LanguageUsageDto)
  languageUsage?: LanguageUsageDto;
}

// ==============================================
// FOP Promotion DTO (FopPromotionType)
// ==============================================

/**
 * FOP Promotion (card/payment method promotion)
 *
 * Used in: OfferPrice, OrderChange, OrderQuote
 */
export class FopPromotionDto {
  @ApiProperty({
    description: 'Promotion code',
    example: 'VISA2026',
  })
  @IsString()
  promotionCode: string;

  @ApiPropertyOptional({
    description: 'Payment type (A=Card, C=Cash, K=KakaoPay, S=SamsungPay)',
    example: 'A',
  })
  @IsOptional()
  @IsString()
  paymentType?: string;

  @ApiPropertyOptional({
    description: 'Card code (e.g., VI, MC, AX)',
    example: 'VI',
  })
  @IsOptional()
  @IsString()
  cardCode?: string;

  @ApiPropertyOptional({
    description: 'Card name',
    example: 'VISA',
  })
  @IsOptional()
  @IsString()
  cardName?: string;
}

// ==============================================
// Loyalty Program Account DTO
// ==============================================

/**
 * Loyalty Program Account (FFN / Mileage)
 *
 * Supported by: AF, KL, and other airlines
 */
export class LoyaltyProgramAccountDto {
  @ApiPropertyOptional({ description: 'Account number', example: '123456789' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Program code', example: 'FB' })
  @IsOptional()
  @IsString()
  programCode?: string;

  @ApiPropertyOptional({ description: 'Program name', example: 'FlyingBlue' })
  @IsOptional()
  @IsString()
  programName?: string;

  @ApiPropertyOptional({ description: 'Sign-in ID' })
  @IsOptional()
  @IsString()
  signInId?: string;

  @ApiPropertyOptional({ description: 'Tier code' })
  @IsOptional()
  @IsString()
  tierCode?: string;

  @ApiPropertyOptional({ description: 'Tier name' })
  @IsOptional()
  @IsString()
  tierName?: string;
}

// ==============================================
// Extended Pax DTO (PaxCodeType3)
// ==============================================

/**
 * Extended Pax - PaxID + PTC + optional BirthDate, PaxRefID, LoyaltyProgramAccount
 *
 * Used in: OfferPrice, SeatAvailability, OrderQuote (where more than simple PaxID/PTC is needed)
 */
export class PaxCodeDto {
  @ApiProperty({ description: 'Passenger ID', example: 'PAX1' })
  @IsString()
  paxId: string;

  @ApiProperty({
    description: 'Passenger type code',
    example: 'ADT',
    enum: ['ADT', 'CHD', 'INF'],
  })
  @IsString()
  ptc: string;

  @ApiPropertyOptional({
    description: 'Birth date (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Pax reference ID',
    example: 'PAX_REF_1',
  })
  @IsOptional()
  @IsString()
  paxRefId?: string;

  @ApiPropertyOptional({
    type: [LoyaltyProgramAccountDto],
    description: 'Loyalty program account (FFN)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoyaltyProgramAccountDto)
  loyaltyProgramAccount?: LoyaltyProgramAccountDto[];
}
````

## File 13: air-shopping.dto.ts
**Path**: `src/lib/polarhub/dto/air-shopping.dto.ts`
````typescript
/**
 * AirShopping DTOs
 *
 * Entry point for the PRE-BOOKING flow.
 * TransactionID is generated by FE and passed through.
 *
 * CLAUDE.md principles:
 * - TransactionID: Generated by FE, pass-through
 * - Sender: FE-provided value takes priority, environment variable as Fallback
 * - No hardcoding
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SenderDto,
  FEAuthHeadersDto,
  PassengerCountDto,
  OriginDestDto,
} from './common.dto';

// ==============================================
// Criteria Nested DTOs (OpenAPI CriteriaType4)
// ==============================================

/**
 * Airline Preference
 */
export class AirlinePreferenceDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'List of preferred airline IATA codes',
    example: ['SQ', 'AY', 'KL'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  airlineId?: string[];
}

/**
 * Program Criteria (Contract fare)
 */
export class ProgramCriteriaDto {
  @ApiProperty({
    description: 'Airline IATA code',
    example: 'AY',
  })
  @IsString()
  airlineId: string;

  @ApiPropertyOptional({
    description: 'Contract ID',
    example: 'CONTRACT001',
  })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Account IDs',
    example: ['062355'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accountId?: string[];

  @ApiPropertyOptional({
    description: 'Type code',
    example: 'CORPORATE',
  })
  @IsOptional()
  @IsString()
  typeCode?: string;
}

/**
 * Promotion Criteria (Promotional fare)
 */
export class PromotionCriteriaDto {
  @ApiProperty({
    description: 'Airline IATA code',
    example: 'TR',
  })
  @IsString()
  airlineId: string;

  @ApiPropertyOptional({
    description: 'Promotion ID/Code',
    example: 'TSTNDC',
  })
  @IsOptional()
  @IsString()
  promotionId?: string;
}

/**
 * Special Fare Criteria
 */
export class SpecialFareCriteriaDto {
  @ApiProperty({
    description: 'Airline IATA code',
    example: 'LH',
  })
  @IsString()
  airlineId: string;

  @ApiPropertyOptional({
    description: 'Account ID',
    example: '032522',
  })
  @IsOptional()
  @IsString()
  accountId?: string;
}

/**
 * Existing Order Criteria (Reference to existing order)
 */
export class ExistingOrderCriteriaDto {
  @ApiProperty({
    description: 'Existing order ID',
    example: 'ORD123456',
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    type: [String],
    description: 'Passenger reference IDs',
    example: ['PAX1', 'PAX2'],
  })
  @IsArray()
  @IsString({ each: true })
  paxRefId: string[];
}

/**
 * Search Criteria
 * Based on OpenAPI CriteriaType4
 */
export class CriteriaDto {
  @ApiPropertyOptional({
    description: 'Direct flights only (true = non-stop flights)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  direct?: boolean;

  @ApiPropertyOptional({
    type: AirlinePreferenceDto,
    description: 'Preferred airlines',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AirlinePreferenceDto)
  airlinePreference?: AirlinePreferenceDto;

  @ApiPropertyOptional({
    type: [ProgramCriteriaDto],
    description: 'Program fare criteria',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramCriteriaDto)
  programCriteria?: ProgramCriteriaDto[];

  @ApiPropertyOptional({
    type: [PromotionCriteriaDto],
    description: 'Promotion fare criteria',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionCriteriaDto)
  promotionCriteria?: PromotionCriteriaDto[];

  @ApiPropertyOptional({
    type: [SpecialFareCriteriaDto],
    description: 'Special fare criteria',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialFareCriteriaDto)
  specialFareCriteria?: SpecialFareCriteriaDto[];

  @ApiPropertyOptional({
    type: ExistingOrderCriteriaDto,
    description: 'Reference to existing order',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExistingOrderCriteriaDto)
  existingOrderCriteria?: ExistingOrderCriteriaDto;
}

/**
 * Language Usage
 */
export class LanguageUsageDto {
  @ApiProperty({
    description: 'Language code',
    example: 'ko',
  })
  @IsString()
  langCode: string;

  @ApiPropertyOptional({
    description: 'Language usage type',
    example: 'Written',
  })
  @IsOptional()
  @IsString()
  langUsageType?: string;
}

/**
 * Response Parameter (Response settings)
 */
export class ResponseParameterDto {
  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'KRW',
  })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional({
    type: LanguageUsageDto,
    description: 'Language settings',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LanguageUsageDto)
  languageUsage?: LanguageUsageDto;
}

// ==============================================
// Main Request DTO
// ==============================================

/**
 * AirShopping Request DTO
 *
 * Entry point for the PRE-BOOKING flow.
 *
 * Usage examples:
 * - Round-trip: 2 segments in originDestList (ICN->SIN, SIN->ICN)
 * - One-way: 1 segment in originDestList
 * - Multi-city: N segments in originDestList
 */
export class AirShoppingRequestDto {
  @ApiProperty({
    description:
      'Transaction ID (32-char hex, generated by FE). Same ID must be used for OfferPrice and OrderCreate.',
    example: '4ba5a0b50d2c45b3b5eb343b57ba8897',
  })
  @IsString()
  @Matches(/^[a-f0-9]{32}$/i, {
    message: 'TransactionID must be 32-character hex string',
  })
  transactionId: string;

  @ApiPropertyOptional({
    description: 'Sender information (uses environment variables if not provided)',
    type: SenderDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SenderDto)
  sender?: SenderDto;

  @ApiPropertyOptional({
    description: 'FE HMAC authentication headers (generated from environment variables if not provided)',
    type: FEAuthHeadersDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FEAuthHeadersDto)
  feAuthHeaders?: FEAuthHeadersDto;

  @ApiPropertyOptional({
    description: 'Point of Sale country code',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  pointOfSale?: string;

  @ApiProperty({
    description: 'Origin-Destination list (1 for one-way, 2 for round-trip, N for multi-city)',
    type: [OriginDestDto],
    example: [
      { origin: 'ICN', destination: 'SIN', departureDate: '2026-03-15' },
      { origin: 'SIN', destination: 'ICN', departureDate: '2026-03-22' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OriginDestDto)
  originDestList: OriginDestDto[];

  @ApiProperty({
    description: 'Passenger counts by type (max 9 passengers total)',
    type: [PassengerCountDto],
    example: [
      { type: 'ADT', count: 2 },
      { type: 'CHD', count: 1 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PassengerCountDto)
  passengers: PassengerCountDto[];

  @ApiPropertyOptional({
    description: 'Cabin class (Y: Economy, W: Premium Economy, C: Business, F: First)',
    example: 'Y',
    enum: ['Y', 'W', 'C', 'F'],
  })
  @IsOptional()
  @IsString()
  cabin?: string;

  @ApiPropertyOptional({
    type: CriteriaDto,
    description: 'Search criteria (airline preference, direct flights, fare programs)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriteriaDto)
  criteria?: CriteriaDto;

  @ApiPropertyOptional({
    type: ResponseParameterDto,
    description: 'Response settings (currency, language)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResponseParameterDto)
  responseParameter?: ResponseParameterDto;

  // =============================================
  // Legacy fields (deprecated - use criteria instead)
  // =============================================

  @ApiPropertyOptional({
    description: '[DEPRECATED] Use criteria.airlinePreference.airlineId instead',
    example: ['SQ', 'OZ'],
    type: [String],
    deprecated: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  airlinePreference?: string[];

  @ApiPropertyOptional({
    description: '[DEPRECATED] Use criteria.direct instead',
    example: false,
    deprecated: true,
  })
  @IsOptional()
  @IsBoolean()
  directOnly?: boolean;
}

// ==============================================
// Response DTO (Raw PolarHub Response)
// ==============================================

/**
 * AirShopping Response DTO
 *
 * Returns the raw PolarHub API response as-is.
 * The middleware does not perform any data transformation.
 *
 * Key fields:
 * - ResultMessage: Result code/message
 * - TransactionID: Transaction ID passed in the request
 * - Offer: List of flight offers
 * - DataLists: Detailed flight information (segments, fares, etc.)
 */
export class AirShoppingResponseDto {
  @ApiProperty({
    description: 'Result message containing status code',
    example: { Code: '0', Message: 'Success' },
  })
  ResultMessage?: {
    Code: string;
    Message?: string;
    MessageDetail?: unknown;
  };

  @ApiPropertyOptional({
    description: 'Recipient (echoed sender information)',
  })
  Recipient?: unknown;

  @ApiPropertyOptional({
    description: 'Point of sale',
    example: 'KR',
  })
  PointOfSale?: string;

  @ApiProperty({
    description: 'Transaction ID (echoed from request)',
    example: '4ba5a0b50d2c45b3b5eb343b57ba8897',
  })
  TransactionID?: string;

  @ApiPropertyOptional({
    description: 'List of flight offers',
    type: 'array',
  })
  Offer?: unknown[];

  @ApiPropertyOptional({
    description: 'Data lists containing detailed information (segments, fares, etc.)',
  })
  DataLists?: unknown;

  @ApiPropertyOptional({
    description: 'Augmentation point for extended data',
  })
  AugmentationPoint?: unknown;
}
````

## File 14: offer-price.dto.ts
**Path**: `src/lib/polarhub/dto/offer-price.dto.ts`
````typescript
/**
 * OfferPrice DTOs
 *
 * Request/Response DTOs for the price detail inquiry API.
 *
 * OpenAPI Spec: spec/polarhub.openapi.json - OfferPriceRQ15, OfferPriceRS16
 *
 * CRITICAL:
 * - transactionId must be provided by FE (same value as AirShopping)
 * - sender: FE-provided value takes priority, environment variable as Fallback
 * - Supports offers array (multiple offers needed when MatchResult=PARTIAL)
 *
 * Workflow Support:
 * - WF_PB_DEFERRED/IMMEDIATE: Basic (offerItemId, paxRefId only)
 * - WF_PB_SEAT: With seatSelection
 * - WF_PB_SERVICE: With bookingInstructions
 * - WF_PB_SEAT_SERVICE: With both
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SenderDto,
  FEAuthHeadersDto,
  PaxCodeDto,
  OfferSelectionDto,
  CriteriaDto,
  ResponseParameterDto,
  FopPromotionDto,
} from './common.dto';

/**
 * OfferPrice Request DTO
 *
 * OpenAPI: OfferPriceRQ15
 * Required fields: Sender, PointOfSale, TransactionID, Query.Offers, Query.PaxList
 */
export class OfferPriceRequestDto {
  @ApiProperty({
    description:
      'Transaction ID (generated by FE, must use the same value as AirShopping)',
    example: 'd84d2a2430334fd0869f9e599f18b154',
  })
  @IsString()
  transactionId: string;

  @ApiProperty({
    description:
      'Selected offers - supports multiple offers (multiple offer selection needed when MatchResult=PARTIAL)',
    type: [OfferSelectionDto],
    example: [
      {
        responseId: 'd84d2a2430334fd0869f9e599f18b154',
        offerId: 'd84d2a2430334fd0869f9e599f18b15421.3SQ-10',
        owner: 'SQ',
        offerItems: [
          {
            offerItemId: 'd84d2a2430334fd0869f9e599f18b15421.3SQ-10-1',
            paxRefId: ['SQ_PAX1', 'SQ_PAX2'],
          },
        ],
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OfferSelectionDto)
  offers: OfferSelectionDto[];

  @ApiProperty({
    description: 'Passenger list (keep the same as AirShopping request). Supports birthDate and loyaltyProgramAccount.',
    type: [PaxCodeDto],
    example: [
      { paxId: 'SQ_PAX1', ptc: 'ADT' },
      { paxId: 'SQ_PAX2', ptc: 'CHD' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaxCodeDto)
  paxList: PaxCodeDto[];

  @ApiPropertyOptional({
    description: 'Sender information (Optional - uses environment variables if not provided)',
    type: SenderDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SenderDto)
  sender?: SenderDto;

  @ApiPropertyOptional({
    description: 'FE HMAC authentication headers (Optional - generated from environment variables if not provided)',
    type: FEAuthHeadersDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FEAuthHeadersDto)
  feAuthHeaders?: FEAuthHeadersDto;

  @ApiPropertyOptional({
    description: 'Point of Sale country code (default: KR)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  pointOfSale?: string;

  @ApiPropertyOptional({
    description:
      'Workflow type - price inquiry type (select based on whether seat/service is included)',
    example: 'WF_PB_DEFERRED',
    enum: [
      'WF_PB_DEFERRED',
      'WF_PB_IMMEDIATE',
      'WF_PB_SEAT',
      'WF_PB_SERVICE',
      'WF_PB_SEAT_SERVICE',
    ],
  })
  @IsOptional()
  @IsString()
  workflow?: string;

  @ApiPropertyOptional({
    type: CriteriaDto,
    description: 'Search criteria (contract fare, promotion, special fare, existing order reference)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriteriaDto)
  criteria?: CriteriaDto;

  @ApiPropertyOptional({
    type: ResponseParameterDto,
    description: 'Response settings (currency, language)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResponseParameterDto)
  responseParameter?: ResponseParameterDto;

  @ApiPropertyOptional({
    type: [FopPromotionDto],
    description: 'FOP promotion list (card/payment method promotion)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FopPromotionDto)
  fopPromotion?: FopPromotionDto[];
}

/**
 * OfferPrice Response DTO
 *
 * OpenAPI: OfferPriceRS16
 * - Returns PolarHub response as-is (no transformation)
 * - Returns with transactionId appended
 *
 * CRITICAL: Response data must be returned as the original PolarHub response!
 */
export class OfferPriceResponseDto {
  @ApiProperty({
    description: 'Transaction ID (same value as the request)',
    example: 'd84d2a2430334fd0869f9e599f18b154',
  })
  transactionId: string;

  @ApiPropertyOptional({
    description: 'Result message (code 0 = success)',
    example: { Code: '0', Message: 'Success' },
  })
  ResultMessage?: {
    Code: string;
    Message?: string;
    MessageDetail?: {
      Errors?: Array<{
        Owner?: string;
        Message?: string;
        Code?: string;
      }>;
      Warnings?: Array<{
        Owner?: string;
        Message?: string;
        Code?: string;
      }>;
    };
  };

  @ApiPropertyOptional({
    description: 'Recipient travel agency information',
  })
  Recipient?: {
    TravelAgency: {
      AgencyID: string;
      SiteCode?: string;
    };
  };

  @ApiPropertyOptional({
    description: 'Point of sale',
    example: 'KR',
  })
  PointOfSale?: string;

  @ApiPropertyOptional({
    description: 'Transaction ID from PolarHub',
    example: 'd84d2a2430334fd0869f9e599f18b154',
  })
  TransactionID?: string;

  @ApiPropertyOptional({
    description: 'Priced offer with detailed pricing information',
    example: [
      {
        ResponseID: 'd84d2a2430334fd0869f9e599f18b154',
        OfferID: 'd84d2a2430334fd0869f9e599f18b15421.3SQ-10',
        Owner: 'SQ',
        TotalPrice: {
          TotalAmount: { Amount: 1452800, CurCode: 'KRW' },
          TotalBaseAmount: { Amount: 698600, CurCode: 'KRW' },
          TotalTaxAmount: { Amount: 749200, CurCode: 'KRW' },
        },
      },
    ],
  })
  PricedOffer?: unknown[];

  @ApiPropertyOptional({
    description: 'Data lists (PaxList, SegmentList, etc.)',
  })
  DataLists?: unknown;

  @ApiPropertyOptional({
    description: 'Augmentation point for additional airline-specific data',
  })
  AugmentationPoint?: unknown;

  // Index signature for other fields from the original PolarHub response
  [key: string]: unknown;
}
````

## File 15: order-create.dto.ts
**Path**: `src/lib/polarhub/dto/order-create.dto.ts`
````typescript
/**
 * OrderCreate API DTO
 *
 * Based on OpenAPI spec (spec/polarhub.openapi.json) OrderCreateRQ/OrderViewRS.
 *
 * CRITICAL:
 * - transactionId must be provided by FE (middleware generation forbidden!)
 * - ContactInfo: Pass through as-is from FE (no country code + phone number concatenation)
 * - No hardcoding (CitizenshipCountryCode, etc.)
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

// ==============================================
// Sender DTOs
// ==============================================

export class TravelAgencyDto {
  @ApiProperty({ description: 'Agency ID (Tenant ID)', example: 'YOUR_TENANT_ID' })
  @IsString()
  agencyId: string;

  @ApiPropertyOptional({ description: 'Site Code', example: '01' })
  @IsOptional()
  @IsString()
  siteCode?: string;

  @ApiPropertyOptional({
    description: 'Agency Name',
    example: 'PolarHub MCP',
  })
  @IsOptional()
  @IsString()
  agencyName?: string;

  @ApiPropertyOptional({
    description: 'Contact Info Reference IDs',
    example: ['CTC_TA1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactInfoRefId?: string[];
}

export class SenderDto {
  @ApiProperty({ description: 'Travel Agency Information' })
  @ValidateNested()
  @Type(() => TravelAgencyDto)
  travelAgency: TravelAgencyDto;
}

// ==============================================
// Order (Offer Selection) DTOs
// ==============================================

export class SeatSelectionDto {
  @ApiProperty({ description: 'Seat Column', example: 'A' })
  @IsString()
  column: string;

  @ApiProperty({ description: 'Seat Row', example: '10' })
  @IsString()
  row: string;
}

export class BookingInstructionsDto {
  @ApiPropertyOptional({
    description: 'Additional text instructions',
    example: ['TTL10KG'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  text?: string[];

  @ApiPropertyOptional({
    description: 'OSI text',
    example: ['PAX VIP'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ositext?: string[];
}

export class OfferItemDto {
  @ApiProperty({
    description: 'Offer Item ID from OfferPrice response',
    example: 'f6a081ce34244a819148f2723aa057cc21.3-1-1',
  })
  @IsString()
  offerItemId: string;

  @ApiProperty({
    description: 'Passenger Reference IDs',
    example: ['PAX1'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  paxRefId: string[];

  @ApiPropertyOptional({ description: 'Seat Selection (Prime Booking)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeatSelectionDto)
  seatSelection?: SeatSelectionDto;

  @ApiPropertyOptional({ description: 'Booking Instructions (Service)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BookingInstructionsDto)
  bookingInstructions?: BookingInstructionsDto;
}

export class OrderDto {
  @ApiProperty({
    description: 'Response ID (same as TransactionID)',
    example: 'e51abdade28a4792b5af124e09bd5005',
  })
  @IsString()
  responseId: string;

  @ApiProperty({
    description: 'Offer ID from OfferPrice response',
    example: 'f6a081ce34244a819148f2723aa057cc21.3-1',
  })
  @IsString()
  offerId: string;

  @ApiProperty({
    description: 'Airline code (Owner)',
    example: 'SQ',
  })
  @IsString()
  owner: string;

  @ApiProperty({
    description: 'List of offer items',
    type: [OfferItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfferItemDto)
  offerItems: OfferItemDto[];
}

// ==============================================
// Passenger (Pax) DTOs
// ==============================================

export class IndividualDto {
  @ApiPropertyOptional({
    description: 'Name Title (MR/MRS/MS)',
    example: 'MR',
  })
  @IsOptional()
  @IsString()
  nameTitle?: string;

  @ApiProperty({
    description: 'Given Names (First name + Middle names)',
    example: ['SUNGJI'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  givenName: string[];

  @ApiProperty({
    description: 'Surname (Last name)',
    example: 'KIM',
  })
  @IsString()
  surname: string;

  @ApiProperty({
    description: 'Birthdate (YYYY-MM-DD)',
    example: '1987-02-09',
  })
  @IsString()
  birthdate: string;

  @ApiPropertyOptional({
    description: 'Gender (MALE/FEMALE/UNSPECIFIED)',
    example: 'MALE',
  })
  @IsOptional()
  @IsString()
  gender?: string;
}

export class IdentityDocDto {
  @ApiProperty({
    description: 'Identity Document Type (PT=Passport)',
    example: 'PT',
  })
  @IsString()
  identityDocType: string;

  @ApiProperty({
    description: 'Identity Document Number',
    example: 'M11681171',
  })
  @IsString()
  identityDocId: string;

  @ApiPropertyOptional({
    description: 'Document Expiry Date (YYYY-MM-DD)',
    example: '2030-06-30',
  })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Issuing Country Code (ISO)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  issuingCountryCode?: string;

  @ApiPropertyOptional({
    description: 'Citizenship Country Code (ISO)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  citizenshipCountryCode?: string;
}

export class LoyaltyProgramAccountDto {
  @ApiProperty({
    description: 'FFN Account Number',
    example: '674074844',
  })
  @IsString()
  accountNumber: string;

  @ApiProperty({
    description: 'Program Code (Airline Code)',
    example: 'AY',
  })
  @IsString()
  programCode: string;
}

export class PaxDto {
  @ApiProperty({
    description: 'Passenger ID',
    example: 'PAX1',
  })
  @IsString()
  paxId: string;

  @ApiProperty({
    description: 'Passenger Type Code (ADT/CHD/INF)',
    example: 'ADT',
  })
  @IsString()
  ptc: string;

  @ApiProperty({ description: 'Individual (Biographical) Information' })
  @ValidateNested()
  @Type(() => IndividualDto)
  individual: IndividualDto;

  @ApiPropertyOptional({
    description: 'Identity Documents (Passport, etc.)',
    type: [IdentityDocDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdentityDocDto)
  identityDoc?: IdentityDocDto[];

  @ApiPropertyOptional({
    description: 'Contact Info Reference IDs',
    example: ['CI2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactInfoRefId?: string[];

  @ApiPropertyOptional({
    description: 'Citizenship Country Code (required if no identityDoc)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  citizenshipCountryCode?: string;

  @ApiPropertyOptional({
    description: 'Residence Country Code (required if no identityDoc)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  residenceCountryCode?: string;

  @ApiPropertyOptional({
    description: 'Loyalty Program Account (FFN) - AF/KL supported',
    type: [LoyaltyProgramAccountDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoyaltyProgramAccountDto)
  loyaltyProgramAccount?: LoyaltyProgramAccountDto[];
}

// ==============================================
// ContactInfo DTOs
// ==============================================

export class PhoneDto {
  @ApiProperty({
    description: 'Phone Number',
    example: '1046900081',
  })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Country Dialing Code',
    example: '82',
  })
  @IsOptional()
  @IsString()
  countryDialingCode?: string;

  @ApiPropertyOptional({
    description: 'Phone Label (Mobile/Home/etc.)',
    example: 'Mobile',
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({
    description: 'Area Code',
    example: '2',
  })
  @IsOptional()
  @IsString()
  areaCode?: string;
}

export class PostalAddressDto {
  @ApiPropertyOptional({
    description: 'Street Address Lines (max 2)',
    example: ['8F 9F, 78, Namdaemun-ro, Jung-gu'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  street?: string[];

  @ApiPropertyOptional({
    description: 'City Name',
    example: 'Seoul',
  })
  @IsOptional()
  @IsString()
  cityName?: string;

  @ApiPropertyOptional({
    description: 'Postal Code',
    example: '04534',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Country Code (ISO)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  countryCode?: string;
}

export class ContactInfoDto {
  @ApiProperty({
    description: 'Contact Info ID',
    example: 'CI2',
  })
  @IsString()
  contactInfoId: string;

  @ApiPropertyOptional({
    description: 'Email Address',
    example: 'passenger@example.com',
  })
  @IsOptional()
  @IsString()
  emailAddress?: string;

  @ApiPropertyOptional({ description: 'Phone Information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PhoneDto)
  phone?: PhoneDto;

  @ApiPropertyOptional({
    description: 'Postal Address (Required for BA US routes)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PostalAddressDto)
  postalAddress?: PostalAddressDto;

  @ApiPropertyOptional({
    description: 'Contact Refused Indicator',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  contactRefusedInd?: boolean;
}

// ==============================================
// Payment DTOs
// ==============================================

export class PaymentCardMethodDto {
  @ApiProperty({
    description: 'Card Code (VISA/MC/AMEX)',
    example: 'VISA',
  })
  @IsString()
  cardCode: string;

  @ApiProperty({
    description: 'Card Number',
    example: '4111111111111111',
  })
  @IsString()
  cardNumber: string;

  @ApiProperty({
    description: 'Card Holder Name',
    example: 'KIM SUNGJI',
  })
  @IsString()
  cardHolderName: string;

  @ApiProperty({
    description: 'Expiration Date (YYYY-MM)',
    example: '2028-12',
  })
  @IsString()
  expiration: string;

  @ApiPropertyOptional({
    description: 'Series Code (CVV)',
    example: '123',
  })
  @IsOptional()
  @IsString()
  seriesCode?: string;
}

export class PaymentMethodDto {
  @ApiPropertyOptional({
    description: 'Cash Payment',
  })
  @IsOptional()
  cash?: { cashPaymentInd: boolean };

  @ApiPropertyOptional({
    description: 'Card Payment Details',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentCardMethodDto)
  card?: PaymentCardMethodDto;

  @ApiPropertyOptional({
    description: 'Agent Deposit (TR only)',
  })
  @IsOptional()
  agentDeposit?: { agentDepositId: string };
}

export class PaymentAmountDto {
  @ApiProperty({
    description: 'Currency Code (ISO 4217)',
    example: 'KRW',
  })
  @IsString()
  currencyCode: string;

  @ApiProperty({
    description: 'Payment Amount',
    example: 588000,
  })
  @IsNumber()
  amount: number;
}

export class PaymentDto {
  @ApiProperty({ description: 'Payment Method' })
  @ValidateNested()
  @Type(() => PaymentMethodDto)
  paymentMethod: PaymentMethodDto;

  @ApiProperty({ description: 'Payment Amount' })
  @ValidateNested()
  @Type(() => PaymentAmountDto)
  amount: PaymentAmountDto;

  @ApiPropertyOptional({
    description: 'Order Item IDs for payment allocation',
    example: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderItemId?: string[];

  @ApiPropertyOptional({
    description: 'Offer Item IDs for payment allocation',
    example: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  offerItemId?: string[];

  @ApiPropertyOptional({
    description: 'Passenger Reference IDs for payment allocation',
    example: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxRefId?: string[];
}

// ==============================================
// Request DTO
// ==============================================

export class OrderCreateRQDto {
  @ApiProperty({
    description:
      'Transaction ID (32-digit UUID without hyphens, must be same as OfferPrice)',
    example: 'e51abdade28a4792b5af124e09bd5005',
  })
  @IsString()
  transactionId: string;

  @ApiPropertyOptional({
    description: 'Sender (Travel Agency) - Optional, defaults to env config',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SenderDto)
  sender?: SenderDto;

  @ApiPropertyOptional({
    description: 'Point of Sale Country Code',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  pointOfSale?: string;

  @ApiProperty({
    description: 'Selected Offers from OfferPrice',
    type: [OrderDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderDto)
  @ArrayMinSize(1)
  orders: OrderDto[];

  @ApiProperty({
    description: 'Passenger List',
    type: [PaxDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaxDto)
  @ArrayMinSize(1)
  paxList: PaxDto[];

  @ApiProperty({
    description:
      'Contact Information List (Travel Agency + Passengers). Travel Agency contact (CTC_TA1) is required for BA/AF/KL.',
    type: [ContactInfoDto],
    example: [
      {
        contactInfoId: 'CTC_TA1',
        emailAddress: 'agency@example.com',
        phone: {
          countryDialingCode: '82',
          phoneNumber: '234486101',
        },
        postalAddress: {
          street: ['8F, 78 Namdaemun-ro'],
          postalCode: '04534',
          countryCode: 'KR',
          cityName: 'Seoul',
        },
      },
      {
        contactInfoId: 'CI2',
        emailAddress: 'passenger@example.com',
        phone: {
          label: 'Mobile',
          countryDialingCode: '82',
          phoneNumber: '1046900081',
        },
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactInfoDto)
  contactInfoList: ContactInfoDto[];

  @ApiPropertyOptional({
    description:
      'Payment List (Required for Instant Ticketing, Optional for Deferred Ticketing)',
    type: [PaymentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  paymentList?: PaymentDto[];
}

// ==============================================
// Response DTO
// ==============================================

export class ResultMessageDetailErrorDto {
  @ApiPropertyOptional({ description: 'Error Owner (Airline Code)' })
  owner?: string;

  @ApiPropertyOptional({ description: 'Error Message' })
  message?: string;

  @ApiPropertyOptional({ description: 'Error Code' })
  code?: string;
}

export class ResultMessageDetailDto {
  @ApiPropertyOptional({
    description: 'List of errors',
    type: [ResultMessageDetailErrorDto],
  })
  errors?: ResultMessageDetailErrorDto[];

  @ApiPropertyOptional({
    description: 'List of warnings',
    type: [ResultMessageDetailErrorDto],
  })
  warnings?: ResultMessageDetailErrorDto[];
}

export class ResultMessageDto {
  @ApiProperty({
    description: 'Result Code (0=success)',
    example: '0',
  })
  code: string;

  @ApiPropertyOptional({
    description: 'Result Message',
    example: 'Success',
  })
  message?: string;

  @ApiPropertyOptional({ description: 'Message Details' })
  messageDetail?: ResultMessageDetailDto;
}

export class OrderCreateRSDto {
  @ApiProperty({
    description: 'Transaction ID',
    example: 'e51abdade28a4792b5af124e09bd5005',
  })
  transactionId: string;

  @ApiPropertyOptional({ description: 'API Result Message' })
  resultMessage?: ResultMessageDto;

  @ApiPropertyOptional({
    description: 'Created Order ID',
    example: 'PoO671A9C8E-9B8A-4E85-8D73-SQ',
  })
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Order Status (OK=Confirmed, X=Cancelled)',
    example: 'OK',
  })
  orderStatus?: string;

  @ApiPropertyOptional({
    description: 'Raw PolarHub Response (for debugging)',
  })
  rawResponse?: unknown;
}
````

## File 16: order-retrieve.dto.ts
**Path**: `src/lib/polarhub/dto/order-retrieve.dto.ts`
````typescript
/**
 * OrderRetrieve DTO
 *
 * The OrderRetrieve API is the starting point for all Post-Booking workflows.
 *
 * CRITICAL:
 * - transactionId must be generated and provided by FE (middleware must not generate it!)
 * - The same transactionId is reused within a Post-Booking session
 *
 * OpenAPI Reference: OrderRetrieveRQ23, OrderRetrieveRS
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==============================================
// Common/Shared DTOs
// ==============================================

/**
 * Travel Agency information
 * Uses environment variable values as fallback if not provided by FE
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

// ==============================================
// Request DTO
// ==============================================

/**
 * OrderRetrieve Request DTO
 *
 * POST-BOOKING flow: OrderRetrieve is the starting point
 * TransactionID is provided by FE (pass-through principle)
 *
 * Per OpenAPI spec (OrderRetrieveRQ23):
 * - Sender: required
 * - PointOfSale: required
 * - TransactionID: required
 * - Query.OrderID: required
 */
export class OrderRetrieveRQDto {
  @ApiProperty({
    description:
      'Transaction ID for post-booking session (32-char hex, generated by FE)',
    example: '4ba5a0b50d2c45b3b5eb343b57ba8897',
  })
  @IsString()
  @Matches(/^[0-9a-f]{32}$/i, {
    message: 'transactionId must be a 32-character hexadecimal string',
  })
  transactionId: string;

  @ApiProperty({
    description: 'Order ID to retrieve (returned from OrderCreate response)',
    example: 'TSDEV-20240315-6f464b4b8d80f67f',
  })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    type: SenderDto,
    description: 'Sender information (optional - uses env if not provided)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SenderDto)
  sender?: SenderDto;

  @ApiPropertyOptional({
    description: 'Point of sale (default: KR)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  pointOfSale?: string;
}

// ==============================================
// Response DTOs
// ==============================================

/**
 * ResultMessage - Response result information
 */
export class ResultMessageDto {
  @ApiProperty({
    description: 'Result code (0 = success)',
    example: '0',
  })
  code: string;

  @ApiPropertyOptional({
    description: 'Result message',
    example: 'Success',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Detailed error/warning information',
  })
  messageDetail?: {
    errors?: Array<{
      owner?: string;
      message?: string;
      code?: string;
      status?: string;
      shortText?: string;
      type?: string;
    }>;
    warnings?: Array<{
      owner?: string;
      message?: string;
      code?: string;
    }>;
  };
}

/**
 * Recipient - Response recipient information (TravelAgency)
 */
export class RecipientDto {
  @ApiProperty({ type: TravelAgencyDto })
  travelAgency: TravelAgencyDto;
}

/**
 * BookingRef - PNR information
 */
export class BookingRefDto {
  @ApiProperty({
    description: 'Airline code',
    example: 'SQ',
  })
  airlineId: string;

  @ApiProperty({
    description: 'PNR (Booking reference)',
    example: 'ABC123',
  })
  id: string;
}

/**
 * Amount - Monetary amount information
 */
export class AmountDto {
  @ApiProperty({
    description: 'Amount value',
    example: 1500000,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'KRW',
  })
  currencyCode: string;
}

/**
 * Price - Price information
 */
export class PriceDto {
  @ApiProperty({ type: AmountDto })
  totalAmount: AmountDto;
}

/**
 * OrderItem - Order item
 */
export class OrderItemDto {
  @ApiProperty({
    description: 'Order Item ID',
    example: 'OI1',
  })
  orderItemId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Flight references',
  })
  flightRef?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Passenger references',
  })
  paxRefId?: string[];

  @ApiPropertyOptional({ type: PriceDto })
  price?: PriceDto;
}

/**
 * Individual - Passenger personal information
 */
export class IndividualDto {
  @ApiPropertyOptional({
    description: 'Name title',
    example: 'MR',
  })
  nameTitle?: string;

  @ApiProperty({
    type: [String],
    description: 'Given name(s)',
    example: ['GILDONG'],
  })
  givenName: string[];

  @ApiProperty({
    description: 'Surname',
    example: 'HONG',
  })
  surname: string;
}

/**
 * Pax - Passenger information (for response)
 */
export class PaxDto {
  @ApiProperty({
    description: 'Passenger ID',
    example: 'PAX1',
  })
  paxId: string;

  @ApiProperty({
    description: 'Passenger type code',
    example: 'ADT',
  })
  ptc: string;

  @ApiProperty({ type: IndividualDto })
  individual: IndividualDto;
}

/**
 * CouponInfo - Ticket coupon information
 */
export class CouponInfoDto {
  @ApiProperty({
    description: 'Coupon number',
    example: '1',
  })
  couponNumber: string;

  @ApiProperty({
    description: 'Coupon status',
    example: 'OPEN',
  })
  couponStatus: string;
}

/**
 * TicketDocInfo - Ticket document information (only after ticketing)
 */
export class TicketDocInfoDto {
  @ApiProperty({
    description: 'Ticket document number',
    example: '6181234567890',
  })
  ticketDocNbr: string;

  @ApiProperty({
    description: 'Document type',
    example: 'ETKT',
  })
  type: string;

  @ApiPropertyOptional({
    type: [CouponInfoDto],
    description: 'Coupon information',
  })
  couponInfo?: CouponInfoDto[];
}

/**
 * Order - Order information
 */
export class OrderDto {
  @ApiProperty({
    description: 'Order ID',
    example: 'TSDEV-20240315-6f464b4b8d80f67f',
  })
  orderId: string;

  @ApiProperty({
    description: 'Airline owner',
    example: 'SQ',
  })
  owner: string;

  @ApiProperty({
    description: 'Order status',
    enum: ['HELD', 'TICKETED', 'CANCELLED'],
    example: 'HELD',
  })
  orderStatus: 'HELD' | 'TICKETED' | 'CANCELLED';

  @ApiPropertyOptional({
    type: [BookingRefDto],
    description: 'Booking references (PNR)',
  })
  bookingRef?: BookingRefDto[];

  @ApiPropertyOptional({
    type: [OrderItemDto],
    description: 'Order items',
  })
  orderItem?: OrderItemDto[];

  @ApiPropertyOptional({
    type: [PaxDto],
    description: 'Passenger list',
  })
  paxList?: PaxDto[];

  @ApiPropertyOptional({
    type: [TicketDocInfoDto],
    description: 'Ticket document info (only when ticketed)',
  })
  ticketDocInfo?: TicketDocInfoDto[];
}

/**
 * OrderChangeNotice - Involuntary change notification (OCN)
 */
export class OrderChangeNoticeDto {
  @ApiProperty({
    description: 'Change type',
    example: 'SCHEDULE_CHANGE',
  })
  changeType: string;

  @ApiPropertyOptional({
    description: 'Original flight information',
  })
  originalFlight?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Alternative flight information',
  })
  alternativeFlight?: Record<string, unknown>;
}

/**
 * OrderRetrieve Response DTO
 *
 * Per OpenAPI spec: Returns full order details including
 * - Order status (HELD, TICKETED, CANCELLED)
 * - Booking references (PNR)
 * - Order items
 * - Passenger list
 * - Ticket info (if ticketed)
 * - OCN (if involuntary change)
 */
export class OrderRetrieveRSDto {
  @ApiProperty({ type: ResultMessageDto })
  resultMessage: ResultMessageDto;

  @ApiProperty({ type: RecipientDto })
  recipient: RecipientDto;

  @ApiProperty({
    description: 'Point of sale',
    example: 'KR',
  })
  pointOfSale: string;

  @ApiProperty({
    description: 'Transaction ID',
    example: '4ba5a0b50d2c45b3b5eb343b57ba8897',
  })
  transactionId: string;

  @ApiPropertyOptional({ type: OrderDto })
  order?: OrderDto;

  @ApiPropertyOptional({
    description: 'Data lists (flights, segments, etc.)',
  })
  dataLists?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: OrderChangeNoticeDto,
    description: 'Order change notice for involuntary changes',
  })
  orderChangeNotice?: OrderChangeNoticeDto;

  @ApiPropertyOptional({
    description: 'Augmentation point for additional data',
  })
  augmentationPoint?: {
    any?: Array<Record<string, unknown>>;
  };
}
````

## File 17: order-cancel.dto.ts
**Path**: `src/lib/polarhub/dto/order-cancel.dto.ts`
````typescript
/**
 * OrderCancel DTO
 *
 * OrderCancel API is used for booking cancellation and refunds.
 *
 * Supported workflows:
 * - WF_HELD_CANCEL: Cancel held booking (OrderRetrieve -> OrderCancel)
 * - WF_TKT_REFUND: Refund after ticketing (OrderRetrieve -> OrderReshop -> OrderCancel)
 *
 * CRITICAL:
 * - transactionId must be generated and provided by FE (middleware generation forbidden!)
 * - Reuse the same transactionId within a Post-Booking session
 * - refundQuoteId is required for refunds (obtained from OrderReshop response)
 *
 * OpenAPI Reference: OrderCancelRQ27, OrderCancelRS28
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==============================================
// Common/Shared DTOs (reusable)
// ==============================================

/**
 * Travel Agency information
 * Uses environment variable values as fallback if not provided by FE
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

// ==============================================
// Request DTO
// ==============================================

/**
 * OrderCancel Request DTO
 *
 * HTTP Method: POST (per PolarHub API spec)
 * TransactionID is provided by FE (pass-through principle)
 *
 * Per OpenAPI spec (OrderCancelRQ27):
 * - Sender: required
 * - PointOfSale: required
 * - TransactionID: required
 * - Query.OrderID: required
 *
 * Usage:
 * 1. HELD cancellation: only orderId needed
 * 2. TICKETED refund: orderId + refundQuoteId (from OrderReshop)
 */
export class OrderCancelRQDto {
  @ApiProperty({
    description:
      'Transaction ID (32-char hex, generated by FE, same as OrderRetrieve)',
    example: '8d6ec82e0d3546eaacc49be57b71cef5',
  })
  @IsString()
  @Matches(/^[0-9a-f]{32}$/i, {
    message: 'transactionId must be a 32-character hexadecimal string',
  })
  transactionId: string;

  @ApiProperty({
    description: 'Order ID to cancel',
    example: 'TSDEV-20240315-6f464b4b8d80f67f',
  })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    description:
      'Refund Quote ID (required for TICKETED refund, obtained from OrderReshop)',
    example: 'RQ_123456',
  })
  @IsOptional()
  @IsString()
  refundQuoteId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Specific Order Item IDs to cancel (partial cancel)',
    example: ['ITEM1', 'ITEM2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderItemRefId?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Specific Passenger IDs to cancel (pax cancel)',
    example: ['PAX1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxRefId?: string[];

  @ApiPropertyOptional({
    type: SenderDto,
    description: 'Sender information (optional - uses env if not provided)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SenderDto)
  sender?: SenderDto;

  @ApiPropertyOptional({
    description: 'Point of sale (default: KR)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  pointOfSale?: string;
}

// ==============================================
// Response DTOs
// ==============================================

/**
 * ResultMessage - Response result information
 *
 * Per OpenAPI spec (ResultMessageType6):
 * - Code: required
 * - Message: required
 * - MessageDetail: optional (errors/warnings)
 */
export class ResultMessageDto {
  @ApiProperty({
    description: 'Result code (0 = success)',
    example: '0',
  })
  code: string;

  @ApiProperty({
    description: 'Result message',
    example: 'Order cancelled successfully',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Detailed error/warning information',
  })
  messageDetail?: {
    errors?: Array<{
      owner?: string;
      message?: string;
      code?: string;
      status?: string;
      shortText?: string;
      type?: string;
    }>;
    warnings?: Array<{
      owner?: string;
      message?: string;
      code?: string;
    }>;
  };
}

/**
 * Recipient - Response recipient information
 */
export class RecipientDto {
  @ApiProperty({ type: TravelAgencyDto })
  travelAgency: TravelAgencyDto;
}

/**
 * Amount - Monetary amount information
 */
export class AmountDto {
  @ApiProperty({
    description: 'Amount value',
    example: 750000,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'KRW',
  })
  currencyCode: string;
}

/**
 * RefundInfo - Refund information (only for refund cases)
 */
export class RefundInfoDto {
  @ApiProperty({
    type: AmountDto,
    description: 'Refund amount',
  })
  refundAmount: AmountDto;

  @ApiPropertyOptional({
    type: AmountDto,
    description: 'Penalty amount (if applicable)',
  })
  penalty?: AmountDto;

  @ApiPropertyOptional({
    description: 'Refund method',
    example: 'ORIGINAL_FORM_OF_PAYMENT',
  })
  refundMethod?: string;
}

/**
 * Order - Cancelled order information
 */
export class CancelledOrderDto {
  @ApiProperty({
    description: 'Order ID',
    example: 'TSDEV-20240315-6f464b4b8d80f67f',
  })
  orderId: string;

  @ApiProperty({
    description: 'Order status (should be CANCELLED after cancel)',
    example: 'CANCELLED',
  })
  orderStatus: string;
}

/**
 * OrderCancel Response DTO
 *
 * Per OpenAPI spec (OrderCancelRS28):
 * - ResultMessage: required
 * - Recipient: required
 * - PointOfSale: required
 * - TransactionID: required
 * - AugmentationPoint: optional
 *
 * Additional fields for business context:
 * - Order: cancelled order info
 * - RefundInfo: refund details (if refund)
 */
export class OrderCancelRSDto {
  @ApiProperty({ type: ResultMessageDto })
  resultMessage: ResultMessageDto;

  @ApiProperty({ type: RecipientDto })
  recipient: RecipientDto;

  @ApiProperty({
    description: 'Point of sale',
    example: 'KR',
  })
  pointOfSale: string;

  @ApiProperty({
    description: 'Transaction ID',
    example: '8d6ec82e0d3546eaacc49be57b71cef5',
  })
  transactionId: string;

  @ApiPropertyOptional({
    type: CancelledOrderDto,
    description: 'Cancelled order information',
  })
  order?: CancelledOrderDto;

  @ApiPropertyOptional({
    type: RefundInfoDto,
    description: 'Refund information (for TICKETED refund)',
  })
  refundInfo?: RefundInfoDto;

  @ApiPropertyOptional({
    description: 'Augmentation point for additional data',
  })
  augmentationPoint?: {
    any?: Array<Record<string, unknown>>;
  };
}
````

## File 18: order-change.dto.ts
**Path**: `src/lib/polarhub/dto/order-change.dto.ts`
````typescript
/**
 * OrderChange DTO
 *
 * Request DTO for PolarHub OrderChange API (POST /hub/polarpie/v2/orderChange).
 *
 * Supported 7 change modes:
 * 1. AcceptSelectedQuotedOfferList - Seat/service change, post-ticketing itinerary change (WF_TKT_VOLCHANGE)
 * 2. AcceptOrderItemList - Hold confirmation (legacy method, some airlines)
 * 3. AcceptRepricedOrder - Hold itinerary change, delay ticketing (WF_HELD_ITIN, WF_HELD_CONFIRM)
 * 4. UpdatePax - Passenger information change (WF_HELD_PAX)
 * 5. AcceptChange - OCN acceptance (WF_TKT_OCN)
 * 6. ReasonCode='DIV' + UpdatePax - PNR split (WF_HELD_SPLIT)
 * 7. ReasonCode='104' - Payment timelimit extension (TK only)
 *
 * CRITICAL:
 * - transactionId is provided by FE (pass-through)
 * - No hardcoding
 * - All fields are received from FE and passed through
 *
 * @see OpenAPI spec: OrderChangeRQ29
 */

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
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CriteriaDto as CommonCriteriaDto,
  ResponseParameterDto as CommonResponseParameterDto,
  FopPromotionDto as CommonFopPromotionDto,
} from './common.dto';

// ==============================================
// Common DTOs (shared/reusable)
// ==============================================

/**
 * Travel Agency DTO
 */
export class TravelAgencyDto {
  @ApiProperty({
    description: 'Travel Agency ID',
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
    description: 'Contact info reference IDs (required for BA)',
    example: ['CTC_TA1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactInfoRefId?: string[];
}

/**
 * Sender DTO
 */
export class SenderDto {
  @ApiProperty({ type: TravelAgencyDto })
  @ValidateNested()
  @Type(() => TravelAgencyDto)
  travelAgency: TravelAgencyDto;
}

// ==============================================
// OfferItem & Offer DTOs
// ==============================================

/**
 * Seat Selection DTO
 */
export class SeatSelectionDto {
  @ApiProperty({ description: 'Seat column', example: 'A' })
  @IsString()
  column: string;

  @ApiProperty({ description: 'Seat row', example: '10' })
  @IsString()
  row: string;
}

/**
 * Booking Instructions DTO (for service booking)
 */
export class BookingInstructionsDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Text instructions',
    example: ['TTL10KG'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  text?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'OSI text',
    example: ['TTL5KG'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ositext?: string[];
}

/**
 * OfferItem DTO (inside SelectedPricedOffer)
 */
export class ChangeOfferItemDto {
  @ApiProperty({ description: 'Offer Item ID', example: 'OI-1234' })
  @IsString()
  offerItemId: string;

  @ApiProperty({
    type: [String],
    description: 'Passenger reference IDs',
    example: ['PAX1'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  paxRefId: string[];

  @ApiPropertyOptional({
    type: SeatSelectionDto,
    description: 'Seat selection (for seat changes)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeatSelectionDto)
  seatSelection?: SeatSelectionDto;

  @ApiPropertyOptional({
    type: BookingInstructionsDto,
    description: 'Booking instructions (for adding services)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BookingInstructionsDto)
  bookingInstructions?: BookingInstructionsDto;
}

/**
 * Selected Priced Offer DTO (for AcceptSelectedQuotedOfferList)
 */
export class SelectedPricedOfferDto {
  @ApiProperty({ description: 'Offer ID from OrderQuote/SeatAvailability/ServiceList', example: 'f79b5a42dde047329b5e4e11f28f5e8524.1-1' })
  @IsString()
  offerId: string;

  @ApiProperty({ description: 'Airline owner code', example: 'SQ' })
  @IsString()
  owner: string;

  @ApiPropertyOptional({
    description: 'Response ID (OrderID for post-booking changes)',
    example: 'TSDEV-20250821-4328881ceef496eb',
  })
  @IsOptional()
  @IsString()
  responseId?: string;

  @ApiProperty({ type: [ChangeOfferItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChangeOfferItemDto)
  offerItems: ChangeOfferItemDto[];

  @ApiPropertyOptional({
    type: CommonFopPromotionDto,
    description: 'FOP promotion for card/payment discounts',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommonFopPromotionDto)
  fopPromotion?: CommonFopPromotionDto;
}

// ==============================================
// ChangeOrderChoice DTOs (7 modes)
// ==============================================

/**
 * AcceptSelectedQuotedOfferList DTO
 * Purpose: Seat/service change, voluntary itinerary change after ticketing
 *
 * Workflows:
 * - WF_HELD_SEAT: Seat change for held booking
 * - WF_HELD_SERVICE: Service addition for held booking
 * - WF_TKT_SEAT: Seat change after ticketing
 * - WF_TKT_SERVICE: Service addition after ticketing
 * - WF_TKT_VOLCHANGE: Voluntary itinerary change after ticketing (CRITICAL: NOT AcceptRepricedOrder!)
 */
export class AcceptSelectedQuotedOfferListDto {
  @ApiProperty({
    type: [SelectedPricedOfferDto],
    description: 'List of selected priced offers from OrderQuote/SeatAvailability/ServiceList',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SelectedPricedOfferDto)
  selectedPricedOffer: SelectedPricedOfferDto[];
}

/**
 * AcceptOrderItemList DTO
 * Purpose: Hold confirmation (legacy method, some airlines only)
 *
 * @deprecated Most airlines use AcceptRepricedOrder
 */
export class AcceptOrderItemListDto {
  @ApiProperty({ description: 'Airline owner code', example: 'SQ' })
  @IsString()
  owner: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Offer Item Reference IDs',
    example: ['OI1', 'OI2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  offerItemRefId?: string[];

  @ApiPropertyOptional({
    description: 'Price guarantee time limit',
    example: '2025-12-31T23:59:59',
  })
  @IsOptional()
  @IsString()
  priceGuaranteeTimeLimit?: string;

  @ApiPropertyOptional({
    description: 'Web address URI',
  })
  @IsOptional()
  @IsString()
  webAddressUri?: string;
}

/**
 * AcceptRepricedOrder DTO
 * Purpose: Hold itinerary change, delay ticketing (Hold confirmation)
 *
 * Workflows:
 * - WF_HELD_ITIN: Hold itinerary change (after OrderReshop)
 * - WF_HELD_CONFIRM: Hold confirmation / delay ticketing
 *
 * CRITICAL: Must NOT be used for voluntary itinerary change after ticketing (WF_TKT_VOLCHANGE)!
 * Causes "INVALID SEGMENT SELECTION" error -> Use AcceptSelectedQuotedOfferList instead
 */
export class AcceptRepricedOrderDto {
  @ApiProperty({
    type: [String],
    description:
      'Offer Reference IDs. Use OfferID from OrderReshop if available, otherwise use OrderID',
    example: ['TSDEV-20250826-640e6a91ae44f45b'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  offerRefId: string[];
}

/**
 * UpdatePax DTO
 * Purpose: Passenger information change, PNR split
 *
 * Per OpenAPI spec, both currentPaxRefId and newPaxRefId are OPTIONAL
 *
 * Usage patterns:
 * - Add: { newPaxRefId: "PAX1" } (no currentPaxRefId)
 * - Delete: { currentPaxRefId: "PAX1" } (no newPaxRefId)
 * - Update: { currentPaxRefId: "PAX1", newPaxRefId: "PAX1" } (both used)
 * - PNR Split: ReasonCode='DIV' + { newPaxRefId: "PAX4" }
 *
 * CRITICAL: Both must be optional for Delete mode to work!
 */
export class UpdatePaxDto {
  @ApiPropertyOptional({
    description: 'Current PAX reference ID (for modify/delete)',
    example: 'PAX1',
  })
  @IsOptional()
  @IsString()
  currentPaxRefId?: string;

  @ApiPropertyOptional({
    description: 'New PAX reference ID (for add/modify)',
    example: 'PAX1',
  })
  @IsOptional()
  @IsString()
  newPaxRefId?: string;
}

/**
 * AcceptChange DTO
 * Purpose: OCN (Operation Change Notification) acceptance
 *
 * Workflow:
 * - WF_TKT_OCN: Involuntary change acceptance
 */
export class AcceptChangeDto {
  @ApiProperty({
    type: [String],
    description: 'Order Item Reference IDs to accept',
    example: ['OI1', 'OI2'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  orderItemRefId: string[];
}

/**
 * CancelUnpaidOrder DTO
 * Purpose: Cancel free ancillary services
 */
export class CancelUnpaidOrderDto {
  @ApiProperty({ description: 'Order Reference ID (Booking number)', example: 'TSDEV-20250826-xxx' })
  @IsString()
  orderRefId: string;

  @ApiProperty({ description: 'Airline owner code', example: 'SQ' })
  @IsString()
  owner: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Selected OrderItem IDs to cancel',
    example: ['OI1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOrderItemRefId?: string[];
}

/**
 * AcceptCancelledOffer DTO
 * Purpose: Process ancillary service refund
 */
export class AcceptCancelledOfferDto {
  @ApiProperty({ description: 'Offer ID', example: 'OFFER123' })
  @IsString()
  offerId: string;

  @ApiProperty({ description: 'Airline owner code', example: 'SQ' })
  @IsString()
  owner: string;
}

/**
 * ChangeOrderChoice DTO
 * Object containing 7 change modes
 * At least one mode must be selected
 */
export class ChangeOrderChoiceDto {
  @ApiPropertyOptional({
    type: AcceptSelectedQuotedOfferListDto,
    description: 'Seat/service change, post-ticketing itinerary change (WF_TKT_VOLCHANGE)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AcceptSelectedQuotedOfferListDto)
  acceptSelectedQuotedOfferList?: AcceptSelectedQuotedOfferListDto;

  @ApiPropertyOptional({
    type: AcceptOrderItemListDto,
    description: 'Hold confirmation (legacy method)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AcceptOrderItemListDto)
  acceptOrderItemList?: AcceptOrderItemListDto;

  @ApiPropertyOptional({
    type: AcceptRepricedOrderDto,
    description: 'Hold itinerary change, delay ticketing (WF_HELD_ITIN, WF_HELD_CONFIRM)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AcceptRepricedOrderDto)
  acceptRepricedOrder?: AcceptRepricedOrderDto;

  @ApiPropertyOptional({
    type: [UpdatePaxDto],
    description: 'Passenger information change (WF_HELD_PAX), used with ReasonCode=DIV for PNR split',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePaxDto)
  updatePax?: UpdatePaxDto[];

  @ApiPropertyOptional({
    type: AcceptChangeDto,
    description: 'OCN acceptance (WF_TKT_OCN)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AcceptChangeDto)
  acceptChange?: AcceptChangeDto;

  @ApiPropertyOptional({
    type: CancelUnpaidOrderDto,
    description: 'Cancel free ancillary services',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CancelUnpaidOrderDto)
  cancelUnpaidOrder?: CancelUnpaidOrderDto;

  @ApiPropertyOptional({
    type: AcceptCancelledOfferDto,
    description: 'Process ancillary service refund',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AcceptCancelledOfferDto)
  acceptCancelledOffer?: AcceptCancelledOfferDto;
}

// ==============================================
// Pax DTOs (Passenger Information)
// ==============================================

/**
 * Individual DTO (Personal Information)
 */
export class IndividualDto {
  @ApiPropertyOptional({
    description: 'Individual ID (usually same as PaxID)',
    example: 'PAX1',
  })
  @IsOptional()
  @IsString()
  individualId?: string;

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

  @ApiPropertyOptional({
    type: [String],
    description: 'Middle name(s)',
    example: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  middleName?: string[];

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

  @ApiPropertyOptional({
    enum: ['Male', 'Female', 'MALE', 'FEMALE'],
    description: 'Gender (some airlines require uppercase)',
  })
  @IsOptional()
  @IsString()
  gender?: string;
}

/**
 * Identity Document DTO (Passport Information)
 */
export class IdentityDocDto {
  @ApiProperty({ description: 'Document type (PT=Passport)', example: 'PT' })
  @IsString()
  identityDocumentType: string;

  @ApiProperty({ description: 'Document number', example: 'M12345678' })
  @IsString()
  identityDocumentNumber: string;

  @ApiPropertyOptional({
    description: 'Expiry date (YYYY-MM-DD)',
    example: '2030-01-01',
  })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Issuing country ISO code', example: 'KR' })
  @IsOptional()
  @IsString()
  issuingCountryCode?: string;

  @ApiPropertyOptional({ description: 'Citizenship country ISO code', example: 'KR' })
  @IsOptional()
  @IsString()
  citizenshipCountryCode?: string;

  @ApiPropertyOptional({ description: 'Gender in document', example: 'MALE' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Given name(s) in document',
    example: ['GILDONG'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  givenName?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Middle name(s) in document',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  middleName?: string[];

  @ApiPropertyOptional({ description: 'Surname in document', example: 'HONG' })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiPropertyOptional({
    type: [Object],
    description: 'Visa information',
  })
  @IsOptional()
  @IsArray()
  visa?: unknown[];
}

/**
 * Loyalty Program Account DTO (Mileage - AF, KL only)
 */
export class LoyaltyProgramAccountDto {
  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'FB' })
  @IsOptional()
  @IsString()
  programCode?: string;
}

/**
 * PaxDetail DTO (Passenger Detailed Information)
 * Used in OrderChange's PaxList
 */
export class PaxDetailDto {
  @ApiProperty({ example: 'PAX1', description: 'Passenger ID' })
  @IsString()
  paxId: string;

  @ApiProperty({ enum: ['ADT', 'CHD', 'INF'], example: 'ADT' })
  @IsString()
  ptc: string;

  @ApiPropertyOptional({ type: IndividualDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IndividualDto)
  individual?: IndividualDto;

  @ApiPropertyOptional({
    type: [IdentityDocDto],
    description: 'Passport/ID info',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdentityDocDto)
  identityDoc?: IdentityDocDto[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Contact info reference IDs',
    example: ['CTCPAX1_1', 'CTCPAX1_2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactInfoRefId?: string[];

  @ApiPropertyOptional({
    type: [LoyaltyProgramAccountDto],
    description: 'Loyalty/FFN info (AF, KL)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoyaltyProgramAccountDto)
  loyaltyProgramAccount?: LoyaltyProgramAccountDto[];
}

// ==============================================
// ContactInfo DTOs
// ==============================================

/**
 * Phone DTO
 * CRITICAL: No hardcoding of Label or other values!
 */
export class PhoneDto {
  @ApiProperty({ example: '01012345678' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ example: '82' })
  @IsOptional()
  @IsString()
  countryDialingCode?: string;

  @ApiPropertyOptional({
    description: 'Phone label (provided by FE)',
    example: 'Mobile',
  })
  @IsOptional()
  @IsString()
  label?: string;
}

/**
 * Postal Address DTO (required for BA)
 */
export class PostalAddressDto {
  @ApiPropertyOptional({
    type: [String],
    example: ['8F, 78 Namdaemun-ro, Jung-gu'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  street?: string[];

  @ApiPropertyOptional({ example: 'Seoul' })
  @IsOptional()
  @IsString()
  cityName?: string;

  @ApiPropertyOptional({ example: '04527' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'KR' })
  @IsOptional()
  @IsString()
  countryCode?: string;
}

/**
 * ContactInfo DTO
 */
export class ContactInfoDto {
  @ApiProperty({ example: 'CTCPAX1_1' })
  @IsString()
  contactInfoId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Email addresses (array!)',
    example: ['user@example.com'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emailAddress?: string[];

  @ApiPropertyOptional({
    type: [PhoneDto],
    description: 'Phone numbers (array!)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhoneDto)
  phone?: PhoneDto[];

  @ApiPropertyOptional({
    type: [PostalAddressDto],
    description: 'Postal addresses (required for BA)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostalAddressDto)
  postalAddress?: PostalAddressDto[];
}

// ==============================================
// Payment DTOs
// ==============================================

/**
 * Payment DTO (simplified version)
 * Most OrderChange operations use Cash payment
 */
export class PaymentDto {
  @ApiProperty({
    enum: ['Cash', 'Card', 'Ag'],
    description: 'Payment type',
    example: 'Cash',
  })
  @IsString()
  type: string;

  @ApiProperty({ example: 1500000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'KRW' })
  @IsString()
  curCode: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Order Item IDs',
    example: ['OI1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderItemId?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Offer Item IDs',
    example: ['f79b5a42dde047329b5e4e11f28f5e8524.1-1-1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  offerItemId?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Pax Reference IDs',
    example: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxRefId?: string[];
}

// ==============================================
// RepricedOrderId DTO (for delay ticketing)
// ==============================================

/**
 * RepricedOrderId DTO
 * Purpose: Delay ticketing (WF_HELD_CONFIRM) - included directly in Query
 *
 * OpenAPI spec (OrderChangeRQ):
 * - Query.RepricedOrderID: { OrderID, OrderItemRefID[] }
 *
 * IMPORTANT: Different from ChangeOrderChoice.AcceptRepricedOrder!
 * - AcceptRepricedOrder.OfferRefID: simple string[] (OrderID or OfferID)
 * - RepricedOrderID: { OrderID, OrderItemRefID[] } object structure
 */
export class RepricedOrderIdDto {
  @ApiProperty({
    description: 'Order ID to reprice',
    example: 'TSDEV-20260126-424c888145864d24',
  })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Order Item Reference IDs to include in repricing',
    example: ['AY1059O3QVT00_AIR-1-2', 'AY1059O3QVT00_SRV14'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderItemRefId?: string[];
}

// ==============================================
// Main Request DTO
// ==============================================

/**
 * OrderChange Request DTO
 *
 * CRITICAL:
 * - ReasonCode is at the Query level (NOT inside ChangeOrderChoice!)
 * - transactionId is provided by FE
 * - repricedOrderId maps to Query.RepricedOrderID (for delay ticketing)
 */
export class OrderChangeRequestDto {
  @ApiProperty({
    description: 'Transaction ID (32-char hex, generated by FE)',
    example: 'f3f7b13bcc3b44ad84cea781a82d7f3c',
  })
  @IsString()
  @Matches(/^[a-f0-9]{32}$/i, { message: 'TransactionID must be 32-char hex' })
  transactionId: string;

  @ApiPropertyOptional({
    type: SenderDto,
    description: 'Optional - uses env if not provided',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SenderDto)
  sender?: SenderDto;

  @ApiProperty({
    description: 'Order ID to change',
    example: 'TSDEV-20250826-640e6a91ae44f45b',
  })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    description: 'Point of sale country code',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  pointOfSale?: string;

  @ApiPropertyOptional({
    description:
      'Reason code: DIV=PNR split, 104=Payment timelimit extension (TK)',
    example: 'DIV',
  })
  @IsOptional()
  @IsString()
  reasonCode?: string;

  @ApiPropertyOptional({
    type: RepricedOrderIdDto,
    description: `Delay ticketing (WF_HELD_CONFIRM) - maps to Query.RepricedOrderID

IMPORTANT: Different from changeOrderChoice.acceptRepricedOrder!
- acceptRepricedOrder: Only passes OfferRefID array
- repricedOrderId: Passes OrderID + OrderItemRefID object

Usage example (delay ticketing):
\`\`\`json
{
  "orderId": "TSDEV-20260126-xxx",
  "repricedOrderId": {
    "orderId": "TSDEV-20260126-xxx",
    "orderItemRefId": ["AIR-1-2", "SRV14"]
  }
}
\`\`\``,
    example: {
      orderId: 'TSDEV-20260126-424c888145864d24',
      orderItemRefId: ['AY1059O3QVT00_AIR-1-2', 'AY1059O3QVT00_SRV14'],
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RepricedOrderIdDto)
  repricedOrderId?: RepricedOrderIdDto;

  @ApiPropertyOptional({
    type: ChangeOrderChoiceDto,
    description: 'Change mode selection (can be omitted when using repricedOrderId)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChangeOrderChoiceDto)
  changeOrderChoice?: ChangeOrderChoiceDto;

  @ApiPropertyOptional({
    type: [PaxDetailDto],
    description: 'Passenger list (required for UpdatePax, PNR Split)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaxDetailDto)
  paxList?: PaxDetailDto[];

  @ApiPropertyOptional({
    type: [ContactInfoDto],
    description: 'Contact info list (required for some airlines such as BA)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactInfoDto)
  contactInfoList?: ContactInfoDto[];

  @ApiPropertyOptional({
    type: [PaymentDto],
    description: 'Payment list (seat/service purchase, delay ticketing, etc.)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  paymentList?: PaymentDto[];

  @ApiPropertyOptional({
    type: CommonCriteriaDto,
    description: 'Search criteria (contract fare, promotion, special fare, existing order reference)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommonCriteriaDto)
  criteria?: CommonCriteriaDto;

  @ApiPropertyOptional({
    type: CommonResponseParameterDto,
    description: 'Response settings (currency, language)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommonResponseParameterDto)
  responseParameter?: CommonResponseParameterDto;
}

// ==============================================
// Response DTO (Raw pass-through)
// ==============================================

/**
 * OrderChange Response DTO
 * Returns PolarHub response as-is (no transformation)
 */
export class OrderChangeResponseDto {
  @ApiProperty({ description: 'Transaction ID', example: 'f3f7b13bcc3b44ad84cea781a82d7f3c' })
  transactionId: string;

  @ApiProperty({
    description: 'Raw PolarHub API response',
    type: 'object',
  })
  response: unknown;
}
````

## File 19: order-quote.dto.ts
**Path**: `src/lib/polarhub/dto/order-quote.dto.ts`
````typescript
/**
 * OrderQuote API DTOs
 *
 * Supports 2 modes:
 * - SelectedOffer: Seat/service change quote (after SeatAvailability/ServiceList)
 * - RepricedOrderID: Pre-ticketing fare recalculation (before held booking confirmation)
 *
 * Supported workflows:
 * - WF_HELD_SERVICE: Add service to held booking
 * - WF_HELD_CONFIRM: Confirm held booking (deferred ticketing) - varies by airline
 * - WF_TKT_SEAT: Seat change after ticketing
 * - WF_TKT_SERVICE: Add service after ticketing
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CriteriaDto as CommonCriteriaDto,
  ResponseParameterDto as CommonResponseParameterDto,
  FopPromotionDto as CommonFopPromotionDto,
  PaxCodeDto as CommonPaxCodeDto,
} from './common.dto';

// ==============================================
// Common DTOs (reusable)
// ==============================================

/**
 * Travel Agency DTO
 */
export class TravelAgencyDto {
  @ApiProperty({
    description: 'Travel Agency ID',
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

/**
 * Sender DTO
 */
export class SenderDto {
  @ApiProperty({ type: TravelAgencyDto })
  @ValidateNested()
  @Type(() => TravelAgencyDto)
  travelAgency: TravelAgencyDto;
}

/**
 * Seat Selection DTO
 */
export class SeatSelectionDto {
  @ApiProperty({
    description: 'Seat column (e.g., A, B, C...)',
    example: 'G',
  })
  @IsString()
  column: string;

  @ApiProperty({
    description: 'Seat row number',
    example: '20',
  })
  @IsString()
  row: string;
}

/**
 * Booking Instructions DTO (for services)
 */
export class BookingInstructionsDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Booking instruction text',
    example: ['TTL10KG'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  text?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'OSI text pattern',
    example: ['TTL\\s?%WVAL%KG'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ositext?: string[];
}

// ==============================================
// OrderQuote Specific DTOs
// ==============================================

/**
 * Offer Item DTO for OrderQuote
 */
export class QuoteOfferItemDto {
  @ApiProperty({
    description: 'Offer item ID',
    example: 'OI1',
  })
  @IsString()
  offerItemId: string;

  @ApiProperty({
    type: [String],
    description: 'Passenger reference IDs',
    example: ['PAX1'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  paxRefId: string[];

  @ApiPropertyOptional({
    type: SeatSelectionDto,
    description: 'Seat selection (for seat quote)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeatSelectionDto)
  seatSelection?: SeatSelectionDto;

  @ApiPropertyOptional({
    type: BookingInstructionsDto,
    description: 'Booking instructions (for service quote)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BookingInstructionsDto)
  bookingInstructions?: BookingInstructionsDto;
}

/**
 * FOP Promotion DTO (card/payment method promotion)
 */
export class FopPromotionDto {
  @ApiProperty({
    description: 'Promotion code',
    example: 'VISA2026',
  })
  @IsString()
  promotionCode: string;

  @ApiPropertyOptional({
    description: 'Payment type (A=Card, C=Cash, K=KakaoPay, S=SamsungPay)',
    example: 'A',
  })
  @IsOptional()
  @IsString()
  paymentType?: string;

  @ApiPropertyOptional({
    description: 'Card code (e.g., VI, MC, AX)',
    example: 'VI',
  })
  @IsOptional()
  @IsString()
  cardCode?: string;

  @ApiPropertyOptional({
    description: 'Card name',
    example: 'VISA',
  })
  @IsOptional()
  @IsString()
  cardName?: string;
}

/**
 * Selected Offer DTO (Mode 1: Seat/Service Quote)
 *
 * Offer selection from SeatAvailability or ServiceList response
 */
export class SelectedOfferDto {
  @ApiProperty({
    description: 'Offer ID from SeatAvailability or ServiceList',
    example: 'SEAT_OFFER_123',
  })
  @IsString()
  offerId: string;

  @ApiProperty({
    description: 'Airline owner code',
    example: 'SQ',
  })
  @IsString()
  owner: string;

  @ApiPropertyOptional({
    description: 'Response ID',
    example: 'RESP123',
  })
  @IsOptional()
  @IsString()
  responseId?: string;

  @ApiProperty({
    type: [QuoteOfferItemDto],
    description: 'Offer items with seat/service selection',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteOfferItemDto)
  offerItems: QuoteOfferItemDto[];

  @ApiPropertyOptional({
    type: CommonFopPromotionDto,
    description: 'FOP promotion for card/payment discounts',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommonFopPromotionDto)
  fopPromotion?: CommonFopPromotionDto;
}

/**
 * Repriced Order ID DTO (Mode 2: Hold Confirmation Quote)
 *
 * Used for fare recalculation before deferred ticketing in WF_HELD_CONFIRM
 * CRITICAL: Required for some airlines such as SQ, AY, KL!
 */
export class RepricedOrderIdDto {
  @ApiProperty({
    description: 'Order ID to be repriced',
    example: 'ORDER123456',
  })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'OrderItemID(s) to be repriced',
    example: ['SQ607-AIR-1-1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderItemRefId?: string[];
}

/**
 * Affect DTO (specify affected OrderItems)
 *
 * Used when applying changes to specific OrderItems only
 */
export class AffectDto {
  @ApiProperty({
    description: 'OrderItem ID that is affected',
    example: 'OI1',
  })
  @IsString()
  orderItemRefId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of RetainService IDs to keep',
    example: ['SVC1', 'SVC2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  retainServiceId?: string[];
}

/**
 * Program Criteria DTO (special fare program)
 */
export class ProgramCriteriaDto {
  @ApiProperty({
    description: 'Airline ID',
    example: 'SQ',
  })
  @IsString()
  airlineId: string;

  @ApiPropertyOptional({
    description: 'Contract ID',
    example: 'CONTRACT001',
  })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiPropertyOptional({
    description: 'Program type code',
    example: 'CORPORATE',
  })
  @IsOptional()
  @IsString()
  typeCode?: string;
}

/**
 * Criteria DTO (search/fare conditions)
 */
export class CriteriaDto {
  @ApiPropertyOptional({
    type: [ProgramCriteriaDto],
    description: 'Program criteria for special fares',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramCriteriaDto)
  programCriteria?: ProgramCriteriaDto[];
}

/**
 * Language Usage DTO
 */
export class LanguageUsageDto {
  @ApiProperty({
    description: 'Language code (ISO 639-1)',
    example: 'ko',
  })
  @IsString()
  langCode: string;
}

/**
 * Response Parameter DTO (response settings)
 */
export class ResponseParameterDto {
  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'KRW',
  })
  @IsString()
  currencyCode: string;

  @ApiPropertyOptional({
    type: LanguageUsageDto,
    description: 'Language settings',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LanguageUsageDto)
  languageUsage?: LanguageUsageDto;
}

/**
 * Pax Simple DTO (simplified passenger info)
 */
export class PaxSimpleDto {
  @ApiProperty({
    description: 'Passenger ID',
    example: 'PAX1',
  })
  @IsString()
  paxId: string;

  @ApiProperty({
    description: 'Passenger type code (ADT, CHD, INF)',
    example: 'ADT',
  })
  @IsString()
  ptc: string;
}

// ==============================================
// Main Request/Response DTOs
// ==============================================

/**
 * OrderQuote Request DTO
 *
 * Supports 2 modes (mutually exclusive):
 * - Mode 1: selectedOffer - Seat/service quote
 * - Mode 2: repricedOrderId - Deferred ticketing fare recalculation
 *
 * @example Mode 1 - Seat quote (WF_TKT_SEAT)
 * {
 *   "transactionId": "4ba5a0b50d2c45b3b5eb343b57ba8897",
 *   "orderId": "ORDER123456",
 *   "selectedOffer": [{
 *     "offerId": "SEAT_OFFER_123",
 *     "owner": "SQ",
 *     "offerItems": [{
 *       "offerItemId": "OI1",
 *       "paxRefId": ["PAX1"],
 *       "seatSelection": { "column": "G", "row": "20" }
 *     }]
 *   }]
 * }
 *
 * @example Mode 2 - Deferred ticketing fare recalculation (WF_HELD_CONFIRM)
 * {
 *   "transactionId": "4ba5a0b50d2c45b3b5eb343b57ba8897",
 *   "orderId": "ORDER123456",
 *   "repricedOrderId": {
 *     "orderId": "ORDER123456",
 *     "orderItemRefId": ["SQ607-AIR-1-1"]
 *   }
 * }
 */
export class OrderQuoteRequestDto {
  @ApiProperty({
    description: 'Transaction ID (32-char hex, provided by FE)',
    example: '4ba5a0b50d2c45b3b5eb343b57ba8897',
  })
  @IsString()
  @Matches(/^[a-f0-9]{32}$/i, {
    message: 'transactionId must be a 32-character hex string',
  })
  transactionId: string;

  @ApiPropertyOptional({
    type: SenderDto,
    description: 'Sender info (optional - uses env vars if not provided)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SenderDto)
  sender?: SenderDto;

  @ApiPropertyOptional({
    description: 'Order ID (required for post-booking quotes)',
    example: 'ORDER123456',
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  // Mode 1: SelectedOffer (Seat/Service Quote)
  @ApiPropertyOptional({
    type: [SelectedOfferDto],
    description: `Mode 1: Seat/Service quote
- Use for WF_TKT_SEAT, WF_TKT_SERVICE, WF_HELD_SERVICE
- Offer from SeatAvailability or ServiceList response`,
    example: [
      {
        offerId: 'SEAT_OFFER_123',
        owner: 'SQ',
        offerItems: [
          {
            offerItemId: 'OI1',
            paxRefId: ['PAX1'],
            seatSelection: { column: 'G', row: '20' },
          },
        ],
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedOfferDto)
  selectedOffer?: SelectedOfferDto[];

  // Mode 2: RepricedOrderID (Hold Confirmation Quote)
  @ApiPropertyOptional({
    type: RepricedOrderIdDto,
    description: `Mode 2: Held booking confirmation quote (WF_HELD_CONFIRM)
- CRITICAL: Required for SQ, AY, KL before ticketing held orders
- OrderQuote response OfferID used in OrderChange AcceptRepricedOrder`,
    example: {
      orderId: 'ORDER123456',
      orderItemRefId: ['SQ607-AIR-1-1'],
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RepricedOrderIdDto)
  repricedOrderId?: RepricedOrderIdDto;

  // Affect (specify affected OrderItems)
  @ApiPropertyOptional({
    type: [AffectDto],
    description: 'Specify affected OrderItems with RetainService options',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AffectDto)
  affect?: AffectDto[];

  // Criteria (search/fare conditions - full CriteriaType4)
  @ApiPropertyOptional({
    type: CommonCriteriaDto,
    description: 'Search criteria (direct, airline preference, contract fare, promotion, special fare, existing order reference)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommonCriteriaDto)
  criteria?: CommonCriteriaDto;

  // Response Parameter (response settings)
  @ApiPropertyOptional({
    type: CommonResponseParameterDto,
    description: 'Response settings (currency, language)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommonResponseParameterDto)
  responseParameter?: CommonResponseParameterDto;

  // PaxList (optional - supports birthDate, loyaltyProgramAccount)
  @ApiPropertyOptional({
    type: [CommonPaxCodeDto],
    description: 'Passenger list (optional)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommonPaxCodeDto)
  paxList?: CommonPaxCodeDto[];
}

/**
 * OrderQuote Response DTO
 *
 * Returns the raw PolarHub response as-is.
 * Key fields:
 * - QuotedOffer: List of quoted offers
 * - DataLists: Reference data (flights, passengers, etc.)
 */
export class OrderQuoteResponseDto {
  @ApiProperty({
    description: 'Transaction ID (same as request)',
    example: '4ba5a0b50d2c45b3b5eb343b57ba8897',
  })
  transactionId: string;

  @ApiProperty({
    description: 'Raw PolarHub OrderQuote response',
    example: {
      ResultMessage: { Code: '0', Message: 'Success' },
      QuotedOffer: [
        {
          OfferID: 'QUOTED_OFFER_123',
          Owner: 'SQ',
          TotalPrice: {
            TotalAmount: { Amount: 50000, CurrencyCode: 'KRW' },
          },
        },
      ],
    },
  })
  response: unknown;
}
````

## File 20: order-reshop.dto.ts
**Path**: `src/lib/polarhub/dto/order-reshop.dto.ts`
````typescript
/**
 * OrderReshop DTO
 *
 * Used for itinerary change search and refund quote retrieval.
 *
 * Supported workflows:
 * - WF_HELD_ITIN: Held booking itinerary change
 * - WF_TKT_VOLCHANGE: Voluntary itinerary change
 * - WF_TKT_REFUND: Refund quote retrieval
 *
 * CRITICAL:
 * - Delete is of type Array<{ orderItemRefId, retainServiceId? }>
 * - CancelOrderRefID is a string type (not an object!)
 * - Nested objects require @ValidateNested() + @Type()
 */

import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CriteriaDto as CommonCriteriaDto,
  ResponseParameterDto as CommonResponseParameterDto,
} from './common.dto';

// ==============================================
// Common DTOs
// ==============================================

export class TravelAgencyDto {
  @ApiProperty({ description: 'Agency ID (env var fallback: POLARHUB_TENANT_ID)' })
  @IsString()
  agencyId: string;

  @ApiPropertyOptional({ description: 'Site code (default: 01)' })
  @IsOptional()
  @IsString()
  siteCode?: string;

  @ApiPropertyOptional({ description: 'Agency name' })
  @IsOptional()
  @IsString()
  agencyName?: string;

  @ApiPropertyOptional({
    description: 'Contact info reference IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactInfoRefId?: string[];
}

export class SenderDto {
  @ApiProperty({ description: 'Travel agency information' })
  @ValidateNested()
  @Type(() => TravelAgencyDto)
  travelAgency: TravelAgencyDto;
}

export class FEAuthHeadersDto {
  @ApiPropertyOptional({ description: 'RFC1123 timestamp (e.g., "Thu, 16 Jan 2026 06:51:52 GMT")' })
  @IsOptional()
  @IsString()
  'x-date'?: string;

  @ApiPropertyOptional({ description: 'SHA-512 digest (e.g., "SHA-512={base64_hash}")' })
  @IsOptional()
  @IsString()
  Digest?: string;

  @ApiPropertyOptional({ description: 'HMAC authorization header' })
  @IsOptional()
  @IsString()
  Authorization?: string;
}

// ==============================================
// OrderReshop Specific DTOs
// ==============================================

/**
 * Origin-Destination for new itinerary (Add)
 */
export class OriginDestDto {
  @ApiProperty({ description: 'Origin airport code (e.g., ICN)', example: 'ICN' })
  @IsString()
  @IsNotEmpty()
  origin: string;

  @ApiProperty({ description: 'Destination airport code (e.g., SIN)', example: 'SIN' })
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty({ description: 'Departure date (YYYY-MM-DD)', example: '2025-07-01' })
  @IsString()
  @IsNotEmpty()
  departureDate: string;
}

/**
 * Delete item - segment to remove
 *
 * Per OpenAPI spec:
 * - OrderItemRefID: required string (single string)
 * - RetainServiceID: optional string[] (array of service IDs to retain)
 */
export class DeleteItemDto {
  @ApiProperty({
    description: 'OrderItemID to delete (from OrderRetrieve response)',
    example: 'SEG1_OI',
  })
  @IsString()
  @IsNotEmpty()
  orderItemRefId: string;

  @ApiPropertyOptional({
    description: 'Service IDs to retain (for partial itinerary change)',
    type: [String],
    example: ['SVC1', 'SVC2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  retainServiceId?: string[];
}

/**
 * Add - new itinerary information
 */
export class AddServiceOrderDto {
  @ApiProperty({
    description: 'New origin-destination list',
    type: [OriginDestDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OriginDestDto)
  originDestList: OriginDestDto[];

  @ApiPropertyOptional({
    description: 'Cabin class (Y: Economy, W: Premium Economy, C: Business, F: First)',
    example: 'Y',
  })
  @IsOptional()
  @IsString()
  cabin?: string;
}

/**
 * ServiceOrder - reshop order details
 */
export class ServiceOrderDto {
  @ApiPropertyOptional({
    description: 'List of segments to delete',
    type: [DeleteItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeleteItemDto)
  delete?: DeleteItemDto[];

  @ApiPropertyOptional({
    description: 'New itinerary to add',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddServiceOrderDto)
  add?: AddServiceOrderDto;
}

/**
 * ReshopOrder - for itinerary change
 */
export class ReshopOrderDto {
  @ApiProperty({ description: 'Service order details (delete/add segments)' })
  @ValidateNested()
  @Type(() => ServiceOrderDto)
  serviceOrder: ServiceOrderDto;
}

/**
 * UpdateOrder - main update payload
 *
 * IMPORTANT: Choose the appropriate field for your workflow:
 * - reshopOrder: For itinerary changes (WF_HELD_ITIN, WF_TKT_VOLCHANGE)
 * - cancelOrderRefId: For refund quote (WF_TKT_REFUND) - STRING type!
 * - repricedOrderRefId: For deferred ticketing (LH, EK, etc.) - STRING type!
 */
export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Reshop order for itinerary change',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReshopOrderDto)
  reshopOrder?: ReshopOrderDto;

  @ApiPropertyOptional({
    description: 'Order ID for refund quote (STRING type, not object!)',
    example: 'ORDER_12345',
  })
  @IsOptional()
  @IsString()
  cancelOrderRefId?: string;

  @ApiPropertyOptional({
    description: 'Order ID to be repriced for deferred ticketing (LH, EK, etc.). STRING type!',
    example: 'TSDEV-20240312-d20663409d8acb35',
  })
  @IsOptional()
  @IsString()
  repricedOrderRefId?: string;
}

// ==============================================
// Request DTO
// ==============================================

/**
 * OrderReshop Request DTO
 *
 * Itinerary change search or refund quote retrieval request
 *
 * @example Itinerary Change (WF_HELD_ITIN, WF_TKT_VOLCHANGE)
 * ```json
 * {
 *   "transactionId": "abc123",
 *   "orderId": "ORDER_12345",
 *   "actionContext": "8",
 *   "updateOrder": {
 *     "reshopOrder": {
 *       "serviceOrder": {
 *         "delete": [{ "orderItemRefId": "SEG1_OI" }],
 *         "add": {
 *           "originDestList": [
 *             { "origin": "ICN", "destination": "SIN", "departureDate": "2025-07-15" }
 *           ],
 *           "cabin": "Y"
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @example Refund Quote (WF_TKT_REFUND)
 * ```json
 * {
 *   "transactionId": "abc123",
 *   "orderId": "ORDER_12345",
 *   "updateOrder": {
 *     "cancelOrderRefId": "ORDER_12345"
 *   }
 * }
 * ```
 */
export class OrderReshopRQDto {
  @ApiProperty({
    description: 'Unique transaction ID (32-char UUID without hyphens). Must be provided by FE.',
    example: '4ba5a0b50d2c45b3b5eb343b57ba8897',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({
    description: 'Order ID to reshop',
    example: 'ORDER_12345',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({
    description: 'Action context for schedule change. 8=Voluntary, 9=Involuntary',
    example: '8',
  })
  @IsOptional()
  @IsString()
  actionContext?: string;

  @ApiProperty({
    description: 'Update order payload. Choose one: reshopOrder (itinerary change) OR cancelOrderRefId (refund)',
  })
  @ValidateNested()
  @Type(() => UpdateOrderDto)
  updateOrder: UpdateOrderDto;

  @ApiPropertyOptional({
    description: 'Sender information (optional - uses env vars as fallback)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SenderDto)
  sender?: SenderDto;

  @ApiPropertyOptional({
    description: 'FE HMAC auth headers for pass-through (optional)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FEAuthHeadersDto)
  feAuthHeaders?: FEAuthHeadersDto;

  @ApiPropertyOptional({
    description: 'Point of sale (default: KR)',
    example: 'KR',
  })
  @IsOptional()
  @IsString()
  pointOfSale?: string;

  @ApiPropertyOptional({
    type: CommonCriteriaDto,
    description: 'Search criteria (contract fare, promotion, special fare, existing order reference)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommonCriteriaDto)
  criteria?: CommonCriteriaDto;

  @ApiPropertyOptional({
    type: CommonResponseParameterDto,
    description: 'Response settings (currency, language)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommonResponseParameterDto)
  responseParameter?: CommonResponseParameterDto;
}

// ==============================================
// Response DTO
// ==============================================

/**
 * Amount with currency
 */
export class AmountDto {
  @ApiProperty({ description: 'Amount value', example: 482100 })
  Amount: number;

  @ApiProperty({ description: 'Currency code (ISO 4217)', example: 'KRW' })
  CurCode: string;
}

/**
 * Total price information
 */
export class TotalPriceDto {
  @ApiProperty({ description: 'Total amount' })
  TotalAmount: AmountDto;

  @ApiPropertyOptional({ description: 'Base amount' })
  TotalBaseAmount?: AmountDto;

  @ApiPropertyOptional({ description: 'Tax amount' })
  TotalTaxAmount?: AmountDto;
}

/**
 * Reshop offer - alternative flight option
 */
export class ReshopOfferDto {
  @ApiProperty({ description: 'Response ID', example: 'RSP_001' })
  ResponseID: string;

  @ApiProperty({ description: 'Offer ID', example: 'OFR_001' })
  OfferID: string;

  @ApiProperty({ description: 'Airline owner code', example: 'SQ' })
  Owner: string;

  @ApiPropertyOptional({ description: 'Total price information' })
  TotalPrice?: TotalPriceDto;

  @ApiPropertyOptional({ description: 'Price difference (positive=additional payment, negative=credit)' })
  PriceDifference?: AmountDto;

  @ApiPropertyOptional({ description: 'Offer items (flight details)', type: 'array' })
  OfferItem?: unknown[];
}

/**
 * Refund quote - for cancellation
 */
export class RefundQuoteDto {
  @ApiProperty({ description: 'Refund quote ID (use in OrderCancel)', example: 'RFQ_001' })
  RefundQuoteID: string;

  @ApiPropertyOptional({ description: 'Total refund amount' })
  RefundAmount?: AmountDto;

  @ApiPropertyOptional({ description: 'Penalty/cancellation fee' })
  Penalty?: AmountDto;

  @ApiPropertyOptional({ description: 'Net refund after penalty' })
  NetRefund?: AmountDto;
}

/**
 * Result message
 */
export class ResultMessageDto {
  @ApiProperty({ description: 'Result code (0=success)', example: '0' })
  Code: string;

  @ApiPropertyOptional({ description: 'Result message' })
  Message?: string;

  @ApiPropertyOptional({ description: 'Message details (errors/warnings)' })
  MessageDetail?: {
    Errors?: Array<{ Owner?: string; Message?: string; Code?: string }>;
    Warnings?: Array<{ Owner?: string; Message?: string; Code?: string }>;
  };
}

/**
 * OrderReshop Response DTO
 *
 * Itinerary change search results or refund quote information
 */
export class OrderReshopRSDto {
  @ApiProperty({ description: 'Transaction ID from request' })
  transactionId: string;

  @ApiPropertyOptional({ description: 'Result message' })
  ResultMessage?: ResultMessageDto;

  @ApiPropertyOptional({ description: 'Response Transaction ID' })
  TransactionID?: string;

  @ApiPropertyOptional({
    description: 'Reshop offers (for itinerary change)',
    type: [ReshopOfferDto],
  })
  ReshopOffers?: ReshopOfferDto[];

  @ApiPropertyOptional({
    description: 'Refund quote (for cancellation)',
  })
  RefundQuote?: RefundQuoteDto;

  @ApiPropertyOptional({ description: 'Data lists (flight segments, pax info, etc.)' })
  DataLists?: unknown;
}
````

## File 21: seat-availability.dto.ts
**Path**: `src/lib/polarhub/dto/seat-availability.dto.ts`
````typescript
/**
 * SeatAvailability API DTOs
 *
 * Request/Response DTOs for the seat availability API.
 * Supports both Prime Booking (offer-based) and Post-Booking (order-based).
 *
 * Workflows:
 * - WF_PB_SEAT: Prime Booking with seat selection
 * - WF_PB_SEAT_SERVICE: Prime Booking with seat + service selection
 * - WF_HELD_SEAT: Seat change for held booking
 * - WF_TKT_SEAT: Seat change after ticketing
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CriteriaDto as CommonCriteriaDto,
  ResponseParameterDto as CommonResponseParameterDto,
  LoyaltyProgramAccountDto as CommonLoyaltyProgramAccountDto,
} from './common.dto';

// ==============================================
// Common DTOs (reusable)
// ==============================================

/**
 * Travel Agency information
 * Uses environment variable values as fallback if not provided by FE
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

/**
 * Passenger (simplified version - PaxID + PTC)
 */
export class PaxCodeDto {
  @ApiProperty({
    description: 'Passenger ID',
    example: 'PAX1',
  })
  @IsString()
  paxId: string;

  @ApiProperty({
    description: 'Passenger type code',
    enum: ['ADT', 'CHD', 'INF'],
    example: 'ADT',
  })
  @IsString()
  ptc: string;

  @ApiPropertyOptional({
    description: 'Birth date (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiPropertyOptional({
    type: [CommonLoyaltyProgramAccountDto],
    description: 'Loyalty program account (FFN)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommonLoyaltyProgramAccountDto)
  loyaltyProgramAccount?: CommonLoyaltyProgramAccountDto[];
}

// ==============================================
// OfferItem DTO (for Prime Booking)
// ==============================================

/**
 * Offer Item (for Prime Booking seat availability)
 */
export class OfferItemRefDto {
  @ApiProperty({
    description: 'Offer Item ID from OfferPrice response',
    example: '5dda4ab8255d469d84951dff9e0d25b024.1-1-1',
  })
  @IsString()
  offerItemId: string;

  @ApiProperty({
    type: [String],
    description: 'Passenger reference IDs',
    example: ['PAX1'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  paxRefId: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Segment reference IDs (optional)',
    example: ['SEG_1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxSegmentRefId?: string[];
}

// ==============================================
// Offer DTO (for Prime Booking)
// ==============================================

/**
 * Offer reference for Prime Booking
 * Offer information received from AirShopping response
 */
export class OfferRefDto {
  @ApiProperty({
    description: 'Response ID from AirShopping',
    example: '8b406338b0bd40bc8c4e0903bf4c5bce',
  })
  @IsString()
  responseId: string;

  @ApiProperty({
    description: 'Offer ID from AirShopping',
    example: '5dda4ab8255d469d84951dff9e0d25b024.1-1',
  })
  @IsString()
  offerId: string;

  @ApiProperty({
    description: 'Airline owner code',
    example: 'TK',
  })
  @IsString()
  @Matches(/^[A-Z0-9]{2,3}$/, { message: 'Must be valid airline code' })
  owner: string;

  @ApiPropertyOptional({
    type: [OfferItemRefDto],
    description: 'Offer items (optional - for specific seat availability)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfferItemRefDto)
  offerItems?: OfferItemRefDto[];
}

// ==============================================
// Order DTO (for Post-Booking)
// ==============================================

/**
 * Order Item (for Post-Booking seat availability)
 */
export class OrderItemRefDto {
  @ApiProperty({
    description: 'Order Item ID',
    example: 'FL_P1',
  })
  @IsString()
  orderItemId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Passenger reference IDs',
    example: ['PAX_1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxRefId?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Segment reference IDs',
    example: ['SEG_1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxSegmentRefId?: string[];
}

/**
 * Order reference for Post-Booking
 * Order information received from OrderRetrieve response
 */
export class OrderRefDto {
  @ApiProperty({
    description: 'Order ID from OrderRetrieve',
    example: 'TSDEV-20250821-ac2f028769a4c45b',
  })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    type: [OrderItemRefDto],
    description: 'Order items (optional - for specific seat availability)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemRefDto)
  orderItems?: OrderItemRefDto[];
}

// ==============================================
// Criteria & ResponseParameter DTOs
// ==============================================

/**
 * Existing order reference (for Post-Booking)
 */
export class ExistingOrderCriteriaDto {
  @ApiProperty({
    description: 'Existing order ID',
    example: 'EXISTING_ORDER_ID',
  })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Passenger reference IDs',
    example: ['PAX1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxRefId?: string[];
}

/**
 * Program Criteria (contract/program fares)
 */
export class ProgramCriteriaDto {
  @ApiProperty({
    description: 'Airline ID',
    example: 'SQ',
  })
  @IsString()
  airlineId: string;

  @ApiPropertyOptional({
    description: 'Contract ID',
    example: 'CONTRACT001',
  })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiPropertyOptional({
    description: 'Type code',
    example: 'CORPORATE',
  })
  @IsOptional()
  @IsString()
  typeCode?: string;
}

/**
 * Special Fare Criteria
 */
export class SpecialFareCriteriaDto {
  @ApiPropertyOptional({
    description: 'Special fare type code',
    example: 'STUDENT',
  })
  @IsOptional()
  @IsString()
  typeCode?: string;
}

/**
 * Criteria (search conditions)
 */
export class CriteriaDto {
  @ApiPropertyOptional({
    type: ExistingOrderCriteriaDto,
    description: 'Existing order reference (Post-Booking)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExistingOrderCriteriaDto)
  existingOrderCriteria?: ExistingOrderCriteriaDto;

  @ApiPropertyOptional({
    type: [ProgramCriteriaDto],
    description: 'Program criteria (contract/corporate rates)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramCriteriaDto)
  programCriteria?: ProgramCriteriaDto[];

  @ApiPropertyOptional({
    type: [SpecialFareCriteriaDto],
    description: 'Special fare criteria',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialFareCriteriaDto)
  specialFareCriteria?: SpecialFareCriteriaDto[];
}

/**
 * Language Usage
 */
export class LanguageUsageDto {
  @ApiProperty({
    description: 'Language code',
    example: 'ko',
  })
  @IsString()
  langCode: string;

  @ApiPropertyOptional({
    description: 'Language usage type',
    example: 'Written',
  })
  @IsOptional()
  @IsString()
  langUsageType?: string;
}

/**
 * Response Parameter (response settings)
 */
export class ResponseParameterDto {
  @ApiProperty({
    description: 'Response currency code',
    example: 'KRW',
  })
  @IsString()
  currencyCode: string;

  @ApiPropertyOptional({
    type: LanguageUsageDto,
    description: 'Language usage settings',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LanguageUsageDto)
  languageUsage?: LanguageUsageDto;
}

// ==============================================
// Request DTO
// ==============================================

/**
 * SeatAvailability Request DTO
 *
 * Request for seat availability query.
 * Provide either Prime Booking (offer) or Post-Booking (order), not both.
 *
 * @example Prime Booking (Offer-based)
 * {
 *   "transactionId": "8b406338b0bd40bc8c4e0903bf4c5bce",
 *   "offer": {
 *     "responseId": "8b406338b0bd40bc8c4e0903bf4c5bce",
 *     "offerId": "5dda4ab8255d469d84951dff9e0d25b024.1-1",
 *     "owner": "TK"
 *   },
 *   "paxList": [{ "paxId": "PAX1", "ptc": "ADT" }]
 * }
 *
 * @example Post-Booking (Order-based)
 * {
 *   "transactionId": "f3b131c776b04ff2a8bf25375e86593c",
 *   "order": {
 *     "orderId": "TSDEV-20250821-ac2f028769a4c45b"
 *   },
 *   "paxList": [{ "paxId": "PAX1", "ptc": "ADT" }]
 * }
 */
export class SeatAvailabilityRequestDto {
  @ApiProperty({
    description: 'Transaction ID (32-char hex, generated by FE)',
    example: '8b406338b0bd40bc8c4e0903bf4c5bce',
  })
  @IsString()
  @Matches(/^[a-f0-9]{32}$/i, {
    message: 'Transaction ID must be 32-character hex string',
  })
  transactionId: string;

  @ApiPropertyOptional({
    type: SenderDto,
    description: 'Optional - uses environment variables if not provided',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SenderDto)
  sender?: SenderDto;

  @ApiPropertyOptional({
    type: OfferRefDto,
    description: 'Offer reference for Prime Booking (WF_PB_SEAT)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OfferRefDto)
  offer?: OfferRefDto;

  @ApiPropertyOptional({
    type: OrderRefDto,
    description: 'Order reference for Post-Booking (WF_HELD_SEAT, WF_TKT_SEAT)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderRefDto)
  order?: OrderRefDto;

  @ApiProperty({
    type: [PaxCodeDto],
    description: 'Passenger list',
    example: [{ paxId: 'PAX1', ptc: 'ADT' }],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaxCodeDto)
  paxList: PaxCodeDto[];

  @ApiPropertyOptional({
    type: CommonCriteriaDto,
    description: 'Search criteria (direct, airline preference, contract fare, promotion, special fare, existing order reference)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommonCriteriaDto)
  criteria?: CommonCriteriaDto;

  @ApiPropertyOptional({
    type: CommonResponseParameterDto,
    description: 'Response settings (currency, language)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommonResponseParameterDto)
  responseParameter?: CommonResponseParameterDto;
}

// ==============================================
// Response DTO (for reference)
// ==============================================

/**
 * SeatAvailability Response DTO
 *
 * Returns the raw PolarHub API response as-is.
 * No response transformation is performed.
 */
export class SeatAvailabilityResponseDto {
  @ApiPropertyOptional({
    description: 'Result message containing status and errors',
  })
  resultMessage?: {
    code: string;
    message?: string;
    messageDetail?: {
      errors?: Array<{ owner?: string; message?: string; code?: string }>;
      warnings?: Array<{ owner?: string; message?: string; code?: string }>;
    };
  };

  @ApiPropertyOptional({
    description: 'Transaction ID echoed from request',
  })
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Response ID for subsequent API calls',
  })
  responseId?: string;

  @ApiPropertyOptional({
    description: 'A La Carte Offer containing seat options',
  })
  aLaCarteOffer?: {
    offerId: string;
    owner: string;
    validatingCarrier?: string;
    totalItemQuantity?: number;
    aLaCarteOfferItem?: unknown[];
  };

  @ApiPropertyOptional({
    description: 'Data lists containing reference data',
  })
  dataLists?: unknown;
}
````

## File 22: service-list.dto.ts
**Path**: `src/lib/polarhub/dto/service-list.dto.ts`
````typescript
/**
 * ServiceList API DTO
 *
 * Request/Response DTOs for the ancillary service list API.
 * OpenAPI spec: spec/polarhub.openapi.json (ServiceListRQ21, ServiceListRS22)
 *
 * Supported workflows:
 * - WF_PB_SERVICE: Prime Booking with service selection
 * - WF_PB_SEAT_SERVICE: Prime Booking with seat + service selection
 * - WF_HELD_SERVICE: Add service to held booking
 * - WF_TKT_SERVICE: Add service after ticketing
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==============================================
// Nested DTOs
// ==============================================

/**
 * TravelAgency DTO
 */
export class TravelAgencyDto {
  @ApiProperty({ description: 'Agency ID (Tenant ID)', example: 'YOUR_TENANT_ID' })
  @IsString()
  @IsNotEmpty()
  agencyId: string;

  @ApiPropertyOptional({ description: 'Site code', example: '01' })
  @IsOptional()
  @IsString()
  siteCode?: string;

  @ApiPropertyOptional({ description: 'Agency name' })
  @IsOptional()
  @IsString()
  agencyName?: string;

  @ApiPropertyOptional({
    description: 'Contact info reference IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactInfoRefId?: string[];
}

/**
 * Sender DTO
 */
export class SenderDto {
  @ApiProperty({ description: 'Travel agency information' })
  @ValidateNested()
  @Type(() => TravelAgencyDto)
  travelAgency: TravelAgencyDto;
}

/**
 * HMAC Auth Headers DTO
 */
export class FEAuthHeadersDto {
  @ApiPropertyOptional({
    description: 'x-date header (RFC1123)',
    example: 'Thu, 16 Jan 2026 06:51:52 GMT',
  })
  @IsOptional()
  @IsString()
  'x-date'?: string;

  @ApiPropertyOptional({
    description: 'Digest header (SHA-512)',
    example: 'SHA-512={base64_hash}',
  })
  @IsOptional()
  @IsString()
  Digest?: string;

  @ApiPropertyOptional({
    description: 'Authorization header (HMAC)',
    example: 'hmac username="...", algorithm="hmac-sha512", headers="x-date digest", signature="..."',
  })
  @IsOptional()
  @IsString()
  Authorization?: string;
}

/**
 * LoyaltyProgramAccount DTO
 */
export class LoyaltyProgramAccountDto {
  @ApiPropertyOptional({
    description: 'Loyalty program account number',
    example: '1070199873',
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({
    description: 'Loyalty program code',
    example: 'FB',
  })
  @IsOptional()
  @IsString()
  programCode?: string;

  @ApiPropertyOptional({
    description: 'Loyalty program name',
    example: 'Miles',
  })
  @IsOptional()
  @IsString()
  programName?: string;

  @ApiPropertyOptional({ description: 'Sign-in ID' })
  @IsOptional()
  @IsString()
  signInId?: string;

  @ApiPropertyOptional({ description: 'Tier code' })
  @IsOptional()
  @IsString()
  tierCode?: string;

  @ApiPropertyOptional({ description: 'Tier name' })
  @IsOptional()
  @IsString()
  tierName?: string;
}

/**
 * Pax (Passenger) DTO for ServiceList
 * Per OpenAPI: PaxID, Ptc required
 */
export class PaxDto {
  @ApiProperty({
    description: 'Unique passenger identifier',
    example: 'PAX1',
  })
  @IsString()
  @IsNotEmpty()
  paxId: string;

  @ApiProperty({
    description: 'Passenger type code (ADT/CHD/INF)',
    example: 'ADT',
  })
  @IsString()
  @IsNotEmpty()
  ptc: string;

  @ApiPropertyOptional({
    description: 'Passenger date of birth (ISO8601)',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Reference passenger ID',
    example: 'PAX1',
  })
  @IsOptional()
  @IsString()
  paxRefId?: string;

  @ApiPropertyOptional({
    description: 'Loyalty program accounts (FFN)',
    type: [LoyaltyProgramAccountDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoyaltyProgramAccountDto)
  loyaltyProgramAccount?: LoyaltyProgramAccountDto[];
}

/**
 * OfferItem DTO
 */
export class OfferItemDto {
  @ApiProperty({
    description: 'Offer item ID',
    example: '1d95235ebd044f31b36d62e708ddecdc24.1-1-1',
  })
  @IsString()
  @IsNotEmpty()
  offerItemId: string;

  @ApiPropertyOptional({
    description: 'Passenger reference IDs',
    type: [String],
    example: ['PAX1', 'PAX2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxRefId?: string[];

  @ApiPropertyOptional({
    description: 'Segment reference IDs',
    type: [String],
    example: ['SEG1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxSegmentRefId?: string[];
}

/**
 * Offer DTO for Prime Booking ServiceList
 * Per OpenAPI: ResponseID, OfferID, Owner required
 */
export class OfferDto {
  @ApiProperty({
    description: 'Search response ID',
    example: '2db03454253b43c8baf0df7a3b9cfb9a',
  })
  @IsString()
  @IsNotEmpty()
  responseId: string;

  @ApiProperty({
    description: 'Offer ID',
    example: '1d95235ebd044f31b36d62e708ddecdc24.1-1',
  })
  @IsString()
  @IsNotEmpty()
  offerId: string;

  @ApiProperty({
    description: 'Offer owner (airline code)',
    example: 'TK',
  })
  @IsString()
  @IsNotEmpty()
  owner: string;

  @ApiPropertyOptional({
    description: 'Offer items (required for some airlines)',
    type: [OfferItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfferItemDto)
  offerItems?: OfferItemDto[];
}

/**
 * OrderItem DTO for Post-Booking ServiceList
 */
export class OrderItemDto {
  @ApiProperty({
    description: 'Order item ID',
    example: 'FL_P1',
  })
  @IsString()
  @IsNotEmpty()
  orderItemId: string;

  @ApiPropertyOptional({
    description: 'Passenger reference IDs',
    type: [String],
    example: ['PAX_1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paxRefId?: string[];
}

/**
 * Order DTO for Post-Booking ServiceList
 */
export class OrderDto {
  @ApiProperty({
    description: 'Order ID',
    example: 'TSDEV-20250821-7bb482f96fe0a2f9',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({
    description: 'Order items (required for some airlines)',
    type: [OrderItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems?: OrderItemDto[];
}

/**
 * ProgramCriteria DTO
 */
export class ProgramCriteriaDto {
  @ApiProperty({
    description: 'Airline code',
    example: 'AF',
  })
  @IsString()
  @IsNotEmpty()
  airlineId: string;

  @ApiPropertyOptional({ description: 'Contract ID' })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiPropertyOptional({
    description: 'Account IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accountId?: string[];

  @ApiPropertyOptional({ description: 'Type code' })
  @IsOptional()
  @IsString()
  typeCode?: string;
}

/**
 * SpecialFareCriteria DTO
 */
export class SpecialFareCriteriaDto {
  @ApiProperty({
    description: 'Airline code',
    example: 'AF',
  })
  @IsString()
  @IsNotEmpty()
  airlineId: string;

  @ApiPropertyOptional({ description: 'Account ID' })
  @IsOptional()
  @IsString()
  accountId?: string;
}

/**
 * ExistingOrderCriteria DTO
 */
export class ExistingOrderCriteriaDto {
  @ApiProperty({
    description: 'Existing order ID',
    example: 'TSDEV-20250101-abc123',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Passenger reference IDs',
    type: [String],
    example: ['PAX1'],
  })
  @IsArray()
  @IsString({ each: true })
  paxRefId: string[];
}

/**
 * Criteria DTO for special fare/program conditions
 */
export class CriteriaDto {
  @ApiPropertyOptional({
    description: 'Program criteria for applying specific programs',
    type: [ProgramCriteriaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramCriteriaDto)
  programCriteria?: ProgramCriteriaDto[];

  @ApiPropertyOptional({
    description: 'Special fare criteria',
    type: [SpecialFareCriteriaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialFareCriteriaDto)
  specialFareCriteria?: SpecialFareCriteriaDto[];

  @ApiPropertyOptional({
    description: 'Existing order criteria (for Post-Booking)',
    type: ExistingOrderCriteriaDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExistingOrderCriteriaDto)
  existingOrderCriteria?: ExistingOrderCriteriaDto;
}

/**
 * LanguageUsage DTO
 */
export class LanguageUsageDto {
  @ApiProperty({
    description: 'Language code',
    example: 'ko',
  })
  @IsString()
  @IsNotEmpty()
  langCode: string;

  @ApiPropertyOptional({
    description: 'Language usage type',
    example: 'written',
  })
  @IsOptional()
  @IsString()
  langUsageType?: string;
}

/**
 * ResponseParameter DTO for response settings
 */
export class ResponseParameterDto {
  @ApiProperty({
    description: 'Response currency code (ISO 4217)',
    example: 'KRW',
  })
  @IsString()
  @IsNotEmpty()
  currencyCode: string;

  @ApiPropertyOptional({
    description: 'Language usage settings',
    type: LanguageUsageDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LanguageUsageDto)
  languageUsage?: LanguageUsageDto;
}

// ==============================================
// Request DTO
// ==============================================

/**
 * ServiceList Request DTO
 *
 * Usage:
 * - Prime Booking: Use the offer field (data from AirShopping response)
 * - Post-Booking: Use the order field (data from OrderRetrieve response)
 *
 * CRITICAL: transactionId must be provided by FE!
 */
export class ServiceListRQDto {
  @ApiProperty({
    description: 'Transaction ID (UUID without hyphens) - must be provided by FE',
    example: '2db03454253b43c8baf0df7a3b9cfb9a',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiPropertyOptional({
    description: 'Sender information (optional, uses env vars as fallback)',
    type: SenderDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SenderDto)
  sender?: SenderDto;

  @ApiPropertyOptional({
    description: 'HMAC auth headers from FE (optional, generates if not provided)',
    type: FEAuthHeadersDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FEAuthHeadersDto)
  feAuthHeaders?: FEAuthHeadersDto;

  @ApiPropertyOptional({
    description: 'Point of sale country code',
    example: 'KR',
    default: 'KR',
  })
  @IsOptional()
  @IsString()
  pointOfSale?: string;

  @ApiPropertyOptional({
    description: 'Offer information for Prime Booking (from AirShopping/OfferPrice response)',
    type: OfferDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OfferDto)
  offer?: OfferDto;

  @ApiPropertyOptional({
    description: 'Order information for Post-Booking (from OrderRetrieve response)',
    type: OrderDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderDto)
  order?: OrderDto;

  @ApiProperty({
    description: 'Passenger list',
    type: [PaxDto],
    example: [{ paxId: 'PAX1', ptc: 'ADT' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaxDto)
  paxList: PaxDto[];

  @ApiPropertyOptional({
    description: 'Search criteria (special fare, program, etc.)',
    type: CriteriaDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriteriaDto)
  criteria?: CriteriaDto;

  @ApiPropertyOptional({
    description: 'Response parameters (currency, language)',
    type: ResponseParameterDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResponseParameterDto)
  responseParameter?: ResponseParameterDto;
}

// ==============================================
// Response DTO
// ==============================================

/**
 * Amount DTO
 */
export class AmountDto {
  @ApiProperty({ description: 'Amount value', example: 50000 })
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'KRW' })
  curCode: string;
}

/**
 * UnitPriceDetail DTO
 */
export class UnitPriceDetailDto {
  @ApiProperty({ description: 'Total amount' })
  totalAmount: AmountDto;

  @ApiProperty({ description: 'Total base amount' })
  totalBaseAmount: AmountDto;

  @ApiPropertyOptional({ description: 'Total tax amount' })
  totalTaxAmount?: AmountDto;
}

/**
 * BookingInstructions Response DTO
 */
export class BookingInstructionsRSDto {
  @ApiPropertyOptional({
    description: 'Booking instruction texts',
    type: [String],
    example: ['TTL10KG'],
  })
  text?: string[];

  @ApiPropertyOptional({
    description: 'OSI text patterns',
    type: [String],
    example: ['TTL\\s?%WVAL%KG'],
  })
  ositext?: string[];
}

/**
 * ALaCarteOfferItem Response DTO
 */
export class ALaCarteOfferItemDto {
  @ApiProperty({ description: 'Offer item ID' })
  offerItemId: string;

  @ApiPropertyOptional({ description: 'Passenger reference IDs', type: [String] })
  paxRefId?: string[];

  @ApiPropertyOptional({ description: 'Segment reference IDs', type: [String] })
  paxSegmentRefId?: string[];

  @ApiPropertyOptional({ description: 'Unit price details' })
  unitPriceDetail?: UnitPriceDetailDto;

  @ApiPropertyOptional({ description: 'Service definition reference ID' })
  serviceDefinitionRefId?: string;

  @ApiPropertyOptional({ description: 'Booking instructions' })
  bookingInstructions?: BookingInstructionsRSDto;
}

/**
 * ALaCarteOffer Response DTO
 */
export class ALaCarteOfferDto {
  @ApiProperty({ description: 'Offer ID' })
  offerId: string;

  @ApiProperty({ description: 'Owner airline code' })
  owner: string;

  @ApiPropertyOptional({ description: 'Validating carrier' })
  validatingCarrier?: string;

  @ApiPropertyOptional({ description: 'Total item quantity' })
  totalItemQuantity?: number;

  @ApiPropertyOptional({ description: 'Offer time limit (ISO 8601)' })
  offerTimeLimit?: string;

  @ApiProperty({
    description: 'A la carte offer items',
    type: [ALaCarteOfferItemDto],
  })
  aLaCarteOfferItem: ALaCarteOfferItemDto[];
}

/**
 * ResultMessage DTO
 */
export class ResultMessageDto {
  @ApiProperty({ description: 'Result code', example: '0' })
  code: string;

  @ApiPropertyOptional({ description: 'Result message', example: 'Success' })
  message?: string;

  @ApiPropertyOptional({ description: 'Message details' })
  messageDetail?: {
    errors?: Array<{
      owner?: string;
      message?: string;
      code?: string;
    }>;
    warnings?: Array<{
      owner?: string;
      message?: string;
      code?: string;
    }>;
  };
}

/**
 * ServiceList Response DTO
 *
 * Response data is returned as-is from PolarHub.
 * Raw data is forwarded to FE without transformation.
 */
export class ServiceListRSDto {
  @ApiProperty({ description: 'Transaction ID from request' })
  transactionId: string;

  @ApiPropertyOptional({ description: 'Result message' })
  resultMessage?: ResultMessageDto;

  @ApiPropertyOptional({ description: 'Response ID' })
  responseId?: string;

  @ApiPropertyOptional({
    description: 'A la carte offer (available services)',
    type: ALaCarteOfferDto,
  })
  aLaCarteOffer?: ALaCarteOfferDto;

  @ApiPropertyOptional({
    description: 'Data lists (service definitions, etc.)',
  })
  dataLists?: unknown;

  @ApiPropertyOptional({
    description: 'Recipient information',
  })
  recipient?: unknown;

  @ApiPropertyOptional({
    description: 'Point of sale',
  })
  pointOfSale?: string;
}
````

## File 23: index.ts
**Path**: `src/lib/polarhub/dto/index.ts`
````typescript
/**
 * PolarHub DTO Index
 *
 * Re-exports all DTOs.
 *
 * NOTE: Common types (TravelAgencyDto, SenderDto, etc.) are defined locally
 * in each DTO file, which causes name collisions.
 * Therefore, only API-specific DTOs are explicitly exported.
 */

// ==============================================
// Common DTOs
// ==============================================
export * from './common.dto';

// ==============================================
// AirShopping DTOs
// ==============================================
export {
  AirShoppingRequestDto,
  AirShoppingResponseDto,
  AirlinePreferenceDto,
  CriteriaDto as AirShoppingCriteriaDto,
  LanguageUsageDto as AirShoppingLanguageUsageDto,
  ResponseParameterDto as AirShoppingResponseParameterDto,
} from './air-shopping.dto';

// ==============================================
// OfferPrice DTOs
// ==============================================
export * from './offer-price.dto';

// ==============================================
// OrderCreate DTOs
// ==============================================
export {
  OrderCreateRQDto,
  OrderCreateRSDto,
  OrderDto as OrderCreateOrderDto,
  PaxDto as OrderCreatePaxDto,
  LoyaltyProgramAccountDto,
  PaymentCardMethodDto,
  PaymentAmountDto,
  ResultMessageDetailDto,
  ResultMessageDetailErrorDto,
} from './order-create.dto';

// ==============================================
// OrderRetrieve DTOs
// ==============================================
export {
  OrderRetrieveRQDto,
  OrderRetrieveRSDto,
  BookingRefDto,
  PriceDto,
  CouponInfoDto,
  TicketDocInfoDto,
  OrderChangeNoticeDto,
} from './order-retrieve.dto';

// ==============================================
// OrderCancel DTOs
// ==============================================
export {
  OrderCancelRQDto,
  OrderCancelRSDto,
  CancelledOrderDto,
  RefundInfoDto,
} from './order-cancel.dto';

// ==============================================
// OrderChange DTOs
// ==============================================
export {
  OrderChangeRequestDto,
  OrderChangeResponseDto,
  ChangeOrderChoiceDto,
  AcceptSelectedQuotedOfferListDto,
  AcceptOrderItemListDto,
  AcceptRepricedOrderDto,
  UpdatePaxDto,
  AcceptChangeDto,
  CancelUnpaidOrderDto,
  AcceptCancelledOfferDto,
  SelectedPricedOfferDto,
  ChangeOfferItemDto,
} from './order-change.dto';

// ==============================================
// SeatAvailability DTOs
// ==============================================
export {
  SeatAvailabilityRequestDto,
  SeatAvailabilityResponseDto,
  PaxCodeDto,
  OfferRefDto,
  OfferItemRefDto,
  OrderRefDto,
  OrderItemRefDto,
} from './seat-availability.dto';

// ==============================================
// ServiceList DTOs
// ==============================================
export {
  ServiceListRQDto,
  ServiceListRSDto,
  ALaCarteOfferDto,
  ALaCarteOfferItemDto,
  UnitPriceDetailDto,
  BookingInstructionsRSDto,
  OfferDto as ServiceListOfferDto,
  PaxDto as ServiceListPaxDto,
  LoyaltyProgramAccountDto as ServiceListLoyaltyDto,
} from './service-list.dto';

// ==============================================
// OrderReshop DTOs
// ==============================================
export {
  OrderReshopRQDto,
  OrderReshopRSDto,
  UpdateOrderDto,
  ReshopOrderDto,
  ServiceOrderDto,
  DeleteItemDto,
  AddServiceOrderDto,
  ReshopOfferDto,
  RefundQuoteDto,
  TotalPriceDto,
} from './order-reshop.dto';

// ==============================================
// OrderQuote DTOs
// ==============================================
export {
  OrderQuoteRequestDto,
  OrderQuoteResponseDto,
  SelectedOfferDto,
  QuoteOfferItemDto,
  RepricedOrderIdDto,
  AffectDto,
  FopPromotionDto,
} from './order-quote.dto';
````

## Phase 5 Completion
- [ ] 12 files created
- Report: "📦 Phase 5/7 완료 - DTOs (12 files)"
