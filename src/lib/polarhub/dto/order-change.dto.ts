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
