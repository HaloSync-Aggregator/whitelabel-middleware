/**
 * PolarHub API Types
 *
 * Common type definitions.
 * Defined based on the OpenAPI spec (spec/polarhub.openapi.json).
 */

// ==============================================
// Common Types
// ==============================================

/**
 * HMAC authentication headers provided by FE
 * All 3 headers must be present for pass-through.
 */
export interface FEAuthHeaders {
  'x-date'?: string;
  Digest?: string;
  Authorization?: string;
}

/**
 * Sender - Travel Agency information
 * FE-provided value takes priority, environment variable as fallback
 */
export interface Sender {
  TravelAgency: {
    AgencyID: string;
    SiteCode?: string;
    AgencyName?: string;
    ContactInfoRefID?: string[];
  };
}

/**
 * API request options (common to all APIs)
 * CRITICAL: transactionId must be provided by FE!
 */
export interface RequestOptions {
  transactionId: string; // Must be provided by FE (do not generate in middleware!)
  pointOfSale?: string;
  sender?: Sender;
  feAuthHeaders?: FEAuthHeaders;
}

/**
 * Common response result message
 */
export interface ResultMessage {
  Code: string;
  Message?: string;
  MessageDetail?: {
    Errors?: Array<{
      Owner?: string;
      Message?: string;
      Code?: string;
    }>;
    Warnings?: Array<{
      Owner?: string;
      Message?: string;
      Code?: string;
    }>;
  };
}

// ==============================================
// AirShopping Types
// ==============================================

export interface OriginDest {
  OriginCode: string;
  DestCode: string;
  DepartureDate: string;
}

export interface LoyaltyProgramAccount {
  AccountNumber?: string;
  ProgramOwner?: string;
}

export interface PaxSimple {
  PaxID: string;
  Ptc: string; // ADT | CHD | INF
  BirthDate?: string;
  PaxRefID?: string;
  LoyaltyProgramAccount?: LoyaltyProgramAccount[];
}

export interface Criteria {
  Direct?: boolean;
  AirlinePreference?: {
    AirlineID: string[];
  };
  ProgramCriteria?: Array<{
    AirlineID: string;
    ContractID?: string;
    AccountID?: string[];
    TypeCode?: string;
  }>;
  PromotionCriteria?: Array<{
    AirlineID: string;
    PromotionID?: string;
  }>;
  SpecialFareCriteria?: Array<{
    AirlineID?: string;
    AccountID?: string;
    TypeCode?: string;
  }>;
  ExistingOrderCriteria?: {
    OrderID: string;
    PaxRefID?: string[];
  };
}

export interface ResponseParameter {
  CurrencyCode?: string;
  LanguageUsage?: {
    LangCode: string;
    LangUsageType?: string;
  };
}

export interface FopPromotion {
  PromotionCode: string;
  PaymentType?: string;
  CardCode?: string;
  CardName?: string;
}

export interface AirShoppingQuery {
  OriginDestList: OriginDest[];
  PaxList: PaxSimple[];
  Cabin?: string; // Y | W | C | F
  Criteria?: Criteria;
}

export interface AirShoppingRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  ShoppingResponseID?: string;
  Offer?: unknown[];
  DataLists?: unknown;
}

// ==============================================
// OfferPrice Types
// ==============================================

export interface SeatSelection {
  Column: string;
  Row: string;
}

export interface BookingInstructions {
  Text?: string[];
  Ositext?: string[];
}

export interface OfferItem {
  OfferItemID: string;
  PaxRefID: string[];
  SeatSelection?: SeatSelection;
  BookingInstructions?: BookingInstructions;
}

export interface OfferSelection {
  ResponseID: string;
  OfferID: string;
  Owner: string;
  OfferItems: OfferItem[];
}

export interface OfferPriceQuery {
  Offers: OfferSelection[];
  PaxList: PaxSimple[];
  Criteria?: Criteria;
  ResponseParameter?: ResponseParameter;
  FopPromotion?: FopPromotion[];
}

export interface OfferPriceRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  PricedOffer?: unknown[];
  DataLists?: unknown;
}

// ==============================================
// OrderCreate Types
// ==============================================

export interface Individual {
  NameTitle?: string;
  GivenName: string[];
  Surname: string;
  Birthdate: string;
  Gender?: string; // MALE | FEMALE | UNSPECIFIED
}

export interface IdentityDoc {
  IdentityDocumentType: string; // PT (Passport), etc.
  IdentityDocumentNumber: string;
  ExpiryDate?: string;
  IssuingCountryCode?: string;
  CitizenshipCountryCode?: string;
  ResidenceCountryCode?: string;
  Gender?: string;
}

export interface Phone {
  Label?: string;
  CountryDialingCode?: string;
  PhoneNumber: string;
}

export interface PostalAddress {
  Street?: string[];
  CityName?: string;
  PostalCode?: string;
  CountryCode?: string;
}

export interface ContactInfo {
  ContactInfoID: string;
  EmailAddress?: string[];
  Phone?: Phone[];
  PostalAddress?: PostalAddress[];
  ContactRefusedInd?: boolean;
}

export interface PaxDetail {
  PaxID: string;
  Ptc: string;
  Individual: Individual;
  IdentityDoc?: IdentityDoc[];
  ContactInfoRefID?: string[];
  Gender?: string;
  CitizenshipCountryCode?: string;
  ResidenceCountryCode?: string;
}

export interface OrderItem {
  ResponseID: string;
  OfferID: string;
  Owner: string;
  OfferItems: OfferItem[];
}

export interface PaymentCardMethod {
  CardCode: string;
  CardNumber: string;
  CardHolderName: string;
  EffectiveExpireDate: {
    Expiration: string;
  };
  SeriesCode?: string;
}

export interface Payment {
  Type: string; // Cash | Card | Ag
  Amount: number;
  CurCode: string;
  PaymentCardMethod?: PaymentCardMethod;
  OrderItemID?: string[];
  OfferItemID?: string[];
  PaxRefID?: string[];
}

export interface OrderCreateQuery {
  Order: OrderItem[];
  PaxList: PaxDetail[];
  ContactInfoList?: ContactInfo[];
  PaymentList?: Payment[];
}

export interface OrderViewRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  OrderID?: string;
  Order?: unknown;
  DataLists?: unknown;
}

// ==============================================
// OrderRetrieve Types
// ==============================================

export interface OrderRetrieveQuery {
  OrderID: string;
}

// ==============================================
// OrderCancel Types
// ==============================================

export interface OrderCancelQuery {
  OrderID: string;
  OrderItemRefID?: string[];
  PaxRefID?: string[];
}

export interface OrderCancelRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  OrderID?: string;
  TicketDocInfoList?: unknown[];
}

// ==============================================
// OrderChange Types
// ==============================================

export interface SelectedPricedOffer {
  OfferID: string;
  Owner: string;
  ResponseID?: string;
  OfferItems: OfferItem[];
}

export interface AcceptSelectedQuotedOfferList {
  SelectedPricedOffer: SelectedPricedOffer[];
}

export interface AcceptOrderItemList {
  Owner: string;
  OfferItemRefID?: string[];
}

export interface AcceptRepricedOrder {
  OfferRefID: string[];
}

export interface UpdatePax {
  CurrentPaxRefID?: string;
  NewPaxRefID?: string;
}

export interface AcceptChange {
  OrderItemRefID: string[];
}

export interface ChangeOrderChoice {
  AcceptSelectedQuotedOfferList?: AcceptSelectedQuotedOfferList;
  AcceptOrderItemList?: AcceptOrderItemList;
  AcceptRepricedOrder?: AcceptRepricedOrder;
  UpdatePax?: UpdatePax[];
  AcceptChange?: AcceptChange;
}

export interface OrderChangeQuery {
  OrderID: string;
  ReasonCode?: string;
  ChangeOrderChoice: ChangeOrderChoice;
  PaxList?: PaxDetail[];
  PaymentList?: Payment[];
  ContactInfoList?: ContactInfo[];
  Criteria?: Criteria;
  ResponseParameter?: ResponseParameter;
  FopPromotion?: FopPromotion[];
}

// ==============================================
// ServiceList Types
// ==============================================

export interface ServiceListQuery {
  // Prime Booking (Offer-based)
  Offers?: Array<{
    ResponseID: string;
    OfferID: string;
    Owner: string;
    OfferItems: OfferItem[];
  }>;
  // Post-Booking (Order-based)
  OrderID?: string;
  PaxList: PaxSimple[];
}

export interface ServiceListRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  ALaCarteOffer?: unknown[];
  DataLists?: unknown;
}

// ==============================================
// SeatAvailability Types
// ==============================================

export interface SeatAvailabilityQuery {
  // Prime Booking (Offer-based)
  Offers?: Array<{
    ResponseID: string;
    OfferID: string;
    Owner: string;
    OfferItems: OfferItem[];
  }>;
  // Post-Booking (Order-based)
  OrderID?: string;
  PaxList: PaxSimple[];
}

export interface SeatAvailabilityRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  SeatMap?: unknown[];
  DataLists?: unknown;
}

// ==============================================
// OrderReshop Types
// ==============================================

export interface ReshopServiceOrderDelete {
  OrderItemRefID: string;
  RetainServiceID?: string[];
}

export interface ReshopServiceOrderAdd {
  OriginDestList: OriginDest[];
  Cabin?: string;
}

export interface ReshopServiceOrder {
  Delete?: ReshopServiceOrderDelete[];
  Add?: ReshopServiceOrderAdd;
}

export interface ReshopOrder {
  ServiceOrder: ReshopServiceOrder;
}

export interface UpdateOrder {
  ReshopOrder?: ReshopOrder;
  CancelOrderRefID?: string; // String! Not an object!
  RepricedOrderRefID?: string; // String! For deferred ticketing (LH, EK, etc.)
}

export interface OrderReshopQuery {
  OrderID: string;
  ActionContext?: string; // '8' = Voluntary, '9' = Involuntary
  UpdateOrder: UpdateOrder;
  Criteria?: Criteria;
  ResponseParameter?: ResponseParameter;
}

export interface OrderReshopRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  ReshopOffers?: unknown[];
  DataLists?: unknown;
}

// ==============================================
// OrderQuote Types
// ==============================================

export interface OrderQuoteQuery {
  // Mode 1: SelectedOffer (Seat/Service Quote)
  SelectedOffer?: Array<{
    OfferID: string;
    Owner: string;
    OfferItems: OfferItem[];
  }>;
  // Mode 2: RepricedOrderID (Hold confirmation Quote)
  RepricedOrderID?: string;
  OrderID?: string;
  PaxList?: PaxSimple[];
  Criteria?: Criteria;
  ResponseParameter?: ResponseParameter;
  FopPromotion?: FopPromotion[];
}

export interface OrderQuoteRS {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  QuotedOffer?: unknown[];
  DataLists?: unknown;
}

// ==============================================
// Client Config Types
// ==============================================

export interface PolarHubConfig {
  baseUrl: string;
  tenant: string;
  secretBase64: string;
  siteCode?: string;
  agencyName?: string;
  agencyContactId?: string;
  timeout?: number;
  retryCount?: number;
  loggingEnabled?: boolean;
}

// ==============================================
// Generic API Response
// ==============================================

export interface PolarHubResponse<T = unknown> {
  ResultMessage?: ResultMessage;
  TransactionID?: string;
  [key: string]: T | ResultMessage | string | undefined;
}
