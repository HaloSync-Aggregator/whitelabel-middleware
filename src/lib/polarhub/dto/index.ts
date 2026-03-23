/**
 * PolarHub DTO Index
 *
 * Re-exports all DTOs.
 *
 * NOTE: Common types (TravelAgencyDto, SenderDto, etc.) are defined locally
 * in each DTO file, which causes name collisions.
 * Therefore, only API-specific DTOs are explicitly exported.
 */

// ==============================================
// Common DTOs
// ==============================================
export * from './common.dto';

// ==============================================
// AirShopping DTOs
// ==============================================
export {
  AirShoppingRequestDto,
  AirShoppingResponseDto,
  AirlinePreferenceDto,
  CriteriaDto as AirShoppingCriteriaDto,
  LanguageUsageDto as AirShoppingLanguageUsageDto,
  ResponseParameterDto as AirShoppingResponseParameterDto,
} from './air-shopping.dto';

// ==============================================
// OfferPrice DTOs
// ==============================================
export * from './offer-price.dto';

// ==============================================
// OrderCreate DTOs
// ==============================================
export {
  OrderCreateRQDto,
  OrderCreateRSDto,
  OrderDto as OrderCreateOrderDto,
  PaxDto as OrderCreatePaxDto,
  LoyaltyProgramAccountDto,
  PaymentCardMethodDto,
  PaymentAmountDto,
  ResultMessageDetailDto,
  ResultMessageDetailErrorDto,
} from './order-create.dto';

// ==============================================
// OrderRetrieve DTOs
// ==============================================
export {
  OrderRetrieveRQDto,
  OrderRetrieveRSDto,
  BookingRefDto,
  PriceDto,
  CouponInfoDto,
  TicketDocInfoDto,
  OrderChangeNoticeDto,
} from './order-retrieve.dto';

// ==============================================
// OrderCancel DTOs
// ==============================================
export {
  OrderCancelRQDto,
  OrderCancelRSDto,
  CancelledOrderDto,
  RefundInfoDto,
} from './order-cancel.dto';

// ==============================================
// OrderChange DTOs
// ==============================================
export {
  OrderChangeRequestDto,
  OrderChangeResponseDto,
  ChangeOrderChoiceDto,
  AcceptSelectedQuotedOfferListDto,
  AcceptOrderItemListDto,
  AcceptRepricedOrderDto,
  UpdatePaxDto,
  AcceptChangeDto,
  CancelUnpaidOrderDto,
  AcceptCancelledOfferDto,
  SelectedPricedOfferDto,
  ChangeOfferItemDto,
} from './order-change.dto';

// ==============================================
// SeatAvailability DTOs
// ==============================================
export {
  SeatAvailabilityRequestDto,
  SeatAvailabilityResponseDto,
  PaxCodeDto,
  OfferRefDto,
  OfferItemRefDto,
  OrderRefDto,
  OrderItemRefDto,
} from './seat-availability.dto';

// ==============================================
// ServiceList DTOs
// ==============================================
export {
  ServiceListRQDto,
  ServiceListRSDto,
  ALaCarteOfferDto,
  ALaCarteOfferItemDto,
  UnitPriceDetailDto,
  BookingInstructionsRSDto,
  OfferDto as ServiceListOfferDto,
  PaxDto as ServiceListPaxDto,
  LoyaltyProgramAccountDto as ServiceListLoyaltyDto,
} from './service-list.dto';

// ==============================================
// OrderReshop DTOs
// ==============================================
export {
  OrderReshopRQDto,
  OrderReshopRSDto,
  UpdateOrderDto,
  ReshopOrderDto,
  ServiceOrderDto,
  DeleteItemDto,
  AddServiceOrderDto,
  ReshopOfferDto,
  RefundQuoteDto,
  TotalPriceDto,
} from './order-reshop.dto';

// ==============================================
// OrderQuote DTOs
// ==============================================
export {
  OrderQuoteRequestDto,
  OrderQuoteResponseDto,
  SelectedOfferDto,
  QuoteOfferItemDto,
  RepricedOrderIdDto,
  AffectDto,
  FopPromotionDto,
} from './order-quote.dto';
