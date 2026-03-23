/**
 * ServiceList Controller
 *
 * NestJS Controller for the ancillary service inquiry API.
 *
 * Supported workflows:
 * - WF_PB_SERVICE: Prime Booking with services
 * - WF_PB_SEAT_SERVICE: Prime Booking with seat + services
 * - WF_HELD_SERVICE: Add services while in Hold status
 * - WF_TKT_SERVICE: Add services after ticketing
 *
 * Available services:
 * - Baggage: AF, EK, KL, LH, LX(LH), OS(LH), SQ, TR
 * - Seat Upgrade: LH, LX(LH), OS(LH)
 * - FFN (Loyalty): AF, KL
 *
 * CRITICAL:
 * - transactionId is provided by FE (pass-through)
 * - All APIs use POST method
 * - Response data is returned as-is without transformation
 */

import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PolarHubService } from '../polarhub.service';
import { ServiceListRQDto, ServiceListRSDto } from '../dto/service-list.dto';

@ApiTags('PolarHub - ServiceList')
@Controller('polarhub/service-list')
export class ServiceListController {
  private readonly logger = new Logger(ServiceListController.name);

  constructor(private readonly polarHubService: PolarHubService) {}

  /**
   * ServiceList - Ancillary service inquiry
   *
   * Supports both Prime Booking (Offer) and Post-Booking (Order).
   *
   * @param request ServiceListRQDto
   * @returns ServiceListRSDto
   */
  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'ServiceList - Ancillary service inquiry',
    description: `
## Overview
Retrieves the list of ancillary services.

## Usage
### Prime Booking (Offer-based)
Query services using offer information from the AirShopping response:
\`\`\`json
{
  "transactionId": "...",
  "offer": {
    "responseId": "from_air_shopping",
    "offerId": "from_air_shopping",
    "owner": "SQ",
    "offerItems": [{ "offerItemId": "...", "paxRefId": ["PAX1"] }]
  },
  "paxList": [{ "paxId": "PAX1", "ptc": "ADT" }]
}
\`\`\`

### Post-Booking (Order-based)
Query services using order information from the OrderRetrieve response:
\`\`\`json
{
  "transactionId": "...",
  "order": {
    "orderId": "TSDEV-20250821-7bb482f96fe0a2f9"
  },
  "paxList": [{ "paxId": "PAX1", "ptc": "ADT" }]
}
\`\`\`

## Supported Services
| Type | Airlines |
|------|----------|
| Baggage | AF, EK, KL, LH, LX, OS, SQ, TR |
| Seat Upgrade | LH, LX, OS |
| FFN (Loyalty) | AF, KL |

## Workflow
- Prime: AirShopping -> **ServiceList** -> OfferPrice -> OrderCreate
- Held: OrderRetrieve -> **ServiceList** -> OrderQuote -> OrderChange
- Ticketed: OrderRetrieve -> **ServiceList** -> OrderQuote -> OrderChange
    `,
  })
  @ApiBody({
    type: ServiceListRQDto,
    examples: {
      'Prime Booking (Offer)': {
        summary: 'ServiceList by OfferPrice Result',
        description: 'Offer-based service inquiry for Prime Booking',
        value: {
          transactionId: '2db03454253b43c8baf0df7a3b9cfb9a',
          offer: {
            responseId: '2db03454253b43c8baf0df7a3b9cfb9a',
            offerId: '1d95235ebd044f31b36d62e708ddecdc24.1-1',
            owner: 'TK',
            offerItems: [
              {
                offerItemId: '1d95235ebd044f31b36d62e708ddecdc24.1-1-1',
                paxRefId: ['PAX_1', 'PAX_2'],
                paxSegmentRefId: ['SEG_2'],
              },
            ],
          },
          paxList: [
            { paxId: 'PAX_1', ptc: 'ADT' },
            { paxId: 'PAX_2', ptc: 'CHD' },
          ],
        },
      },
      'Prime Booking (Offer without Items)': {
        summary: 'ServiceList by OfferPrice Result (without OfferItem)',
        description: 'Service inquiry using Offer only without OfferItem',
        value: {
          transactionId: '2a631811d41d4965b00e94b9db0967a5',
          offer: {
            responseId: '2a631811d41d4965b00e94b9db0967a5',
            offerId: 'dc9b67489c9a468aab5f85afdaea078221.3-1',
            owner: 'HA',
          },
          paxList: [{ paxId: 'PAX1', ptc: 'ADT' }],
        },
      },
      'Post-Booking (Order)': {
        summary: 'ServiceList by OrderRetrieve Result',
        description: 'Order-based service inquiry for Post-Booking',
        value: {
          transactionId: '6522ad45ae274a779727e5dd05c8d367',
          order: {
            orderId: 'TSDEV-20250821-7bb482f96fe0a2f9',
          },
          paxList: [{ paxId: 'PAX1', ptc: 'ADT' }],
        },
      },
      'Post-Booking (Order with Items)': {
        summary: 'ServiceList by OrderRetrieve Result (with OrderItem)',
        description: 'Service inquiry for specific OrderItems',
        value: {
          transactionId: 'e61fd9fb0b9340a2a94043fbabf7c541',
          order: {
            orderId: 'TSDEV-20250821-2fa9dd92a3c2ecf1',
            orderItems: [
              {
                orderItemId: 'FL_P1',
                paxRefId: ['PAX_1'],
              },
            ],
          },
          paxList: [{ paxId: 'PAX_1', ptc: 'ADT' }],
        },
      },
      'With Loyalty Program (FFN)': {
        summary: 'ServiceList with Loyalty Program',
        description: 'Inquiry including FFN (mileage) information (AF, KL supported)',
        value: {
          transactionId: '7a8b9c0d1e2f3g4h5i6j7k8l9m0n',
          offer: {
            responseId: '7a8b9c0d1e2f3g4h5i6j7k8l9m0n',
            offerId: 'offer123',
            owner: 'AF',
          },
          paxList: [
            {
              paxId: 'PAX1',
              ptc: 'ADT',
              loyaltyProgramAccount: [
                {
                  accountNumber: '1070199873',
                  programCode: 'FB',
                },
              ],
            },
          ],
        },
      },
      'With Response Parameters': {
        summary: 'ServiceList with Response Parameters',
        description: 'Including response currency/language settings',
        value: {
          transactionId: 'abc123def456',
          order: {
            orderId: 'TSDEV-20250101-abc123',
          },
          paxList: [{ paxId: 'PAX1', ptc: 'ADT' }],
          responseParameter: {
            currencyCode: 'KRW',
            languageUsage: {
              langCode: 'ko',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Service list retrieved successfully',
    type: ServiceListRSDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (ValidationError)',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed (HMAC authentication error)',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error or PolarHub API error',
  })
  async getServiceList(
    @Body() request: ServiceListRQDto,
  ): Promise<ServiceListRSDto> {
    this.logger.log(
      `ServiceList request - txnId: ${request.transactionId}, ` +
        `mode: ${request.offer ? 'Offer' : 'Order'}`,
    );

    // Compose service call parameters
    const params = {
      transactionId: request.transactionId,
      pointOfSale: request.pointOfSale,
      feAuthHeaders: request.feAuthHeaders,
      paxList: request.paxList.map((pax) => ({
        paxId: pax.paxId,
        ptc: pax.ptc,
        ...(pax.loyaltyProgramAccount && {
          loyaltyProgramAccount: pax.loyaltyProgramAccount.map((lpa) => ({
            accountNumber: lpa.accountNumber,
            programCode: lpa.programCode,
            programName: lpa.programName,
            signInId: lpa.signInId,
            tierCode: lpa.tierCode,
            tierName: lpa.tierName,
          })),
        }),
      })),
      // Sender: use FE-provided value if available, otherwise fall back to environment variables
      ...(request.sender && {
        sender: {
          travelAgency: {
            agencyId: request.sender.travelAgency.agencyId,
            siteCode: request.sender.travelAgency.siteCode,
            agencyName: request.sender.travelAgency.agencyName,
            contactInfoRefId: request.sender.travelAgency.contactInfoRefId,
          },
        },
      }),
      // Offer (Prime Booking)
      ...(request.offer && {
        offer: {
          responseId: request.offer.responseId,
          offerId: request.offer.offerId,
          owner: request.offer.owner,
          offerItems: request.offer.offerItems?.map((item) => ({
            offerItemId: item.offerItemId,
            paxRefId: item.paxRefId || [],
            ...(item.paxSegmentRefId && {
              paxSegmentRefId: item.paxSegmentRefId,
            }),
          })) || [],
        },
      }),
      // Order (Post-Booking)
      ...(request.order && {
        orderId: request.order.orderId,
        ...(request.order.orderItems && {
          orderItems: request.order.orderItems.map((item) => ({
            orderItemId: item.orderItemId,
            paxRefId: item.paxRefId,
          })),
        }),
      }),
      // Criteria (optional)
      ...(request.criteria && {
        criteria: {
          ...(request.criteria.programCriteria && {
            programCriteria: request.criteria.programCriteria.map((pc) => ({
              airlineId: pc.airlineId,
              contractId: pc.contractId,
              accountId: pc.accountId,
              typeCode: pc.typeCode,
            })),
          }),
          ...(request.criteria.specialFareCriteria && {
            specialFareCriteria: request.criteria.specialFareCriteria.map(
              (sfc) => ({
                airlineId: sfc.airlineId,
                accountId: sfc.accountId,
              }),
            ),
          }),
          ...(request.criteria.existingOrderCriteria && {
            existingOrderCriteria: {
              orderId: request.criteria.existingOrderCriteria.orderId,
              paxRefId: request.criteria.existingOrderCriteria.paxRefId,
            },
          }),
        },
      }),
      // ResponseParameter (optional)
      ...(request.responseParameter && {
        responseParameter: {
          currencyCode: request.responseParameter.currencyCode,
          ...(request.responseParameter.languageUsage && {
            languageUsage: {
              langCode: request.responseParameter.languageUsage.langCode,
              langUsageType: request.responseParameter.languageUsage.langUsageType,
            },
          }),
        },
      }),
    };

    // Call service
    const result = await this.polarHubService.getServiceList(params);

    this.logger.log(
      `ServiceList response - txnId: ${result.transactionId}, ` +
        `hasServices: ${!!result.response?.ALaCarteOffer}`,
    );

    // Return response (raw data pass-through)
    return {
      transactionId: result.transactionId,
      ...result.response,
    };
  }
}