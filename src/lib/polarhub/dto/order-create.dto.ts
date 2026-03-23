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
