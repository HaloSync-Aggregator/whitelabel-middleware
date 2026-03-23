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
