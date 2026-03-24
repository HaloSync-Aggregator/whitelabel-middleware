/**
 * PolarHub Service
 *
 * Main middleware service.
 * Performs DTO (camelCase) -> PolarHub Query (PascalCase) transformation.
 *
 * CRITICAL:
 * - transactionId is passed through as-is from FE
 * - No hardcoding of business data
 * - Only environment variable-based Agency settings are allowed
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PolarHubClient } from './client';
import {
  Sender,
  FEAuthHeaders,
  AirShoppingQuery,
  AirShoppingRS,
  OfferPriceQuery,
  OfferPriceRS,
  OrderViewRS,
  OrderCancelRS,
  ServiceListRS,
  SeatAvailabilityRS,
  OrderReshopQuery,
  OrderReshopRS,
  OrderQuoteRS,
} from './types';

// ==============================================
// Service Parameter Types
// ==============================================

interface BaseParams {
  transactionId: string;
  sender?: {
    travelAgency: {
      agencyId: string;
      siteCode?: string;
      agencyName?: string;
      contactInfoRefId?: string[];
    };
  };
  feAuthHeaders?: FEAuthHeaders;
  pointOfSale?: string;
}

interface PassengerCount {
  type: string; // ADT | CHD | INF
  count: number;
}

interface OriginDestParam {
  origin: string;
  destination: string;
  departureDate: string;
}

interface PaxSimpleParam {
  paxId: string;
  ptc: string;
}

interface OfferItemParam {
  offerItemId: string;
  paxRefId: string[];
  paxSegmentRefId?: string[]; // Used in SeatAvailability, ServiceList
  seatSelection?: { column: string; row: string };
  bookingInstructions?: { text?: string[]; ositext?: string[] };
}

interface OfferParam {
  responseId: string;
  offerId: string;
  owner: string;
  offerItems: OfferItemParam[];
}

interface IndividualParam {
  nameTitle?: string;
  givenName: string[];
  surname: string;
  birthdate: string;
  gender?: string;
}

interface IdentityDocParam {
  identityDocType: string;
  identityDocId: string;
  expiryDate?: string;
  issuingCountryCode?: string;
  citizenshipCountryCode?: string;
}

interface PaxDetailParam {
  paxId: string;
  ptc: string;
  individual: IndividualParam;
  identityDoc?: IdentityDocParam[];
  contactInfoRefId?: string[];
  citizenshipCountryCode?: string;
  residenceCountryCode?: string;
}

interface PhoneParam {
  phoneNumber: string;
  countryDialingCode?: string;
  label?: string;
}

interface PostalAddressParam {
  street?: string[];
  cityName?: string;
  postalCode?: string;
  countryCode?: string;
}

interface ContactInfoParam {
  contactInfoId: string;
  emailAddress?: string;
  phone?: PhoneParam;
  postalAddress?: PostalAddressParam;
}

interface PaymentCardParam {
  cardCode: string;
  cardNumber: string;
  cardHolderName: string;
  expiration: string;
  seriesCode?: string;
}

interface PaymentParam {
  paymentMethod: {
    cash?: { cashPaymentInd: boolean };
    card?: PaymentCardParam;
    agentDeposit?: { agentDepositId: string };
  };
  amount: { currencyCode: string; amount: number };
  orderItemId?: string[];
  offerItemId?: string[];
  paxRefId?: string[];
}

interface ChangeOrderChoiceParam {
  acceptSelectedQuotedOfferList?: {
    selectedPricedOffer: Array<{
      offerId: string;
      owner: string;
      responseId?: string;
      offerItems: OfferItemParam[];
    }>;
  };
  acceptOrderItemList?: {
    owner: string;
    offerItemRefId?: string[];
  };
  acceptRepricedOrder?: {
    offerRefId: string[];
  };
  updatePax?: Array<{
    currentPaxRefId?: string;
    newPaxRefId?: string;
  }>;
  acceptChange?: {
    orderItemRefId: string[];
  };
}

@Injectable()
export class PolarHubService {
  private readonly client: PolarHubClient;
  private readonly logger = new Logger(PolarHubService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new PolarHubClient({
      baseUrl: this.configService.get<string>('POLARHUB_API_BASE_URL') || '',
      tenant: this.configService.get<string>('POLARHUB_TENANT_ID') || '',
      secretBase64: this.configService.get<string>('POLARHUB_API_SECRET') || '',
      siteCode: this.configService.get<string>('SALES_BRANCH_ID'),
      agencyName: this.configService.get<string>('POLARHUB_AGENCY_NAME'),
      agencyContactId: this.configService.get<string>('POLARHUB_AGENCY_CONTACT_ID'),
      timeout: this.configService.get<number>('POLARHUB_TIMEOUT_MS') || 30000,
      retryCount: this.configService.get<number>('POLARHUB_RETRY_COUNT') || 3,
    });
  }

  // ==============================================
  // Helper Methods
  // ==============================================

  /**
   * Sender transformation (camelCase -> PascalCase)
   *
   * Priority: FE value > env var > skip (not included)
   * - If sender is not provided by FE: Build from env vars, skip fields that are unset
   * - If sender is provided by FE: Use FE values, fall back to env vars for missing fields
   */
  private transformSender(sender?: BaseParams['sender']): Sender {
    const agencyContactId = this.configService.get<string>('POLARHUB_AGENCY_CONTACT_ID');
    const defaultTenantId = this.configService.get<string>('POLARHUB_TENANT_ID') || '';
    const defaultSiteCode = this.configService.get<string>('SALES_BRANCH_ID');
    const defaultAgencyName = this.configService.get<string>('POLARHUB_AGENCY_NAME');

    // If FE does not provide sender, build from env vars (skip if unset)
    if (!sender) {
      return {
        TravelAgency: {
          AgencyID: defaultTenantId,
          ...(defaultSiteCode && { SiteCode: defaultSiteCode }),
          ...(defaultAgencyName && { AgencyName: defaultAgencyName }),
          ...(agencyContactId && { ContactInfoRefID: [agencyContactId] }),
        },
      };
    }

    // FE provides sender: FE value > env var fallback > skip
    return {
      TravelAgency: {
        AgencyID: sender.travelAgency.agencyId,
        ...(sender.travelAgency.siteCode
          ? { SiteCode: sender.travelAgency.siteCode }
          : defaultSiteCode ? { SiteCode: defaultSiteCode } : {}),
        ...(sender.travelAgency.agencyName && {
          AgencyName: sender.travelAgency.agencyName,
        }),
        ...(sender.travelAgency.contactInfoRefId?.length
          ? { ContactInfoRefID: sender.travelAgency.contactInfoRefId }
          : agencyContactId ? { ContactInfoRefID: [agencyContactId] } : {}),
      },
    };
  }

  /**
   * Build Travel Agency ContactInfo (read from env vars and convert to PascalCase)
   *
   * CRITICAL: This ContactInfo is auto-inserted into ContactInfoList during OrderCreate.
   * sender.travelAgency.contactInfoRefId references this ContactInfoID.
   */
  private buildAgencyContactInfo(): Record<string, unknown> | null {
    const contactId = this.configService.get<string>('POLARHUB_AGENCY_CONTACT_ID');
    const email = this.configService.get<string>('POLARHUB_AGENCY_EMAIL');
    const phoneCountryCode = this.configService.get<string>('POLARHUB_AGENCY_PHONE_COUNTRY_CODE');
    const phoneNumber = this.configService.get<string>('POLARHUB_AGENCY_PHONE_NUMBER');
    const street = this.configService.get<string>('POLARHUB_AGENCY_POSTAL_STREET');
    const postalCode = this.configService.get<string>('POLARHUB_AGENCY_POSTAL_CODE');
    const cityName = this.configService.get<string>('POLARHUB_AGENCY_POSTAL_CITY');
    const countryCode = this.configService.get<string>('POLARHUB_AGENCY_POSTAL_COUNTRY');

    // Return null if contactId is not set
    if (!contactId) {
      return null;
    }

    const contactInfo: Record<string, unknown> = {
      ContactInfoID: contactId,
      ContactRefusedInd: false,
    };

    // EmailAddress
    if (email) {
      contactInfo.EmailAddress = [email];
    }

    // Phone
    if (phoneNumber) {
      contactInfo.Phone = [
        {
          ...(phoneCountryCode && { CountryDialingCode: phoneCountryCode }),
          PhoneNumber: phoneNumber,
        },
      ];
    }

    // PostalAddress
    if (street || postalCode || cityName || countryCode) {
      contactInfo.PostalAddress = [
        {
          ...(street && { Street: [street] }),
          ...(postalCode && { PostalCode: postalCode }),
          ...(cityName && { CityName: cityName }),
          ...(countryCode && { CountryCode: countryCode }),
        },
      ];
    }

    return contactInfo;
  }

  /**
   * Criteria transformation (camelCase -> PascalCase)
   * Transforms full CriteriaType4 fields
   */
  private transformCriteria(criteria: {
    direct?: boolean;
    airlinePreference?: { airlineId?: string[] };
    programCriteria?: Array<{
      airlineId: string;
      contractId?: string;
      accountId?: string[];
      typeCode?: string;
    }>;
    promotionCriteria?: Array<{
      airlineId: string;
      promotionId?: string;
    }>;
    specialFareCriteria?: Array<{
      airlineId?: string;
      accountId?: string;
      typeCode?: string;
    }>;
    existingOrderCriteria?: {
      orderId: string;
      paxRefId?: string[];
    };
  }): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (criteria.direct !== undefined) {
      result.Direct = criteria.direct;
    }
    if (criteria.airlinePreference?.airlineId) {
      result.AirlinePreference = {
        AirlineID: criteria.airlinePreference.airlineId,
      };
    }
    if (criteria.programCriteria && criteria.programCriteria.length > 0) {
      result.ProgramCriteria = criteria.programCriteria.map((pc) => ({
        AirlineID: pc.airlineId,
        ...(pc.contractId && { ContractID: pc.contractId }),
        ...(pc.accountId && { AccountID: pc.accountId }),
        ...(pc.typeCode && { TypeCode: pc.typeCode }),
      }));
    }
    if (criteria.promotionCriteria && criteria.promotionCriteria.length > 0) {
      result.PromotionCriteria = criteria.promotionCriteria.map((pc) => ({
        AirlineID: pc.airlineId,
        ...(pc.promotionId && { PromotionID: pc.promotionId }),
      }));
    }
    if (criteria.specialFareCriteria && criteria.specialFareCriteria.length > 0) {
      result.SpecialFareCriteria = criteria.specialFareCriteria.map((sfc) => ({
        ...(sfc.airlineId && { AirlineID: sfc.airlineId }),
        ...(sfc.accountId && { AccountID: sfc.accountId }),
        ...(sfc.typeCode && { TypeCode: sfc.typeCode }),
      }));
    }
    if (criteria.existingOrderCriteria) {
      result.ExistingOrderCriteria = {
        OrderID: criteria.existingOrderCriteria.orderId,
        ...(criteria.existingOrderCriteria.paxRefId && {
          PaxRefID: criteria.existingOrderCriteria.paxRefId,
        }),
      };
    }

    return result;
  }

  /**
   * ResponseParameter transformation (camelCase -> PascalCase)
   */
  private transformResponseParameter(param: {
    currencyCode?: string;
    languageUsage?: {
      langCode: string;
      langUsageType?: string;
    };
  }): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (param.currencyCode) {
      result.CurrencyCode = param.currencyCode;
    }
    if (param.languageUsage) {
      result.LanguageUsage = {
        LangCode: param.languageUsage.langCode,
        ...(param.languageUsage.langUsageType && {
          LangUsageType: param.languageUsage.langUsageType,
        }),
      };
    }

    return result;
  }

  /**
   * FopPromotion transformation (camelCase -> PascalCase)
   */
  private transformFopPromotion(promos: Array<{
    promotionCode: string;
    paymentType?: string;
    cardCode?: string;
    cardName?: string;
  }>): Array<Record<string, unknown>> {
    return promos.map((p) => ({
      PromotionCode: p.promotionCode,
      ...(p.paymentType && { PaymentType: p.paymentType }),
      ...(p.cardCode && { CardCode: p.cardCode }),
      ...(p.cardName && { CardName: p.cardName }),
    }));
  }

  /**
   * PaxList builder (passengers -> PaxList)
   */
  private buildPaxList(
    passengers: PassengerCount[],
  ): Array<{ PaxID: string; Ptc: string }> {
    const paxList: Array<{ PaxID: string; Ptc: string }> = [];
    let paxIndex = 1;

    for (const pax of passengers) {
      for (let i = 0; i < pax.count; i++) {
        paxList.push({
          PaxID: `PAX${paxIndex++}`,
          Ptc: pax.type,
        });
      }
    }

    return paxList;
  }

  /**
   * PaxList transformation for OrderCreate
   * CRITICAL: Gender field must have toUpperCase() applied!
   */
  private buildOrderPaxList(paxList: PaxDetailParam[]) {
    return paxList.map((pax) => ({
      PaxID: pax.paxId,
      Ptc: pax.ptc,

      // Individual info (names are converted to uppercase)
      Individual: {
        ...(pax.individual.nameTitle && { NameTitle: pax.individual.nameTitle }),
        GivenName: pax.individual.givenName.map((n) => n.toUpperCase()),
        Surname: pax.individual.surname.toUpperCase(),
        Birthdate: pax.individual.birthdate,
        ...(pax.individual.gender && {
          Gender: pax.individual.gender.toUpperCase(),
        }),
      },

      // Top-level Gender (required by some airlines)
      ...(pax.individual.gender && {
        Gender: pax.individual.gender.toUpperCase(),
      }),

      // ContactInfoRefID
      ...(pax.contactInfoRefId && {
        ContactInfoRefID: pax.contactInfoRefId,
      }),

      // IdentityDoc branching logic
      ...(pax.identityDoc && pax.identityDoc.length > 0
        ? {
            IdentityDoc: pax.identityDoc.map((doc) => ({
              IdentityDocumentType: doc.identityDocType,
              IdentityDocumentNumber: doc.identityDocId,
              ...(doc.expiryDate && { ExpiryDate: doc.expiryDate }),
              ...(doc.issuingCountryCode && {
                IssuingCountryCode: doc.issuingCountryCode,
              }),
              ...(doc.citizenshipCountryCode && {
                CitizenshipCountryCode: doc.citizenshipCountryCode,
              }),
              ...(doc.issuingCountryCode && {
                ResidenceCountryCode: doc.issuingCountryCode,
              }),
              ...(pax.individual.gender && {
                Gender: pax.individual.gender.toUpperCase(),
              }),
            })),
          }
        : {
            // If no IdentityDoc, use country codes provided by FE
            // CRITICAL: No hardcoding!
            ...(pax.citizenshipCountryCode && {
              CitizenshipCountryCode: pax.citizenshipCountryCode,
            }),
            ...(pax.residenceCountryCode && {
              ResidenceCountryCode: pax.residenceCountryCode,
            }),
          }),
    }));
  }

  /**
   * ContactInfoList transformation
   * CRITICAL: No hardcoding of Phone.Label, etc.!
   */
  private buildContactInfoList(contactInfoList: ContactInfoParam[]) {
    return contactInfoList.map((ci) => ({
      ContactInfoID: ci.contactInfoId,

      // EmailAddress: string -> string[] wrapping
      ...(ci.emailAddress && {
        EmailAddress: [ci.emailAddress],
      }),

      // Phone: object -> array wrapping
      ...(ci.phone && {
        Phone: [
          {
            // Label is provided by FE (no hardcoding!)
            ...(ci.phone.label && { Label: ci.phone.label }),
            ...(ci.phone.countryDialingCode && {
              CountryDialingCode: ci.phone.countryDialingCode,
            }),
            PhoneNumber: ci.phone.phoneNumber,
          },
        ],
      }),

      // PostalAddress (required for BA)
      ...(ci.postalAddress && {
        PostalAddress: [
          {
            ...(ci.postalAddress.street && { Street: ci.postalAddress.street }),
            ...(ci.postalAddress.cityName && {
              CityName: ci.postalAddress.cityName,
            }),
            ...(ci.postalAddress.postalCode && {
              PostalCode: ci.postalAddress.postalCode,
            }),
            ...(ci.postalAddress.countryCode && {
              CountryCode: ci.postalAddress.countryCode,
            }),
          },
        ],
      }),

      ContactRefusedInd: false,
    }));
  }

  /**
   * PaymentList transformation
   */
  private buildPaymentList(paymentList: PaymentParam[]) {
    return paymentList.map((p) => {
      // Determine payment type
      let type = 'Cash';
      if (p.paymentMethod.card) {
        type = 'Card';
      } else if (p.paymentMethod.agentDeposit) {
        type = 'Ag';
      }

      const payment: Record<string, unknown> = {
        Type: type,
        Amount: p.amount.amount,
        CurCode: p.amount.currencyCode,
      };

      // Card payment details
      if (p.paymentMethod.card) {
        payment.PaymentCardMethod = {
          CardCode: p.paymentMethod.card.cardCode,
          CardNumber: p.paymentMethod.card.cardNumber,
          CardHolderName: p.paymentMethod.card.cardHolderName,
          EffectiveExpireDate: {
            Expiration: p.paymentMethod.card.expiration,
          },
          ...(p.paymentMethod.card.seriesCode && {
            SeriesCode: p.paymentMethod.card.seriesCode,
          }),
        };
      }

      // Payment assignment fields
      if (p.orderItemId && p.orderItemId.length > 0) {
        payment.OrderItemID = p.orderItemId;
      }
      if (p.offerItemId && p.offerItemId.length > 0) {
        payment.OfferItemID = p.offerItemId;
      }
      if (p.paxRefId && p.paxRefId.length > 0) {
        payment.PaxRefID = p.paxRefId;
      }

      return payment;
    });
  }

  // ==============================================
  // API Methods (10 endpoints)
  // ==============================================

  /**
   * 1. AirShopping - Flight search
   */
  async searchFlights(
    params: BaseParams & {
      originDestList: OriginDestParam[];
      passengers: PassengerCount[];
      cabin?: string;
      airlinePreference?: string[];
      directOnly?: boolean;
      criteria?: {
        direct?: boolean;
        airlinePreference?: { airlineId?: string[] };
        programCriteria?: Array<{
          airlineId: string;
          contractId?: string;
          accountId?: string[];
          typeCode?: string;
        }>;
        promotionCriteria?: Array<{
          airlineId: string;
          promotionId?: string;
        }>;
        specialFareCriteria?: Array<{
          airlineId?: string;
          accountId?: string;
          typeCode?: string;
        }>;
        existingOrderCriteria?: {
          orderId: string;
          paxRefId?: string[];
        };
      };
      responseParameter?: {
        currencyCode?: string;
        languageUsage?: {
          langCode: string;
          langUsageType?: string;
        };
      };
    },
  ): Promise<{ transactionId: string; response: AirShoppingRS }> {
    const paxList = this.buildPaxList(params.passengers);

    const query: Record<string, unknown> = {
      OriginDestList: params.originDestList.map((od) => ({
        OriginCode: od.origin,
        DestCode: od.destination,
        DepartureDate: od.departureDate,
      })),
      PaxList: paxList,
      ...(params.cabin && { Cabin: params.cabin }),
    };

    // Criteria: full CriteriaType4 pass-through takes priority, legacy fields as fallback
    if (params.criteria) {
      const criteria = this.transformCriteria(params.criteria);
      if (Object.keys(criteria).length > 0) {
        query.Criteria = criteria;
      }
    } else if (params.directOnly !== undefined || params.airlinePreference) {
      // Legacy fallback
      query.Criteria = {
        ...(params.directOnly !== undefined && { Direct: params.directOnly }),
        ...(params.airlinePreference && {
          AirlinePreference: { AirlineID: params.airlinePreference },
        }),
      };
    }

    // ResponseParameter
    if (params.responseParameter) {
      const rp = this.transformResponseParameter(params.responseParameter);
      if (Object.keys(rp).length > 0) {
        query.ResponseParameter = rp;
      }
    }

    const response = await this.client.airShopping(
      query as unknown as AirShoppingQuery,
      {
        transactionId: params.transactionId,
        pointOfSale: params.pointOfSale,
        sender: this.transformSender(params.sender),
        feAuthHeaders: params.feAuthHeaders,
      },
    );

    return { transactionId: params.transactionId, response };
  }

  /**
   * 2. OfferPrice - Detailed price inquiry
   */
  async getOfferPrice(
    params: BaseParams & {
      offers: OfferParam[];
      paxList: Array<PaxSimpleParam & {
        birthDate?: string;
        paxRefId?: string;
        loyaltyProgramAccount?: Array<{
          accountNumber?: string;
          programCode?: string;
          programName?: string;
          signInId?: string;
          tierCode?: string;
          tierName?: string;
        }>;
      }>;
      criteria?: {
        direct?: boolean;
        airlinePreference?: { airlineId?: string[] };
        programCriteria?: Array<{
          airlineId: string;
          contractId?: string;
          accountId?: string[];
          typeCode?: string;
        }>;
        promotionCriteria?: Array<{
          airlineId: string;
          promotionId?: string;
        }>;
        specialFareCriteria?: Array<{
          airlineId?: string;
          accountId?: string;
          typeCode?: string;
        }>;
        existingOrderCriteria?: {
          orderId: string;
          paxRefId?: string[];
        };
      };
      responseParameter?: {
        currencyCode?: string;
        languageUsage?: {
          langCode: string;
          langUsageType?: string;
        };
      };
      fopPromotion?: Array<{
        promotionCode: string;
        paymentType?: string;
        cardCode?: string;
        cardName?: string;
      }>;
    },
  ): Promise<{ transactionId: string; response: OfferPriceRS }> {
    const query: Record<string, unknown> = {
      Offers: params.offers.map((offer) => ({
        ResponseID: offer.responseId,
        OfferID: offer.offerId,
        Owner: offer.owner,
        OfferItems: offer.offerItems.map((item) => ({
          OfferItemID: item.offerItemId,
          PaxRefID: item.paxRefId,
          ...(item.seatSelection && {
            SeatSelection: {
              Column: item.seatSelection.column,
              Row: item.seatSelection.row,
            },
          }),
          ...(item.bookingInstructions && {
            BookingInstructions: {
              ...(item.bookingInstructions.text && {
                Text: item.bookingInstructions.text,
              }),
              ...(item.bookingInstructions.ositext && {
                Ositext: item.bookingInstructions.ositext,
              }),
            },
          }),
        })),
      })),
      PaxList: params.paxList.map((pax) => ({
        PaxID: pax.paxId,
        Ptc: pax.ptc,
        ...(pax.birthDate && { BirthDate: pax.birthDate }),
        ...(pax.paxRefId && { PaxRefID: pax.paxRefId }),
        ...(pax.loyaltyProgramAccount &&
          pax.loyaltyProgramAccount.length > 0 && {
            LoyaltyProgramAccount: pax.loyaltyProgramAccount.map((lpa) => ({
              ...(lpa.accountNumber && { AccountNumber: lpa.accountNumber }),
              ...(lpa.programCode && { ProgramCode: lpa.programCode }),
              ...(lpa.programName && { ProgramName: lpa.programName }),
              ...(lpa.signInId && { SignInID: lpa.signInId }),
              ...(lpa.tierCode && { TierCode: lpa.tierCode }),
              ...(lpa.tierName && { TierName: lpa.tierName }),
            })),
          }),
      })),
    };

    // Criteria
    if (params.criteria) {
      const criteria = this.transformCriteria(params.criteria);
      if (Object.keys(criteria).length > 0) {
        query.Criteria = criteria;
      }
    }

    // ResponseParameter
    if (params.responseParameter) {
      const rp = this.transformResponseParameter(params.responseParameter);
      if (Object.keys(rp).length > 0) {
        query.ResponseParameter = rp;
      }
    }

    // FopPromotion
    if (params.fopPromotion && params.fopPromotion.length > 0) {
      query.FopPromotion = this.transformFopPromotion(params.fopPromotion);
    }

    const response = await this.client.offerPrice(
      query as unknown as OfferPriceQuery,
      {
        transactionId: params.transactionId,
        pointOfSale: params.pointOfSale,
        sender: this.transformSender(params.sender),
        feAuthHeaders: params.feAuthHeaders,
      },
    );

    return { transactionId: params.transactionId, response };
  }

  /**
   * 3. OrderCreate - Create booking
   */
  async createOrder(
    params: BaseParams & {
      orders: OfferParam[];
      paxList: PaxDetailParam[];
      contactInfoList?: ContactInfoParam[];
      paymentList?: PaymentParam[];
    },
  ): Promise<{ transactionId: string; response: OrderViewRS }> {
    const query: Record<string, unknown> = {
      Order: params.orders.map((order) => ({
        ResponseID: order.responseId,
        OfferID: order.offerId,
        Owner: order.owner,
        OfferItems: order.offerItems.map((item) => ({
          OfferItemID: item.offerItemId,
          PaxRefID: item.paxRefId,
          ...(item.seatSelection && {
            SeatSelection: {
              Column: item.seatSelection.column,
              Row: item.seatSelection.row,
            },
          }),
          ...(item.bookingInstructions && {
            BookingInstructions: {
              ...(item.bookingInstructions.text && {
                Text: item.bookingInstructions.text,
              }),
              ...(item.bookingInstructions.ositext && {
                Ositext: item.bookingInstructions.ositext,
              }),
            },
          }),
        })),
      })),
      PaxList: this.buildOrderPaxList(params.paxList),
    };

    // Build ContactInfoList (Priority: FE > env var > skip)
    // 1. FE contactInfoList (pass-through)
    const contactInfoList: Record<string, unknown>[] = params.contactInfoList?.length
      ? this.buildContactInfoList(params.contactInfoList)
      : [];

    // 2. If FE didn't include agency contact and env var is set, inject as fallback
    const agencyContactId = this.configService.get<string>('POLARHUB_AGENCY_CONTACT_ID');
    if (agencyContactId) {
      const hasAgencyContact = contactInfoList.some(
        (ci: Record<string, unknown>) => ci.ContactInfoID === agencyContactId,
      );
      if (!hasAgencyContact) {
        const agencyContactInfo = this.buildAgencyContactInfo();
        if (agencyContactInfo) {
          contactInfoList.unshift(agencyContactInfo);
        }
      }
    }

    // 3. Include only if non-empty
    if (contactInfoList.length > 0) {
      query.ContactInfoList = contactInfoList;
    }

    // Add PaymentList (for immediate ticketing)
    if (params.paymentList && params.paymentList.length > 0) {
      query.PaymentList = this.buildPaymentList(params.paymentList);
    }

    const response = await this.client.orderCreate(
      query as unknown as Parameters<typeof this.client.orderCreate>[0],
      {
        transactionId: params.transactionId,
        pointOfSale: params.pointOfSale,
        sender: this.transformSender(params.sender),
        feAuthHeaders: params.feAuthHeaders,
      },
    );

    return { transactionId: params.transactionId, response };
  }

  /**
   * 4. OrderRetrieve - Retrieve booking
   */
  async getOrder(
    params: BaseParams & {
      orderId: string;
    },
  ): Promise<{ transactionId: string; response: OrderViewRS }> {
    const response = await this.client.orderRetrieve(params.orderId, {
      transactionId: params.transactionId,
      pointOfSale: params.pointOfSale,
      sender: this.transformSender(params.sender),
      feAuthHeaders: params.feAuthHeaders,
    });

    return { transactionId: params.transactionId, response };
  }

  /**
   * 5. OrderCancel - Cancel booking
   */
  async cancelOrder(
    params: BaseParams & {
      orderId: string;
      orderItemRefId?: string[];
      paxRefId?: string[];
    },
  ): Promise<{ transactionId: string; response: OrderCancelRS }> {
    const query = {
      OrderID: params.orderId,
      ...(params.orderItemRefId && { OrderItemRefID: params.orderItemRefId }),
      ...(params.paxRefId && { PaxRefID: params.paxRefId }),
    };

    const response = await this.client.orderCancel(query, {
      transactionId: params.transactionId,
      pointOfSale: params.pointOfSale,
      sender: this.transformSender(params.sender),
      feAuthHeaders: params.feAuthHeaders,
    });

    return { transactionId: params.transactionId, response };
  }

  /**
   * 6. OrderChange - Change booking (7 modes)
   *
   * IMPORTANT: There are 2 methods for deferred ticketing:
   * 1. changeOrderChoice.acceptRepricedOrder.offerRefId (legacy method)
   * 2. repricedOrderId (maps directly to Query.RepricedOrderID) <- newly added
   */
  async changeOrder(
    params: BaseParams & {
      orderId: string;
      changeOrderChoice: ChangeOrderChoiceParam;
      reasonCode?: string;
      // For deferred ticketing (maps directly to Query.RepricedOrderID)
      repricedOrderId?: {
        orderId: string;
        orderItemRefId?: string[];
      };
      paxList?: PaxDetailParam[];
      paymentList?: PaymentParam[];
      contactInfoList?: ContactInfoParam[];
      criteria?: {
        direct?: boolean;
        airlinePreference?: { airlineId?: string[] };
        programCriteria?: Array<{
          airlineId: string;
          contractId?: string;
          accountId?: string[];
          typeCode?: string;
        }>;
        promotionCriteria?: Array<{
          airlineId: string;
          promotionId?: string;
        }>;
        specialFareCriteria?: Array<{
          airlineId?: string;
          accountId?: string;
          typeCode?: string;
        }>;
        existingOrderCriteria?: {
          orderId: string;
          paxRefId?: string[];
        };
      };
      responseParameter?: {
        currencyCode?: string;
        languageUsage?: {
          langCode: string;
          langUsageType?: string;
        };
      };
    },
  ): Promise<{ transactionId: string; response: OrderViewRS }> {
    const changeOrderChoice: Record<string, unknown> = {};

    // 1. AcceptSelectedQuotedOfferList
    if (params.changeOrderChoice.acceptSelectedQuotedOfferList) {
      changeOrderChoice.AcceptSelectedQuotedOfferList = {
        SelectedPricedOffer:
          params.changeOrderChoice.acceptSelectedQuotedOfferList.selectedPricedOffer.map(
            (o) => ({
              OfferID: o.offerId,
              Owner: o.owner,
              ...(o.responseId && { ResponseID: o.responseId }),
              OfferItems: o.offerItems.map((item) => ({
                OfferItemID: item.offerItemId,
                PaxRefID: item.paxRefId,
                ...(item.seatSelection && {
                  SeatSelection: {
                    Column: item.seatSelection.column,
                    Row: item.seatSelection.row,
                  },
                }),
                ...(item.bookingInstructions && {
                  BookingInstructions: {
                    ...(item.bookingInstructions.text && {
                      Text: item.bookingInstructions.text,
                    }),
                    ...(item.bookingInstructions.ositext && {
                      Ositext: item.bookingInstructions.ositext,
                    }),
                  },
                }),
              })),
            }),
          ),
      };
    }

    // 2. AcceptOrderItemList
    if (params.changeOrderChoice.acceptOrderItemList) {
      changeOrderChoice.AcceptOrderItemList = {
        Owner: params.changeOrderChoice.acceptOrderItemList.owner,
        ...(params.changeOrderChoice.acceptOrderItemList.offerItemRefId && {
          OfferItemRefID:
            params.changeOrderChoice.acceptOrderItemList.offerItemRefId,
        }),
      };
    }

    // 3. AcceptRepricedOrder
    if (params.changeOrderChoice.acceptRepricedOrder) {
      changeOrderChoice.AcceptRepricedOrder = {
        OfferRefID: params.changeOrderChoice.acceptRepricedOrder.offerRefId,
      };
    }

    // 4. UpdatePax
    if (params.changeOrderChoice.updatePax) {
      changeOrderChoice.UpdatePax = params.changeOrderChoice.updatePax.map(
        (p) => ({
          ...(p.currentPaxRefId && { CurrentPaxRefID: p.currentPaxRefId }),
          ...(p.newPaxRefId && { NewPaxRefID: p.newPaxRefId }),
        }),
      );
    }

    // 5. AcceptChange
    if (params.changeOrderChoice.acceptChange) {
      changeOrderChoice.AcceptChange = {
        OrderItemRefID: params.changeOrderChoice.acceptChange.orderItemRefId,
      };
    }

    // Build Query (ReasonCode is at Query level!)
    const query: Record<string, unknown> = {
      OrderID: params.orderId,
      ...(params.reasonCode && { ReasonCode: params.reasonCode }),
    };

    // RepricedOrderID (for deferred ticketing - included directly at Query level)
    // IMPORTANT: Different approach from ChangeOrderChoice.AcceptRepricedOrder!
    if (params.repricedOrderId) {
      query.RepricedOrderID = {
        OrderID: params.repricedOrderId.orderId,
        ...(params.repricedOrderId.orderItemRefId && {
          OrderItemRefID: params.repricedOrderId.orderItemRefId,
        }),
      };
    }

    // ChangeOrderChoice (legacy method - only add when not empty)
    if (Object.keys(changeOrderChoice).length > 0) {
      query.ChangeOrderChoice = changeOrderChoice;
    }

    // Add PaxList
    if (params.paxList && params.paxList.length > 0) {
      query.PaxList = this.buildOrderPaxList(params.paxList);
    }

    // Add PaymentList
    if (params.paymentList && params.paymentList.length > 0) {
      query.PaymentList = this.buildPaymentList(params.paymentList);
    }

    // Add ContactInfoList
    if (params.contactInfoList && params.contactInfoList.length > 0) {
      query.ContactInfoList = this.buildContactInfoList(params.contactInfoList);
    }

    // Criteria
    if (params.criteria) {
      const criteria = this.transformCriteria(params.criteria);
      if (Object.keys(criteria).length > 0) {
        query.Criteria = criteria;
      }
    }

    // ResponseParameter
    if (params.responseParameter) {
      const rp = this.transformResponseParameter(params.responseParameter);
      if (Object.keys(rp).length > 0) {
        query.ResponseParameter = rp;
      }
    }

    const response = await this.client.orderChange(
      query as unknown as Parameters<typeof this.client.orderChange>[0],
      {
        transactionId: params.transactionId,
        pointOfSale: params.pointOfSale,
        sender: this.transformSender(params.sender),
        feAuthHeaders: params.feAuthHeaders,
      },
    );

    return { transactionId: params.transactionId, response };
  }

  /**
   * 7. ServiceList - Ancillary service list inquiry
   *
   * Supported workflows:
   * - WF_PB_SERVICE: Prime Booking with service selection
   * - WF_PB_SEAT_SERVICE: Prime Booking with seat + service selection
   * - WF_HELD_SERVICE: Add service to held booking
   * - WF_TKT_SERVICE: Add service after ticketing
   *
   * IMPORTANT: Per OpenAPI spec, uses Query.Offer (singular) or Query.Order (singular)!
   */
  async getServiceList(
    params: BaseParams & {
      offer?: OfferParam;
      orderId?: string;
      orderItems?: Array<{
        orderItemId: string;
        paxRefId?: string[];
      }>;
      paxList: Array<{
        paxId: string;
        ptc: string;
        loyaltyProgramAccount?: Array<{
          accountNumber?: string;
          programCode?: string;
          programName?: string;
          signInId?: string;
          tierCode?: string;
          tierName?: string;
        }>;
      }>;
      criteria?: {
        programCriteria?: Array<{
          airlineId: string;
          contractId?: string;
          accountId?: string[];
          typeCode?: string;
        }>;
        specialFareCriteria?: Array<{
          airlineId: string;
          accountId?: string;
        }>;
        existingOrderCriteria?: {
          orderId: string;
          paxRefId: string[];
        };
      };
      responseParameter?: {
        currencyCode: string;
        languageUsage?: {
          langCode: string;
          langUsageType?: string;
        };
      };
    },
  ): Promise<{ transactionId: string; response: ServiceListRS }> {
    const query: Record<string, unknown> = {};

    // PaxList transformation (includes LoyaltyProgramAccount - supports AF, KL)
    query.PaxList = params.paxList.map((pax) => ({
      PaxID: pax.paxId,
      Ptc: pax.ptc,
      ...(pax.loyaltyProgramAccount &&
        pax.loyaltyProgramAccount.length > 0 && {
          LoyaltyProgramAccount: pax.loyaltyProgramAccount.map((lpa) => ({
            ...(lpa.accountNumber && { AccountNumber: lpa.accountNumber }),
            ...(lpa.programCode && { ProgramCode: lpa.programCode }),
            ...(lpa.programName && { ProgramName: lpa.programName }),
            ...(lpa.signInId && { SignInID: lpa.signInId }),
            ...(lpa.tierCode && { TierCode: lpa.tierCode }),
            ...(lpa.tierName && { TierName: lpa.tierName }),
          })),
        }),
    }));

    // Prime Booking (offer-based) - uses singular Offer!
    if (params.offer) {
      const offerQuery: Record<string, unknown> = {
        ResponseID: params.offer.responseId,
        OfferID: params.offer.offerId,
        Owner: params.offer.owner,
      };

      // Only add if OfferItems exist
      if (params.offer.offerItems && params.offer.offerItems.length > 0) {
        offerQuery.OfferItem = params.offer.offerItems.map((item) => ({
          OfferItemID: item.offerItemId,
          ...(item.paxRefId && item.paxRefId.length > 0 && {
            PaxRefID: item.paxRefId,
          }),
        }));
      }

      query.Offer = offerQuery;
    }

    // Post-Booking (order-based) - uses singular Order!
    if (params.orderId) {
      const orderQuery: Record<string, unknown> = {
        OrderID: params.orderId,
      };

      // Add if OrderItems exist
      if (params.orderItems && params.orderItems.length > 0) {
        orderQuery.OrderItem = params.orderItems.map((item) => ({
          OrderItemID: item.orderItemId,
          ...(item.paxRefId && item.paxRefId.length > 0 && {
            PaxRefID: item.paxRefId,
          }),
        }));
      }

      query.Order = orderQuery;
    }

    // Criteria (special fares, programs, etc.)
    if (params.criteria) {
      const criteria: Record<string, unknown> = {};

      if (
        params.criteria.programCriteria &&
        params.criteria.programCriteria.length > 0
      ) {
        criteria.ProgramCriteria = params.criteria.programCriteria.map((pc) => ({
          AirlineID: pc.airlineId,
          ...(pc.contractId && { ContractID: pc.contractId }),
          ...(pc.accountId && { AccountID: pc.accountId }),
          ...(pc.typeCode && { TypeCode: pc.typeCode }),
        }));
      }

      if (
        params.criteria.specialFareCriteria &&
        params.criteria.specialFareCriteria.length > 0
      ) {
        criteria.SpecialFareCriteria = params.criteria.specialFareCriteria.map(
          (sfc) => ({
            AirlineID: sfc.airlineId,
            ...(sfc.accountId && { AccountID: sfc.accountId }),
          }),
        );
      }

      if (params.criteria.existingOrderCriteria) {
        criteria.ExistingOrderCriteria = {
          OrderID: params.criteria.existingOrderCriteria.orderId,
          PaxRefID: params.criteria.existingOrderCriteria.paxRefId,
        };
      }

      if (Object.keys(criteria).length > 0) {
        query.Criteria = criteria;
      }
    }

    // ResponseParameter (response currency, language settings)
    if (params.responseParameter) {
      const responseParam: Record<string, unknown> = {
        CurrencyCode: params.responseParameter.currencyCode,
      };

      if (params.responseParameter.languageUsage) {
        responseParam.LanguageUsage = {
          LangCode: params.responseParameter.languageUsage.langCode,
          ...(params.responseParameter.languageUsage.langUsageType && {
            LangUsageType: params.responseParameter.languageUsage.langUsageType,
          }),
        };
      }

      query.ResponseParameter = responseParam;
    }

    const response = await this.client.serviceList(
      query as unknown as Parameters<typeof this.client.serviceList>[0],
      {
        transactionId: params.transactionId,
        pointOfSale: params.pointOfSale,
        sender: this.transformSender(params.sender),
        feAuthHeaders: params.feAuthHeaders,
      },
    );

    return { transactionId: params.transactionId, response };
  }

  /**
   * 8. SeatAvailability - Seat availability inquiry
   *
   * Supported workflows:
   * - WF_PB_SEAT: Prime Booking with seat selection
   * - WF_PB_SEAT_SERVICE: Prime Booking with seat + service selection
   * - WF_HELD_SEAT: Seat change for held booking
   * - WF_TKT_SEAT: Seat change after ticketing
   *
   * IMPORTANT: Per OpenAPI spec, uses Query.Offer (singular) or Query.Order (singular)!
   */
  async getSeatAvailability(
    params: BaseParams & {
      offer?: OfferParam;
      order?: {
        orderId: string;
        orderItems?: Array<{
          orderItemId: string;
          paxRefId?: string[];
          paxSegmentRefId?: string[];
        }>;
      };
      // Legacy support (deprecated - use order instead)
      orderId?: string;
      paxList: Array<PaxSimpleParam & {
        birthDate?: string;
        loyaltyProgramAccount?: Array<{
          accountNumber?: string;
          programCode?: string;
          programName?: string;
          signInId?: string;
          tierCode?: string;
          tierName?: string;
        }>;
      }>;
      criteria?: {
        direct?: boolean;
        airlinePreference?: { airlineId?: string[] };
        programCriteria?: Array<{
          airlineId: string;
          contractId?: string;
          accountId?: string[];
          typeCode?: string;
        }>;
        promotionCriteria?: Array<{
          airlineId: string;
          promotionId?: string;
        }>;
        specialFareCriteria?: Array<{
          airlineId?: string;
          accountId?: string;
          typeCode?: string;
        }>;
        existingOrderCriteria?: {
          orderId: string;
          paxRefId?: string[];
        };
      };
      responseParameter?: {
        currencyCode?: string;
        languageUsage?: {
          langCode: string;
          langUsageType?: string;
        };
      };
    },
  ): Promise<{ transactionId: string; response: SeatAvailabilityRS }> {
    const query: Record<string, unknown> = {};

    // Prime Booking (offer-based) - OpenAPI: Query.Offer (singular)
    if (params.offer) {
      const offerQuery: Record<string, unknown> = {
        ResponseID: params.offer.responseId,
        OfferID: params.offer.offerId,
        Owner: params.offer.owner,
      };

      // Include OfferItems if present (optional)
      if (params.offer.offerItems && params.offer.offerItems.length > 0) {
        offerQuery.OfferItem = params.offer.offerItems.map((item) => ({
          OfferItemID: item.offerItemId,
          PaxRefID: item.paxRefId,
          ...(item.paxSegmentRefId && {
            PaxSegmentRefID: item.paxSegmentRefId,
          }),
        }));
      }

      query.Offer = offerQuery;
    }

    // Post-Booking (order-based) - OpenAPI: Query.Order (singular)
    if (params.order) {
      const orderQuery: Record<string, unknown> = {
        OrderID: params.order.orderId,
      };

      // Include OrderItems if present (optional)
      if (params.order.orderItems && params.order.orderItems.length > 0) {
        orderQuery.OrderItem = params.order.orderItems.map((item) => ({
          OrderItemID: item.orderItemId,
          ...(item.paxRefId && { PaxRefID: item.paxRefId }),
          ...(item.paxSegmentRefId && { PaxSegmentRefID: item.paxSegmentRefId }),
        }));
      }

      query.Order = orderQuery;
    }

    // Legacy support: when only orderId is provided (deprecated)
    if (!params.order && params.orderId) {
      query.Order = { OrderID: params.orderId };
    }

    // Add PaxList (with optional BirthDate and LoyaltyProgramAccount)
    query.PaxList = params.paxList.map((pax) => ({
      PaxID: pax.paxId,
      Ptc: pax.ptc,
      ...(pax.birthDate && { BirthDate: pax.birthDate }),
      ...(pax.loyaltyProgramAccount &&
        pax.loyaltyProgramAccount.length > 0 && {
          LoyaltyProgramAccount: pax.loyaltyProgramAccount.map((lpa) => ({
            ...(lpa.accountNumber && { AccountNumber: lpa.accountNumber }),
            ...(lpa.programCode && { ProgramCode: lpa.programCode }),
            ...(lpa.programName && { ProgramName: lpa.programName }),
            ...(lpa.signInId && { SignInID: lpa.signInId }),
            ...(lpa.tierCode && { TierCode: lpa.tierCode }),
            ...(lpa.tierName && { TierName: lpa.tierName }),
          })),
        }),
    }));

    // Criteria
    if (params.criteria) {
      const criteria = this.transformCriteria(params.criteria);
      if (Object.keys(criteria).length > 0) {
        query.Criteria = criteria;
      }
    }

    // ResponseParameter
    if (params.responseParameter) {
      const rp = this.transformResponseParameter(params.responseParameter);
      if (Object.keys(rp).length > 0) {
        query.ResponseParameter = rp;
      }
    }

    const response = await this.client.seatAvailability(
      query as unknown as Parameters<typeof this.client.seatAvailability>[0],
      {
        transactionId: params.transactionId,
        pointOfSale: params.pointOfSale,
        sender: this.transformSender(params.sender),
        feAuthHeaders: params.feAuthHeaders,
      },
    );

    return { transactionId: params.transactionId, response };
  }

  /**
   * 9. OrderReshop - Reshop search
   */
  async reshopOrder(
    params: BaseParams & {
      orderId: string;
      actionContext?: string;
      updateOrder: {
        reshopOrder?: {
          serviceOrder: {
            delete?: Array<{
              orderItemRefId: string;
              retainServiceId?: string[];
            }>;
            add?: {
              originDestList: OriginDestParam[];
              cabin?: string;
            };
          };
        };
        cancelOrderRefId?: string;
        repricedOrderRefId?: string; // For deferred ticketing (LH, EK, etc.)
      };
      criteria?: {
        direct?: boolean;
        airlinePreference?: { airlineId?: string[] };
        programCriteria?: Array<{
          airlineId: string;
          contractId?: string;
          accountId?: string[];
          typeCode?: string;
        }>;
        promotionCriteria?: Array<{
          airlineId: string;
          promotionId?: string;
        }>;
        specialFareCriteria?: Array<{
          airlineId?: string;
          accountId?: string;
          typeCode?: string;
        }>;
        existingOrderCriteria?: {
          orderId: string;
          paxRefId?: string[];
        };
      };
      responseParameter?: {
        currencyCode?: string;
        languageUsage?: {
          langCode: string;
          langUsageType?: string;
        };
      };
    },
  ): Promise<{ transactionId: string; response: OrderReshopRS }> {
    const updateOrder: Record<string, unknown> = {};

    // ReshopOrder (itinerary change)
    if (params.updateOrder.reshopOrder) {
      updateOrder.ReshopOrder = {
        ServiceOrder: {
          ...(params.updateOrder.reshopOrder.serviceOrder.delete && {
            Delete: params.updateOrder.reshopOrder.serviceOrder.delete.map(
              (d) => ({
                OrderItemRefID: d.orderItemRefId,
                ...(d.retainServiceId && {
                  RetainServiceID: d.retainServiceId,
                }),
              }),
            ),
          }),
          ...(params.updateOrder.reshopOrder.serviceOrder.add && {
            Add: {
              OriginDestList:
                params.updateOrder.reshopOrder.serviceOrder.add.originDestList.map(
                  (od) => ({
                    OriginCode: od.origin,
                    DestCode: od.destination,
                    DepartureDate: od.departureDate,
                  }),
                ),
              ...(params.updateOrder.reshopOrder.serviceOrder.add.cabin && {
                Cabin: params.updateOrder.reshopOrder.serviceOrder.add.cabin,
              }),
            },
          }),
        },
      };
    }

    // CancelOrderRefID (refund search) - string type!
    if (params.updateOrder.cancelOrderRefId) {
      updateOrder.CancelOrderRefID = params.updateOrder.cancelOrderRefId;
    }

    // RepricedOrderRefID (for deferred ticketing - LH, EK, etc.) - string type!
    if (params.updateOrder.repricedOrderRefId) {
      updateOrder.RepricedOrderRefID = params.updateOrder.repricedOrderRefId;
    }

    const query: Record<string, unknown> = {
      OrderID: params.orderId,
      ...(params.actionContext && { ActionContext: params.actionContext }),
      UpdateOrder: updateOrder,
    };

    // Criteria
    if (params.criteria) {
      const criteria = this.transformCriteria(params.criteria);
      if (Object.keys(criteria).length > 0) {
        query.Criteria = criteria;
      }
    }

    // ResponseParameter
    if (params.responseParameter) {
      const rp = this.transformResponseParameter(params.responseParameter);
      if (Object.keys(rp).length > 0) {
        query.ResponseParameter = rp;
      }
    }

    const response = await this.client.orderReshop(
      query as unknown as OrderReshopQuery,
      {
        transactionId: params.transactionId,
        pointOfSale: params.pointOfSale,
        sender: this.transformSender(params.sender),
        feAuthHeaders: params.feAuthHeaders,
      },
    );

    return { transactionId: params.transactionId, response };
  }

  /**
   * 10. OrderQuote - Change quote inquiry
   *
   * 2 modes:
   * - Mode 1: selectedOffer (Seat/Service Quote)
   * - Mode 2: repricedOrderId (Deferred ticketing fare recalculation)
   *
   * CRITICAL: repricedOrderId is passed as an object and mapped to Query.RepricedOrderID!
   */
  async getOrderQuote(
    params: BaseParams & {
      orderId?: string;
      selectedOffer?: Array<{
        offerId: string;
        owner: string;
        responseId?: string; // Required for WF_TKT_VOLCHANGE, etc.
        offerItems: OfferItemParam[];
        fopPromotion?: {
          promotionCode: string;
          paymentType?: string;
          cardCode?: string;
          cardName?: string;
        };
      }>;
      // For deferred ticketing (object format - maps to Query.RepricedOrderID)
      repricedOrderId?: {
        orderId: string;
        orderItemRefId?: string[];
      };
      paxList?: Array<PaxSimpleParam & {
        birthDate?: string;
        paxRefId?: string;
        loyaltyProgramAccount?: Array<{
          accountNumber?: string;
          programCode?: string;
          programName?: string;
          signInId?: string;
          tierCode?: string;
          tierName?: string;
        }>;
      }>;
      criteria?: {
        direct?: boolean;
        airlinePreference?: { airlineId?: string[] };
        programCriteria?: Array<{
          airlineId: string;
          contractId?: string;
          accountId?: string[];
          typeCode?: string;
        }>;
        promotionCriteria?: Array<{
          airlineId: string;
          promotionId?: string;
        }>;
        specialFareCriteria?: Array<{
          airlineId?: string;
          accountId?: string;
          typeCode?: string;
        }>;
        existingOrderCriteria?: {
          orderId: string;
          paxRefId?: string[];
        };
      };
      responseParameter?: {
        currencyCode?: string;
        languageUsage?: {
          langCode: string;
          langUsageType?: string;
        };
      };
    },
  ): Promise<{ transactionId: string; response: OrderQuoteRS }> {
    const query: Record<string, unknown> = {};

    // Mode 1: SelectedOffer (Seat/Service Quote)
    if (params.selectedOffer) {
      query.SelectedOffer = params.selectedOffer.map((o) => ({
        OfferID: o.offerId,
        Owner: o.owner,
        // ResponseID (required for WF_TKT_VOLCHANGE, etc.)
        ...(o.responseId && { ResponseID: o.responseId }),
        OfferItems: o.offerItems.map((item) => ({
          OfferItemID: item.offerItemId,
          PaxRefID: item.paxRefId,
          // SeatSelection (seat selection)
          ...(item.seatSelection && {
            SeatSelection: {
              Column: item.seatSelection.column,
              Row: item.seatSelection.row,
            },
          }),
          // BookingInstructions (service - baggage, etc.)
          ...(item.bookingInstructions && {
            BookingInstructions: {
              ...(item.bookingInstructions.text && {
                Text: item.bookingInstructions.text,
              }),
              ...(item.bookingInstructions.ositext && {
                Ositext: item.bookingInstructions.ositext,
              }),
            },
          }),
        })),
        // FopPromotion (card/payment promotion)
        ...(o.fopPromotion && {
          FopPromotion: {
            PromotionCode: o.fopPromotion.promotionCode,
            ...(o.fopPromotion.paymentType && { PaymentType: o.fopPromotion.paymentType }),
            ...(o.fopPromotion.cardCode && { CardCode: o.fopPromotion.cardCode }),
            ...(o.fopPromotion.cardName && { CardName: o.fopPromotion.cardName }),
          },
        }),
      }));
    }

    // Mode 2: RepricedOrderID (Hold confirmation Quote)
    // CRITICAL: Must be mapped as an object! { OrderID, OrderItemRefID }
    if (params.repricedOrderId) {
      query.RepricedOrderID = {
        OrderID: params.repricedOrderId.orderId,
        ...(params.repricedOrderId.orderItemRefId && {
          OrderItemRefID: params.repricedOrderId.orderItemRefId,
        }),
      };
    }

    // OrderID
    if (params.orderId) {
      query.OrderID = params.orderId;
    }

    // PaxList (with optional BirthDate, PaxRefID, LoyaltyProgramAccount)
    if (params.paxList && params.paxList.length > 0) {
      query.PaxList = params.paxList.map((pax) => ({
        PaxID: pax.paxId,
        Ptc: pax.ptc,
        ...(pax.birthDate && { BirthDate: pax.birthDate }),
        ...(pax.paxRefId && { PaxRefID: pax.paxRefId }),
        ...(pax.loyaltyProgramAccount &&
          pax.loyaltyProgramAccount.length > 0 && {
            LoyaltyProgramAccount: pax.loyaltyProgramAccount.map((lpa) => ({
              ...(lpa.accountNumber && { AccountNumber: lpa.accountNumber }),
              ...(lpa.programCode && { ProgramCode: lpa.programCode }),
              ...(lpa.programName && { ProgramName: lpa.programName }),
              ...(lpa.signInId && { SignInID: lpa.signInId }),
              ...(lpa.tierCode && { TierCode: lpa.tierCode }),
              ...(lpa.tierName && { TierName: lpa.tierName }),
            })),
          }),
      }));
    }

    // Criteria
    if (params.criteria) {
      const criteria = this.transformCriteria(params.criteria);
      if (Object.keys(criteria).length > 0) {
        query.Criteria = criteria;
      }
    }

    // ResponseParameter
    if (params.responseParameter) {
      const rp = this.transformResponseParameter(params.responseParameter);
      if (Object.keys(rp).length > 0) {
        query.ResponseParameter = rp;
      }
    }

    const response = await this.client.orderQuote(
      query as Parameters<typeof this.client.orderQuote>[0],
      {
        transactionId: params.transactionId,
        pointOfSale: params.pointOfSale,
        sender: this.transformSender(params.sender),
        feAuthHeaders: params.feAuthHeaders,
      },
    );

    return { transactionId: params.transactionId, response };
  }
}
