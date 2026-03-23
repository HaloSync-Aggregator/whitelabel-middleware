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
