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
