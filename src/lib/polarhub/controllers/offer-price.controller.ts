/**
 * OfferPrice Controller
 *
 * Detailed pricing inquiry API.
 * Retrieves detailed pricing for a selected Offer from AirShopping results.
 *
 * OpenAPI Endpoint: POST /hub/polarpie/v2/offerPrice
 * Middleware Endpoint: POST /middleware/polarhub/offer-price
 *
 * CRITICAL:
 * - transactionId must be provided by FE (same value as AirShopping)
 * - All APIs use POST method (PolarHub HTTP spec)
 * - Response returns raw PolarHub data as-is
 *
 * Workflow Support:
 * - WF_PB_DEFERRED: Deferred ticketing (default)
 * - WF_PB_IMMEDIATE: Immediate ticketing
 * - WF_PB_SEAT: Including seat selection
 * - WF_PB_SERVICE: Including ancillary services
 * - WF_PB_SEAT_SERVICE: Including seat + services
 */

import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { PolarHubService } from '../polarhub.service';
import {
  OfferPriceRequestDto,
  OfferPriceResponseDto,
} from '../dto/offer-price.dto';

@ApiTags('PolarHub - OfferPrice')
@Controller('polarhub/offer-price')
export class OfferPriceController {
  private readonly logger = new Logger(OfferPriceController.name);

  constructor(private readonly polarHubService: PolarHubService) {}

  /**
   * OfferPrice - Detailed pricing inquiry
   *
   * Retrieves detailed pricing information for Offers returned from AirShopping.
   * The same TransactionID must be used.
   *
   * Usage by workflow:
   * 1. Default (DEFERRED/IMMEDIATE): AirShopping -> OfferPrice -> OrderCreate
   * 2. With seat (SEAT): AirShopping -> SeatAvailability -> OfferPrice -> OrderCreate
   * 3. With service (SERVICE): AirShopping -> ServiceList -> OfferPrice -> OrderCreate
   *
   * MatchResult handling:
   * - FULL: Single Offer covers entire itinerary -> 1 Offer in offers array
   * - PARTIAL: Separate Offer needed per leg -> Multiple Offers in offers array
   */
  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'OfferPrice - Detailed pricing inquiry',
    description: `
## Overview
Retrieves detailed pricing information for a selected Offer from AirShopping.

## Usage
1. Call AirShopping API to retrieve the Offer list
2. Select the desired Offer and call OfferPrice
3. Using the same transactionId is required

## MatchResult Handling
- **FULL**: Single Offer covers entire itinerary
  - Only 1 Offer included in the offers array
- **PARTIAL**: Separate Offer needed per leg
  - Multiple Offers in the offers array (2 for round-trip)

## Fields by Workflow
| Workflow | Additional Fields |
|-----------|----------|
| WF_PB_DEFERRED | None (default) |
| WF_PB_IMMEDIATE | None (default) |
| WF_PB_SEAT | seatSelection |
| WF_PB_SERVICE | bookingInstructions |
| WF_PB_SEAT_SERVICE | seatSelection + bookingInstructions |

## Seat Selection (WF_PB_SEAT)
\`\`\`json
{
  "offerItemId": "...",
  "paxRefId": ["PAX1"],
  "seatSelection": {
    "column": "G",
    "row": "20"
  }
}
\`\`\`

## Ancillary Service (WF_PB_SERVICE)
\`\`\`json
{
  "offerItemId": "...",
  "paxRefId": ["PAX1"],
  "bookingInstructions": {
    "text": ["TTL10KG"]
  }
}
\`\`\`

## FFN (Loyalty Program)
- Supported by AF and KL airlines only
- Include loyaltyProgramAccount in paxList
    `,
  })
  @ApiBody({
    type: OfferPriceRequestDto,
    examples: {
      'MatchResult-Full': {
        summary: 'MatchResult FULL - Single offer',
        description: 'When a round-trip itinerary is provided as a single Offer',
        value: {
          transactionId: 'd84d2a2430334fd0869f9e599f18b154',
          offers: [
            {
              responseId: 'd84d2a2430334fd0869f9e599f18b154',
              offerId: 'd84d2a2430334fd0869f9e599f18b15421.3SQ-10',
              owner: 'SQ',
              offerItems: [
                {
                  offerItemId: 'd84d2a2430334fd0869f9e599f18b15421.3SQ-10-1',
                  paxRefId: ['SQ_PAX1', 'SQ_PAX2', 'SQ_PAX3'],
                },
              ],
            },
          ],
          paxList: [
            { paxId: 'SQ_PAX1', ptc: 'ADT' },
            { paxId: 'SQ_PAX2', ptc: 'ADT' },
            { paxId: 'SQ_PAX3', ptc: 'CHD' },
          ],
        },
      },
      'MatchResult-Partial': {
        summary: 'MatchResult PARTIAL - Multiple offers (round-trip)',
        description: 'When a round-trip itinerary is provided as separate Offers',
        value: {
          transactionId: 'd53ca6e3c7264c8c95036c33b8c800cd',
          offers: [
            {
              responseId: 'd53ca6e3c7264c8c95036c33b8c800cd',
              offerId: 'd53ca6e3c7264c8c95036c33b8c800cd17.2LH-2',
              owner: 'LH',
              offerItems: [
                {
                  offerItemId: 'd53ca6e3c7264c8c95036c33b8c800cd17.2LH-2-1',
                  paxRefId: ['LH_T1', 'LH_T2'],
                },
                {
                  offerItemId: 'd53ca6e3c7264c8c95036c33b8c800cd17.2LH-2-2',
                  paxRefId: ['LH_T3'],
                },
              ],
            },
            {
              responseId: 'd53ca6e3c7264c8c95036c33b8c800cd',
              offerId: 'd53ca6e3c7264c8c95036c33b8c800cd17.2LH-1',
              owner: 'LH',
              offerItems: [
                {
                  offerItemId: 'd53ca6e3c7264c8c95036c33b8c800cd17.2LH-1-1',
                  paxRefId: ['LH_T1', 'LH_T2'],
                },
                {
                  offerItemId: 'd53ca6e3c7264c8c95036c33b8c800cd17.2LH-1-2',
                  paxRefId: ['LH_T3'],
                },
              ],
            },
          ],
          paxList: [
            { paxId: 'LH_T1', ptc: 'ADT' },
            { paxId: 'LH_T2', ptc: 'ADT' },
            { paxId: 'LH_T3', ptc: 'CHD' },
          ],
        },
      },
      'With-Seat': {
        summary: 'With seat selection (WF_PB_SEAT)',
        description: 'OfferPrice including SeatAvailability results',
        value: {
          transactionId: 'fbe26bf439d54b85a77202f9d9f7528e',
          workflow: 'WF_PB_SEAT',
          offers: [
            {
              responseId: 'fbe26bf439d54b85a77202f9d9f7528e',
              offerId: '30b1d50824974230b15025870344bfa018.2-1',
              owner: 'AF',
              offerItems: [
                {
                  offerItemId: '30b1d50824974230b15025870344bfa018.2-1-1',
                  paxRefId: ['PAX1'],
                },
              ],
            },
            {
              responseId: '944f495d228f4d4ba3c8d3777136a3de',
              offerId: '944f495d228f4d4ba3c8d3777136a3de18.2-1',
              owner: 'AF',
              offerItems: [
                {
                  offerItemId: '944f495d228f4d4ba3c8d3777136a3de18.2-1-5',
                  paxRefId: ['PAX1'],
                  seatSelection: {
                    column: 'G',
                    row: '20',
                  },
                },
              ],
            },
          ],
          paxList: [{ paxId: 'PAX1', ptc: 'ADT' }],
        },
      },
      'With-Baggage': {
        summary: 'With extra baggage (WF_PB_SERVICE)',
        description: 'OfferPrice including ServiceList results (XBAG)',
        value: {
          transactionId: '88d18e46a4234c67aebc30ffaf84e2b9',
          workflow: 'WF_PB_SERVICE',
          offers: [
            {
              responseId: '88d18e46a4234c67aebc30ffaf84e2b9',
              offerId: '7ed8f6debe4348df892f74d4f1af8c9b21.3-1',
              owner: 'SQ',
              offerItems: [
                {
                  offerItemId: '7ed8f6debe4348df892f74d4f1af8c9b21.3-1-1',
                  paxRefId: ['PAX11', 'PAX1', 'PAX2', 'PAX3'],
                },
              ],
            },
            {
              responseId: 'aaf64ccf20be4549833e90bca2c0525d',
              offerId: 'aaf64ccf20be4549833e90bca2c0525d21.3-1',
              owner: 'SQ',
              offerItems: [
                {
                  offerItemId: 'aaf64ccf20be4549833e90bca2c0525d21.3-1-1',
                  paxRefId: ['PAX1'],
                  bookingInstructions: {
                    text: ['TTL10KG'],
                    ositext: ['TTL\\s?%WVAL%KG'],
                  },
                },
              ],
            },
          ],
          paxList: [
            { paxId: 'PAX11', ptc: 'INF' },
            { paxId: 'PAX1', ptc: 'ADT' },
            { paxId: 'PAX2', ptc: 'ADT' },
            { paxId: 'PAX3', ptc: 'CHD' },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Price inquiry successful',
    type: OfferPriceResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request (missing required fields, invalid format)',
  })
  @ApiUnauthorizedResponse({
    description: 'HMAC authentication failed',
  })
  @ApiInternalServerErrorResponse({
    description: 'Server error or PolarHub API error',
  })
  async getOfferPrice(
    @Body() request: OfferPriceRequestDto,
  ): Promise<OfferPriceResponseDto> {
    this.logger.log(
      `OfferPrice request: transactionId=${request.transactionId}, offers=${request.offers.length}, workflow=${request.workflow || 'default'}`,
    );

    try {
      // Call service (camelCase -> PascalCase conversion is handled by the Service)
      const result = await this.polarHubService.getOfferPrice({
        transactionId: request.transactionId,
        offers: request.offers.map((offer) => ({
          responseId: offer.responseId,
          offerId: offer.offerId,
          owner: offer.owner,
          offerItems: offer.offerItems.map((item) => ({
            offerItemId: item.offerItemId,
            paxRefId: item.paxRefId,
            ...(item.seatSelection && {
              seatSelection: {
                column: item.seatSelection.column,
                row: item.seatSelection.row,
              },
            }),
            ...(item.bookingInstructions && {
              bookingInstructions: {
                text: item.bookingInstructions.text,
                ositext: item.bookingInstructions.ositext,
              },
            }),
          })),
        })),
        paxList: request.paxList.map((pax) => ({
          paxId: pax.paxId,
          ptc: pax.ptc,
          birthDate: pax.birthDate,
          paxRefId: pax.paxRefId,
          loyaltyProgramAccount: pax.loyaltyProgramAccount,
        })),
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
        ...(request.feAuthHeaders && { feAuthHeaders: request.feAuthHeaders }),
        ...(request.pointOfSale && { pointOfSale: request.pointOfSale }),
        // Criteria (full CriteriaType4)
        ...(request.criteria && { criteria: request.criteria }),
        // ResponseParameter
        ...(request.responseParameter && { responseParameter: request.responseParameter }),
        // FopPromotion
        ...(request.fopPromotion && { fopPromotion: request.fopPromotion }),
      });

      this.logger.log(
        `OfferPrice success: transactionId=${request.transactionId}`,
      );

      // Response: transactionId + raw PolarHub data
      return {
        transactionId: result.transactionId,
        ...result.response,
      };
    } catch (error) {
      this.logger.error(
        `OfferPrice failed: transactionId=${request.transactionId}, error=${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}