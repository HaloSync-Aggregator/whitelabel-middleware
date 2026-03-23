/**
 * OrderChange Controller
 *
 * NestJS Controller for the PolarHub OrderChange API.
 *
 * Supported 7 change modes:
 * 1. AcceptSelectedQuotedOfferList - Seat/service change, post-ticketing itinerary change
 * 2. AcceptOrderItemList - Hold confirmation (legacy method)
 * 3. AcceptRepricedOrder - Hold itinerary change, delay ticketing
 * 4. UpdatePax - Passenger information change
 * 5. AcceptChange - OCN acceptance
 * 6. ReasonCode='DIV' + UpdatePax - PNR split
 * 7. ReasonCode='104' - Payment timelimit extension (TK only)
 *
 * CRITICAL:
 * - transactionId is provided by FE (pass-through)
 * - Return raw response (no transformation)
 * - All APIs use POST (PolarHub HTTP spec)
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
import { PolarHubService } from '../polarhub.service';
import {
  OrderChangeRequestDto,
  OrderChangeResponseDto,
  SenderDto,
  ChangeOrderChoiceDto,
  RepricedOrderIdDto,
} from '../dto/order-change.dto';

@ApiTags('order-change')
@Controller('polarhub/order-change')
@ApiExtraModels(ChangeOrderChoiceDto)
export class OrderChangeController {
  private readonly logger = new Logger(OrderChangeController.name);

  constructor(private readonly polarHubService: PolarHubService) {}

  /**
   * OrderChange - Booking modification API
   *
   * Supports 7 change modes.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modify a booking order',
    description: `POST-BOOKING booking modification API.

## Supported Modes

### 1. AcceptSelectedQuotedOfferList
- **Purpose**: Seat/service change, voluntary itinerary change after ticketing
- **Workflows**: WF_HELD_SEAT, WF_HELD_SERVICE, WF_TKT_SEAT, WF_TKT_SERVICE, WF_TKT_VOLCHANGE
- **Prerequisite APIs**: OrderQuote, SeatAvailability, ServiceList

### 2. AcceptOrderItemList
- **Purpose**: Hold confirmation (legacy method, some airlines only)
- **Workflow**: WF_HELD_CONFIRM (legacy)
- **Deprecated**: Most airlines use AcceptRepricedOrder

### 3. AcceptRepricedOrder
- **Purpose**: Hold itinerary change, delay ticketing (Hold confirmation)
- **Workflows**: WF_HELD_ITIN, WF_HELD_CONFIRM
- **Prerequisite APIs**: OrderReshop (itinerary change), OrderQuote (delay ticketing)
- **CRITICAL**: Using this for post-ticketing itinerary change causes "INVALID SEGMENT SELECTION" error!

### 4. UpdatePax
- **Purpose**: Passenger information change
- **Workflow**: WF_HELD_PAX
- **Note**: AY, SQ support Add/Delete only (for modify, use Add then Delete order)

### 5. AcceptChange
- **Purpose**: OCN (Operation Change Notification) acceptance
- **Workflow**: WF_TKT_OCN
- **Field**: orderItemRefId (array of OrderItem IDs to accept)

### 6. PNR Split (UpdatePax + ReasonCode='DIV')
- **Purpose**: PNR split
- **Workflow**: WF_HELD_SPLIT
- **Required**: reasonCode='DIV', updatePax[{ newPaxRefId }], paxList

### 7. Payment Timelimit Extension (ReasonCode='104')
- **Purpose**: Payment timelimit extension
- **Supported airlines**: TK only
- **Required**: reasonCode='104', paxList

## Airline-Specific Notes

- **BA**: Travel agency email and postal address required
- **AF, KL**: First OrderChange for itinerary change requires empty PaymentList array
- **AY**: Delay ticketing before issuance requires 2 OrderChange calls (Quote -> Change1 -> Change2)
`,
  })
  @ApiBody({
    type: OrderChangeRequestDto,
    examples: {
      delayTicketingWithoutReshop: {
        summary: '1. Delay ticketing (without Reshop/Quote)',
        description: 'Use OrderID as AcceptRepricedOrder.OfferRefID',
        value: {
          transactionId: 'f3f7b13bcc3b44ad84cea781a82d7f3c',
          orderId: 'TSDEV-20250826-640e6a91ae44f45b',
          changeOrderChoice: {
            acceptRepricedOrder: {
              offerRefId: ['TSDEV-20250826-640e6a91ae44f45b'],
            },
          },
          paymentList: [
            {
              type: 'Cash',
              amount: 2054000,
              curCode: 'KRW',
              orderItemId: ['d7e0e65a-f8ac-4d59-9ddf-e6d24d37fa41'],
              offerItemId: [],
              paxRefId: [],
            },
          ],
        },
      },
      delayTicketingWithQuote: {
        summary: '2. Delay ticketing (using OrderQuote)',
        description: 'Use OfferID from OrderQuote as AcceptRepricedOrder.OfferRefID',
        value: {
          transactionId: 'a432171b8f59443ca35b4009b30f9275',
          orderId: 'TSDEV-20250826-d4a759f3bb8c7d5b',
          changeOrderChoice: {
            acceptRepricedOrder: {
              offerRefId: ['ab0411741d57474b9d8324545080d4b218.1-1'],
            },
          },
          paymentList: [
            {
              type: 'Cash',
              amount: 1175600,
              curCode: 'KRW',
              orderItemId: [],
              offerItemId: [],
              paxRefId: [],
            },
          ],
        },
      },
      addSeatForHeldBooking: {
        summary: '3. Add seat to Hold booking',
        description: 'SeatAvailability -> OrderChange (empty PaymentList array)',
        value: {
          transactionId: '788992e61fdf4a098e5ee1ae077b79fc',
          orderId: 'TSDEV-20250821-5a2f478a9574609b',
          changeOrderChoice: {
            acceptSelectedQuotedOfferList: {
              selectedPricedOffer: [
                {
                  offerId: '80ddc154cb1e43eeb08ce256f6aea94221.3-1',
                  owner: 'AY',
                  responseId: 'TSDEV-20250821-5a2f478a9574609b',
                  offerItems: [
                    {
                      offerItemId: '80ddc154cb1e43eeb08ce256f6aea94221.3-1-1',
                      paxRefId: ['PAX2'],
                      seatSelection: {
                        column: 'K',
                        row: '37',
                      },
                    },
                  ],
                },
              ],
            },
          },
          paymentList: [],
        },
      },
      addPaidSeat: {
        summary: '4. Add paid seat',
        description: 'SeatAvailability -> OrderQuote -> OrderChange',
        value: {
          transactionId: '9425c9252eed4a0990d1a1c8c2bda98b',
          orderId: 'TSDEV-20250821-d4bc7a9a4627472a',
          changeOrderChoice: {
            acceptSelectedQuotedOfferList: {
              selectedPricedOffer: [
                {
                  offerId: 'c421a29629b342e88cd732fd2fb4ca0d21.3-1',
                  owner: 'HAA',
                  offerItems: [
                    {
                      offerItemId: 'c421a29629b342e88cd732fd2fb4ca0d21.3-1-7',
                      paxRefId: ['PAXD6641'],
                      seatSelection: {
                        column: 'G',
                        row: '18',
                      },
                    },
                  ],
                },
              ],
            },
          },
          paymentList: [
            {
              type: 'Cash',
              amount: 90000,
              curCode: 'KRW',
              orderItemId: [],
              offerItemId: [],
              paxRefId: [],
            },
          ],
        },
      },
      addPaidService: {
        summary: '5. Add paid service (baggage, etc.)',
        description: 'ServiceList -> OrderQuote -> OrderChange',
        value: {
          transactionId: 'e61fd9fb0b9340a2a94043fbabf7c541',
          orderId: 'TSDEV-20250821-2fa9dd92a3c2ecf1',
          changeOrderChoice: {
            acceptSelectedQuotedOfferList: {
              selectedPricedOffer: [
                {
                  offerId: '6002f19cffa24244bcbd0e7be026f6d224.1-1',
                  owner: 'TK',
                  offerItems: [
                    {
                      offerItemId: '6002f19cffa24244bcbd0e7be026f6d224.1-1-1',
                      paxRefId: ['PAX_1'],
                      bookingInstructions: {
                        text: ['TTL10KG'],
                        ositext: [],
                      },
                    },
                  ],
                },
              ],
            },
          },
          paymentList: [
            {
              type: 'Cash',
              amount: 463100,
              curCode: 'KRW',
              orderItemId: [],
              offerItemId: ['6002f19cffa24244bcbd0e7be026f6d224.1-1-1'],
              paxRefId: [],
            },
          ],
        },
      },
      paymentTimelimitExtension: {
        summary: '6. Payment timelimit extension (TK only)',
        description: 'Uses ReasonCode=104',
        value: {
          transactionId: '4c55f84411af4248a4bc131c87fdea27',
          orderId: 'TSDEV-20250822-8c8914187bbd041a',
          reasonCode: '104',
          changeOrderChoice: {},
          paxList: [
            {
              paxId: 'PAX_1',
              ptc: 'ADT',
            },
          ],
        },
      },
      pnrSplit: {
        summary: '7. PNR Split',
        description: 'ReasonCode=DIV + UpdatePax',
        value: {
          transactionId: '9fc7f4f2ae4a49a89a04c370ea5d1a09',
          orderId: 'TSDEV-20250825-dfb4403c234c13b2',
          reasonCode: 'DIV',
          changeOrderChoice: {
            updatePax: [
              {
                newPaxRefId: 'PAX4',
              },
            ],
          },
          paxList: [
            {
              paxId: 'PAX4',
              ptc: 'ADT',
              individual: {
                individualId: 'PAX4',
                birthdate: '1997-01-01',
                gender: 'MALE',
                nameTitle: 'MR',
                givenName: ['PHIL'],
                middleName: [],
                surname: 'RATKE',
              },
              contactInfoRefId: ['CTCPAX4_1', 'CTCPAX4_2'],
              identityDoc: [
                {
                  identityDocumentNumber: 'M32970975',
                  identityDocumentType: 'PT',
                  issuingCountryCode: 'KR',
                  citizenshipCountryCode: 'KR',
                  expiryDate: '2028-11-25',
                  gender: 'MALE',
                  givenName: ['PHIL'],
                  middleName: [],
                  surname: 'RATKE',
                },
              ],
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order changed successfully - returns raw PolarHub response',
    type: OrderChangeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async changeOrder(
    @Body() request: OrderChangeRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OrderChangeResponseDto> {
    // Identify change type
    const changeType = this.getChangeType(request);

    // Request logging
    this.logger.log({
      message: 'OrderChange request received',
      transactionId: request.transactionId,
      orderId: request.orderId,
      changeType,
      reasonCode: request.reasonCode,
      hasPaxList: !!(request.paxList && request.paxList.length > 0),
      hasPaymentList: !!(request.paymentList && request.paymentList.length > 0),
      hasContactInfoList: !!(
        request.contactInfoList && request.contactInfoList.length > 0
      ),
    });

    // Transform parameters for service call
    const result = await this.polarHubService.changeOrder({
      transactionId: request.transactionId,
      sender: this.transformSender(request.sender),
      pointOfSale: request.pointOfSale,
      orderId: request.orderId,
      reasonCode: request.reasonCode,
      // repricedOrderId (for delay ticketing - maps to Query.RepricedOrderID)
      repricedOrderId: request.repricedOrderId
        ? this.transformRepricedOrderId(request.repricedOrderId)
        : undefined,
      // changeOrderChoice (existing method)
      changeOrderChoice: request.changeOrderChoice
        ? this.transformChangeOrderChoice(request.changeOrderChoice)
        : {},
      paxList: request.paxList
        ? this.transformPaxList(request.paxList)
        : undefined,
      paymentList: request.paymentList
        ? this.transformPaymentList(request.paymentList)
        : undefined,
      contactInfoList: request.contactInfoList
        ? this.transformContactInfoList(request.contactInfoList)
        : undefined,
      // Criteria (full CriteriaType4)
      ...(request.criteria && { criteria: request.criteria }),
      // ResponseParameter
      ...(request.responseParameter && { responseParameter: request.responseParameter }),
    });

    // Set response header
    res.setHeader('X-Transaction-Id', result.transactionId);

    // Return raw response (no transformation!)
    return {
      transactionId: result.transactionId,
      response: result.response,
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Identify change type
   */
  private getChangeType(request: OrderChangeRequestDto): string {
    const choice = request.changeOrderChoice;

    if (request.reasonCode === 'DIV') return 'PNR_SPLIT';
    if (request.reasonCode === '104') return 'PAYMENT_TIMELIMIT_EXTENSION';
    // Delay ticketing: direct use of repricedOrderId
    if (request.repricedOrderId) return 'RepricedOrderID';
    // Check existing methods
    if (choice?.acceptSelectedQuotedOfferList)
      return 'AcceptSelectedQuotedOfferList';
    if (choice?.acceptOrderItemList) return 'AcceptOrderItemList';
    if (choice?.acceptRepricedOrder) return 'AcceptRepricedOrder';
    if (choice?.updatePax) return 'UpdatePax';
    if (choice?.acceptChange) return 'AcceptChange';
    if (choice?.cancelUnpaidOrder) return 'CancelUnpaidOrder';
    if (choice?.acceptCancelledOffer) return 'AcceptCancelledOffer';

    return 'Unknown';
  }

  /**
   * Transform RepricedOrderId (camelCase -> Service param)
   * For delay ticketing - maps to Query.RepricedOrderID
   */
  private transformRepricedOrderId(repricedOrderId: RepricedOrderIdDto) {
    return {
      orderId: repricedOrderId.orderId,
      orderItemRefId: repricedOrderId.orderItemRefId,
    };
  }

  /**
   * Transform Sender (camelCase -> Service param)
   */
  private transformSender(sender?: SenderDto) {
    if (!sender) return undefined;

    return {
      travelAgency: {
        agencyId: sender.travelAgency.agencyId,
        siteCode: sender.travelAgency.siteCode,
        agencyName: sender.travelAgency.agencyName,
        contactInfoRefId: sender.travelAgency.contactInfoRefId,
      },
    };
  }

  /**
   * Transform ChangeOrderChoice
   */
  private transformChangeOrderChoice(choice: ChangeOrderChoiceDto) {
    const result: Record<string, unknown> = {};

    // 1. AcceptSelectedQuotedOfferList
    if (choice.acceptSelectedQuotedOfferList) {
      result.acceptSelectedQuotedOfferList = {
        selectedPricedOffer:
          choice.acceptSelectedQuotedOfferList.selectedPricedOffer.map((o) => ({
            offerId: o.offerId,
            owner: o.owner,
            responseId: o.responseId,
            offerItems: o.offerItems.map((item) => ({
              offerItemId: item.offerItemId,
              paxRefId: item.paxRefId,
              seatSelection: item.seatSelection
                ? {
                    column: item.seatSelection.column,
                    row: item.seatSelection.row,
                  }
                : undefined,
              bookingInstructions: item.bookingInstructions
                ? {
                    text: item.bookingInstructions.text,
                    ositext: item.bookingInstructions.ositext,
                  }
                : undefined,
            })),
          })),
      };
    }

    // 2. AcceptOrderItemList
    if (choice.acceptOrderItemList) {
      result.acceptOrderItemList = {
        owner: choice.acceptOrderItemList.owner,
        offerItemRefId: choice.acceptOrderItemList.offerItemRefId,
      };
    }

    // 3. AcceptRepricedOrder
    if (choice.acceptRepricedOrder) {
      result.acceptRepricedOrder = {
        offerRefId: choice.acceptRepricedOrder.offerRefId,
      };
    }

    // 4. UpdatePax
    if (choice.updatePax) {
      result.updatePax = choice.updatePax.map((p) => ({
        currentPaxRefId: p.currentPaxRefId,
        newPaxRefId: p.newPaxRefId,
      }));
    }

    // 5. AcceptChange
    if (choice.acceptChange) {
      result.acceptChange = {
        orderItemRefId: choice.acceptChange.orderItemRefId,
      };
    }

    return result;
  }

  /**
   * Transform PaxList
   *
   * NOTE: PaxList in OrderChange is used for various purposes:
   * - PNR Split: Full passenger information (individual required)
   * - Payment Timelimit Extension: Only paxId, ptc needed (no individual)
   * - Passenger information change: Only changed information is passed
   *
   * Service's PaxDetailParam requires individual as mandatory,
   * but in OrderChange it can be optional depending on the use case, hence type assertion is used
   */
  private transformPaxList(paxList: OrderChangeRequestDto['paxList']) {
    if (!paxList) return undefined;

    return paxList.map((pax) => {
      // When individual is absent (e.g., Payment Timelimit Extension)
      // Pass empty object or minimal info so that the Service can handle it
      const individual = pax.individual
        ? {
            nameTitle: pax.individual.nameTitle,
            givenName: pax.individual.givenName,
            surname: pax.individual.surname,
            birthdate: pax.individual.birthdate,
            gender: pax.individual.gender,
          }
        : {
            // Minimum required fields (to satisfy Service type constraints)
            givenName: [] as string[],
            surname: '',
            birthdate: '',
          };

      return {
        paxId: pax.paxId,
        ptc: pax.ptc,
        individual,
        identityDoc: pax.identityDoc
          ? pax.identityDoc.map((doc) => ({
              identityDocType: doc.identityDocumentType,
              identityDocId: doc.identityDocumentNumber,
              expiryDate: doc.expiryDate,
              issuingCountryCode: doc.issuingCountryCode,
              citizenshipCountryCode: doc.citizenshipCountryCode,
            }))
          : undefined,
        contactInfoRefId: pax.contactInfoRefId,
      };
    });
  }

  /**
   * Transform PaymentList
   * Convert DTO's simplified structure to Service structure
   *
   * CRITICAL: Must set the appropriate paymentMethod based on type
   * - Cash -> cash: { cashPaymentInd: true }
   * - Ag -> agentDeposit: { agentDepositId: '' }
   * - Card -> card: { ... } (extend when card details are needed)
   */
  private transformPaymentList(
    paymentList: OrderChangeRequestDto['paymentList'],
  ) {
    if (!paymentList) return undefined;

    return paymentList.map((p) => ({
      paymentMethod: {
        cash: p.type === 'Cash' ? { cashPaymentInd: true } : undefined,
        agentDeposit: p.type === 'Ag' ? { agentDepositId: '' } : undefined,
        // Card requires detailed card information (cardNumber, cardHolderName, etc.)
        // Needs implementation after DTO extension
      },
      amount: {
        currencyCode: p.curCode,
        amount: p.amount,
      },
      orderItemId: p.orderItemId,
      offerItemId: p.offerItemId,
      paxRefId: p.paxRefId,
    }));
  }

  /**
   * Transform ContactInfoList
   */
  private transformContactInfoList(
    contactInfoList: OrderChangeRequestDto['contactInfoList'],
  ) {
    if (!contactInfoList) return undefined;

    return contactInfoList.map((ci) => ({
      contactInfoId: ci.contactInfoId,
      emailAddress: ci.emailAddress ? ci.emailAddress[0] : undefined, // array -> single value
      phone: ci.phone && ci.phone.length > 0 ? ci.phone[0] : undefined, // array -> single value
      postalAddress:
        ci.postalAddress && ci.postalAddress.length > 0
          ? ci.postalAddress[0]
          : undefined, // array -> single value
    }));
  }
}