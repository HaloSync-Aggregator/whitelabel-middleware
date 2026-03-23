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
