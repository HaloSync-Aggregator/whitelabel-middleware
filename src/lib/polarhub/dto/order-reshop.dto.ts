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
