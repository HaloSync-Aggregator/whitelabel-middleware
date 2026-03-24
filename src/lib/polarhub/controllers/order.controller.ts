/**
 * Order Controller
 *
 * Unified controller for OrderCreate, OrderRetrieve, and OrderCancel APIs.
 *
 * CRITICAL:
 * - All APIs use POST method (PolarHub HTTP spec)
 * - transactionId must be provided by FE (middleware generation forbidden!)
 * - ContactInfo: Pass through as-is from FE (no data concatenation/modification)
 * - No hardcoding (CitizenshipCountryCode, etc.)
 *
 * ContactInfoRefID auto-injection (added 2026-01-21):
 * - sender.travelAgency.contactInfoRefId is forcefully injected from env var (POLARHUB_AGENCY_CONTACT_ID)
 * - If FE does not provide sender: Default sender is auto-generated based on env vars
 * - Even if FE provides sender: Only contactInfoRefId is forcefully replaced with env var value
 * - This ensures Travel Agency ContactInfo (CTC_TA1) is always included
 */

import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { PolarHubService } from '../polarhub.service';
import { OrderCreateRQDto } from '../dto/order-create.dto';
import { OrderRetrieveRQDto } from '../dto/order-retrieve.dto';
import { OrderCancelRQDto } from '../dto/order-cancel.dto';

@ApiTags('PolarHub - Order')
@Controller('polarhub/order')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly polarHubService: PolarHubService) {}

  // ==============================================
  // OrderCreate - POST /middleware/polarhub/order
  // ==============================================

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Order (Booking)',
    description: `
## Overview
OrderCreate API is used to process flight booking and ticket issuance.

## Ticketing Modes
- **Deferred Ticketing**: Booking only, ticketing later (no PaymentList)
- **Instant Ticketing**: Booking and issuing immediately (with PaymentList)

## Form of Payment
- **BSP Cash**: All airlines (except TR)
- **BSP Credit Card**: HA, KE
- **Agent Deposit**: TR only

## Required ContactInfo
Some airlines require Travel Agency contact info:
- **BA**: Email, PostalAddress
- **AF/KL**: Email, Phone

## Important Notes
- TransactionID must be same as OfferPrice
- BA US routes: Passport & PostalAddress required
- HA/KE: IssuingCountryCode required in IdentityDoc
    `,
  })
  @ApiBody({ type: OrderCreateRQDto })
  @ApiResponse({
    status: 200,
    description: 'Order created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid request format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - HMAC authentication failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
  })
  async createOrder(@Body() request: OrderCreateRQDto) {
    this.logger.log(
      `[OrderCreate] transactionId=${request.transactionId}, orders=${request.orders.length}, paxList=${request.paxList.length}`,
    );

    try {
      const { transactionId, response } = await this.polarHubService.createOrder({
        transactionId: request.transactionId,
        pointOfSale: request.pointOfSale,
        sender: request.sender
          ? {
              travelAgency: {
                agencyId: request.sender.travelAgency.agencyId,
                siteCode: request.sender.travelAgency.siteCode,
                agencyName: request.sender.travelAgency.agencyName,
                contactInfoRefId: request.sender.travelAgency.contactInfoRefId,
              },
            }
          : undefined,

        // Orders (Offer Selection)
        orders: request.orders.map((order) => ({
          responseId: order.responseId,
          offerId: order.offerId,
          owner: order.owner,
          offerItems: order.offerItems.map((item) => ({
            offerItemId: item.offerItemId,
            paxRefId: item.paxRefId,
            seatSelection: item.seatSelection,
            bookingInstructions: item.bookingInstructions,
          })),
        })),

        // Passengers
        paxList: request.paxList.map((pax) => ({
          paxId: pax.paxId,
          ptc: pax.ptc,
          individual: {
            nameTitle: pax.individual.nameTitle,
            givenName: pax.individual.givenName,
            surname: pax.individual.surname,
            birthdate: pax.individual.birthdate,
            gender: pax.individual.gender,
          },
          identityDoc: pax.identityDoc?.map((doc) => ({
            identityDocType: doc.identityDocType,
            identityDocId: doc.identityDocId,
            expiryDate: doc.expiryDate,
            issuingCountryCode: doc.issuingCountryCode,
            citizenshipCountryCode: doc.citizenshipCountryCode,
          })),
          contactInfoRefId: pax.contactInfoRefId,
          citizenshipCountryCode: pax.citizenshipCountryCode,
          residenceCountryCode: pax.residenceCountryCode,
        })),

        // ContactInfo (pass-through, no modification! Optional - env var fallback if omitted)
        contactInfoList: request.contactInfoList?.map((ci) => ({
          contactInfoId: ci.contactInfoId,
          emailAddress: ci.emailAddress,
          phone: ci.phone
            ? {
                phoneNumber: ci.phone.phoneNumber,
                countryDialingCode: ci.phone.countryDialingCode,
                label: ci.phone.label,
              }
            : undefined,
          postalAddress: ci.postalAddress
            ? {
                street: ci.postalAddress.street,
                cityName: ci.postalAddress.cityName,
                postalCode: ci.postalAddress.postalCode,
                countryCode: ci.postalAddress.countryCode,
              }
            : undefined,
        })),

        // Payment (optional for deferred ticketing)
        paymentList: request.paymentList?.map((p) => ({
          paymentMethod: {
            cash: p.paymentMethod.cash,
            card: p.paymentMethod.card,
            agentDeposit: p.paymentMethod.agentDeposit,
          },
          amount: {
            currencyCode: p.amount.currencyCode,
            amount: p.amount.amount,
          },
          orderItemId: p.orderItemId,
          offerItemId: p.offerItemId,
          paxRefId: p.paxRefId,
        })),
      });

      this.logger.log(
        `[OrderCreate] Success - transactionId=${transactionId}`,
      );

      // Return raw response with transactionId
      return {
        transactionId,
        ...response,
      };
    } catch (error) {
      this.logger.error(
        `[OrderCreate] Failed - transactionId=${request.transactionId}, error=${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  // ==============================================
  // OrderRetrieve - POST /middleware/polarhub/order/retrieve
  // ==============================================

  @Post('retrieve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve Order (Get Booking Details)',
    description: `
## Overview
OrderRetrieve API is used to get booking details by Order ID.

## Usage
- Retrieve booking status and details
- Check ticket numbers
- View payment status

## Important Notes
- TransactionID should be new for Post-Booking operations
- Same TransactionID should be used within a Post-Booking workflow
    `,
  })
  @ApiBody({ type: OrderRetrieveRQDto })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
  })
  async retrieveOrder(@Body() request: OrderRetrieveRQDto) {
    this.logger.log(
      `[OrderRetrieve] transactionId=${request.transactionId}, orderId=${request.orderId}`,
    );

    try {
      const { transactionId, response } = await this.polarHubService.getOrder({
        transactionId: request.transactionId,
        pointOfSale: request.pointOfSale,
        sender: request.sender
          ? {
              travelAgency: {
                agencyId: request.sender.travelAgency.agencyId,
                siteCode: request.sender.travelAgency.siteCode,
                agencyName: request.sender.travelAgency.agencyName,
                contactInfoRefId: request.sender.travelAgency.contactInfoRefId,
              },
            }
          : undefined,
        orderId: request.orderId,
      });

      this.logger.log(
        `[OrderRetrieve] Success - transactionId=${transactionId}`,
      );

      // Return raw response with transactionId
      return {
        transactionId,
        ...response,
      };
    } catch (error) {
      this.logger.error(
        `[OrderRetrieve] Failed - transactionId=${request.transactionId}, orderId=${request.orderId}, error=${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  // ==============================================
  // OrderCancel - POST /middleware/polarhub/order/cancel
  // ==============================================

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel Order (Cancel Booking)',
    description: `
## Overview
OrderCancel API is used to cancel a booking.

## Cancel Types
- **Full Cancel**: Cancel entire booking (no OrderItemRefID)
- **Partial Cancel**: Cancel specific items (with OrderItemRefID)
- **Pax Cancel**: Cancel specific passengers (with PaxRefID)

## Important Notes
- Hold bookings: Can be cancelled without fee
- Ticketed bookings: May require OrderReshop first for refund calculation
    `,
  })
  @ApiBody({ type: OrderCancelRQDto })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
  })
  async cancelOrder(@Body() request: OrderCancelRQDto) {
    this.logger.log(
      `[OrderCancel] transactionId=${request.transactionId}, orderId=${request.orderId}`,
    );

    try {
      const { transactionId, response } = await this.polarHubService.cancelOrder({
        transactionId: request.transactionId,
        pointOfSale: request.pointOfSale,
        sender: request.sender
          ? {
              travelAgency: {
                agencyId: request.sender.travelAgency.agencyId,
                siteCode: request.sender.travelAgency.siteCode,
                agencyName: request.sender.travelAgency.agencyName,
                contactInfoRefId: request.sender.travelAgency.contactInfoRefId,
              },
            }
          : undefined,
        orderId: request.orderId,
        orderItemRefId: request.orderItemRefId,
        paxRefId: request.paxRefId,
      });

      this.logger.log(
        `[OrderCancel] Success - transactionId=${transactionId}`,
      );

      // Return raw response with transactionId
      return {
        transactionId,
        ...response,
      };
    } catch (error) {
      this.logger.error(
        `[OrderCancel] Failed - transactionId=${request.transactionId}, orderId=${request.orderId}, error=${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}