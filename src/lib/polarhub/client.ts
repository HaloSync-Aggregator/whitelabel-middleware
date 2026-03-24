/**
 * PolarHub HTTP Client
 *
 * HTTP client that handles all PolarHub API calls.
 *
 * CRITICAL:
 * - transactionId must be provided by FE (do not generate in middleware!)
 * - If FE provides HMAC headers, pass them through; otherwise, generate from environment variables
 * - All APIs use the POST method
 */

import { Logger } from '@nestjs/common';
import {
  PolarHubConfig,
  RequestOptions,
  Sender,
  FEAuthHeaders,
  AirShoppingQuery,
  AirShoppingRS,
  OfferPriceQuery,
  OfferPriceRS,
  OrderCreateQuery,
  OrderViewRS,
  OrderCancelQuery,
  OrderCancelRS,
  OrderChangeQuery,
  ServiceListQuery,
  ServiceListRS,
  SeatAvailabilityQuery,
  SeatAvailabilityRS,
  OrderReshopQuery,
  OrderReshopRS,
  OrderQuoteQuery,
  OrderQuoteRS,
} from './types';
import { getOrGenerateAuthHeaders } from './utils/auth';
import { PolarHubError, checkResultMessage } from './utils/error-handler';
import { getRequestLogger, consoleLogger } from './utils/logger';

export class PolarHubClient {
  private readonly config: Required<
    Omit<PolarHubConfig, 'agencyName' | 'agencyContactId' | 'siteCode'>
  > & {
    siteCode?: string;
    agencyName?: string;
    agencyContactId?: string;
  };
  private readonly logger = new Logger(PolarHubClient.name);
  private readonly requestLogger = getRequestLogger();

  constructor(config: PolarHubConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      tenant: config.tenant,
      secretBase64: config.secretBase64,
      siteCode: config.siteCode,
      agencyName: config.agencyName,
      agencyContactId: config.agencyContactId,
      timeout: config.timeout || 30000,
      retryCount: config.retryCount || 3,
      loggingEnabled: config.loggingEnabled ?? true,
    };
  }

  /**
   * Build Sender object
   * FE-provided sender takes priority; falls back to environment variables
   */
  private buildSender(customSender?: Sender): Sender {
    if (customSender) {
      return customSender;
    }

    return {
      TravelAgency: {
        AgencyID: this.config.tenant,
        ...(this.config.siteCode && { SiteCode: this.config.siteCode }),
        ...(this.config.agencyName && { AgencyName: this.config.agencyName }),
        ...(this.config.agencyContactId && {
          ContactInfoRefID: [this.config.agencyContactId],
        }),
      },
    };
  }

  /**
   * Execute HTTP request with HMAC authentication
   *
   * CRITICAL: transactionId must be provided by FE!
   */
  private async request<TRequest, TResponse>(
    endpoint: string,
    body: TRequest,
    options: RequestOptions,
  ): Promise<TResponse> {
    // transactionId required validation
    if (!options.transactionId) {
      throw new Error('transactionId is required - must be provided by FE');
    }

    const transactionId = options.transactionId;
    const pointOfSale = options.pointOfSale || 'KR';
    const sender = this.buildSender(options.sender);

    // Build request body
    const requestBody = {
      Sender: sender,
      PointOfSale: pointOfSale,
      TransactionID: transactionId,
      ...body,
    };

    const bodyRaw = JSON.stringify(requestBody);

    // HMAC auth headers (FE pass-through or newly generated)
    const headers = getOrGenerateAuthHeaders(
      {
        tenant: this.config.tenant,
        secretBase64: this.config.secretBase64,
      },
      bodyRaw,
      options.feAuthHeaders,
    );

    const url = `${this.config.baseUrl}${endpoint}`;

    // Request logging
    if (this.config.loggingEnabled) {
      await this.requestLogger.logRequest(transactionId, endpoint, requestBody);
      consoleLogger.request(this.extractApiName(endpoint), transactionId);
    }

    const startTime = Date.now();
    let lastError: Error | null = null;

    // Retry loop
    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout,
        );

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: bodyRaw,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        const duration = Date.now() - startTime;

        // Response logging
        if (this.config.loggingEnabled) {
          await this.requestLogger.logResponse(
            transactionId,
            endpoint,
            data,
            duration,
          );
          consoleLogger.response(
            this.extractApiName(endpoint),
            transactionId,
            duration,
            true,
          );
        }

        // Check for API-level errors
        checkResultMessage(data.ResultMessage);

        return data as TResponse;
      } catch (error) {
        lastError = error as Error;
        const duration = Date.now() - startTime;

        // Error logging
        if (this.config.loggingEnabled) {
          await this.requestLogger.logResponse(
            transactionId,
            endpoint,
            null,
            duration,
            lastError,
          );
          consoleLogger.response(
            this.extractApiName(endpoint),
            transactionId,
            duration,
            false,
          );
        }

        // Do not retry PolarHub errors
        if (error instanceof PolarHubError) {
          throw error;
        }

        // Retry network errors with exponential backoff
        if (attempt < this.config.retryCount) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.warn(
            `Request failed (attempt ${attempt}/${this.config.retryCount}), retrying in ${delay}ms...`,
          );
          await this.delay(delay);
          continue;
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractApiName(endpoint: string): string {
    const parts = endpoint.split('/');
    return parts[parts.length - 1];
  }

  // ============================================
  // API ENDPOINTS (10 endpoints)
  // ============================================

  /**
   * 1. AirShopping - Flight search
   * Endpoint: POST /hub/polarpie/v2/airShopping
   */
  async airShopping(
    query: AirShoppingQuery,
    options: RequestOptions,
  ): Promise<AirShoppingRS> {
    return this.request<{ Query: AirShoppingQuery }, AirShoppingRS>(
      '/hub/polarpie/v2/airShopping',
      { Query: query },
      options,
    );
  }

  /**
   * 2. OfferPrice - Detailed price inquiry
   * Endpoint: POST /hub/polarpie/v2/offerPrice
   *
   * IMPORTANT: Must use the same TransactionID as AirShopping
   */
  async offerPrice(
    query: OfferPriceQuery,
    options: RequestOptions,
  ): Promise<OfferPriceRS> {
    return this.request<{ Query: OfferPriceQuery }, OfferPriceRS>(
      '/hub/polarpie/v2/offerPrice',
      { Query: query },
      options,
    );
  }

  /**
   * 3. OrderCreate - Create booking
   * Endpoint: POST /hub/polarpie/v2/order
   *
   * IMPORTANT: Must use the same TransactionID as OfferPrice
   */
  async orderCreate(
    query: OrderCreateQuery,
    options: RequestOptions,
  ): Promise<OrderViewRS> {
    return this.request<{ Query: OrderCreateQuery }, OrderViewRS>(
      '/hub/polarpie/v2/order',
      { Query: query },
      options,
    );
  }

  /**
   * 4. OrderRetrieve - Retrieve booking
   * Endpoint: POST /hub/polarpie/v2/orderRetrieve
   *
   * CRITICAL: TransactionID must be provided by FE!
   */
  async orderRetrieve(
    orderId: string,
    options: RequestOptions,
  ): Promise<OrderViewRS> {
    return this.request<{ Query: { OrderID: string } }, OrderViewRS>(
      '/hub/polarpie/v2/orderRetrieve',
      { Query: { OrderID: orderId } },
      options,
    );
  }

  /**
   * 5. OrderCancel - Cancel booking
   * Endpoint: POST /hub/polarpie/v2/orderCancel
   */
  async orderCancel(
    query: OrderCancelQuery,
    options: RequestOptions,
  ): Promise<OrderCancelRS> {
    return this.request<{ Query: OrderCancelQuery }, OrderCancelRS>(
      '/hub/polarpie/v2/orderCancel',
      { Query: query },
      options,
    );
  }

  /**
   * 6. OrderChange - Change booking
   * Endpoint: POST /hub/polarpie/v2/orderChange
   *
   * Supports 7 modes:
   * - AcceptSelectedQuotedOfferList: Seat/service change, itinerary change after ticketing
   * - AcceptOrderItemList: Hold confirmation
   * - AcceptRepricedOrder: Hold itinerary change
   * - UpdatePax: Passenger information change
   * - AcceptChange: Accept OCN
   * - ReasonCode='DIV': PNR split
   * - ReasonCode='104': Payment deadline extension (TK only)
   */
  async orderChange(
    query: OrderChangeQuery,
    options: RequestOptions,
  ): Promise<OrderViewRS> {
    return this.request<{ Query: OrderChangeQuery }, OrderViewRS>(
      '/hub/polarpie/v2/orderChange',
      { Query: query },
      options,
    );
  }

  /**
   * 7. ServiceList - Ancillary service list inquiry
   * Endpoint: POST /hub/polarpie/v2/serviceList
   *
   * Supports both Prime Booking (Offer) and Post-Booking (Order)
   */
  async serviceList(
    query: ServiceListQuery,
    options: RequestOptions,
  ): Promise<ServiceListRS> {
    return this.request<{ Query: ServiceListQuery }, ServiceListRS>(
      '/hub/polarpie/v2/serviceList',
      { Query: query },
      options,
    );
  }

  /**
   * 8. SeatAvailability - Seat availability inquiry
   * Endpoint: POST /hub/polarpie/v2/seatAvailability
   *
   * Supports both Prime Booking (Offer) and Post-Booking (Order)
   */
  async seatAvailability(
    query: SeatAvailabilityQuery,
    options: RequestOptions,
  ): Promise<SeatAvailabilityRS> {
    return this.request<{ Query: SeatAvailabilityQuery }, SeatAvailabilityRS>(
      '/hub/polarpie/v2/seatAvailability',
      { Query: query },
      options,
    );
  }

  /**
   * 9. OrderReshop - Reshop search
   * Endpoint: POST /hub/polarpie/v2/orderReshop
   *
   * Use cases:
   * - Itinerary change: Uses ReshopOrder.ServiceOrder
   * - Refund search: Uses CancelOrderRefID
   */
  async orderReshop(
    query: OrderReshopQuery,
    options: RequestOptions,
  ): Promise<OrderReshopRS> {
    return this.request<{ Query: OrderReshopQuery }, OrderReshopRS>(
      '/hub/polarpie/v2/orderReshop',
      { Query: query },
      options,
    );
  }

  /**
   * 10. OrderQuote - Change quote inquiry
   * Endpoint: POST /hub/polarpie/v2/orderQuote
   *
   * 2 modes:
   * - SelectedOffer: Seat/Service Quote
   * - RepricedOrderID: Hold confirmation Quote
   */
  async orderQuote(
    query: OrderQuoteQuery,
    options: RequestOptions,
  ): Promise<OrderQuoteRS> {
    return this.request<{ Query: OrderQuoteQuery }, OrderQuoteRS>(
      '/hub/polarpie/v2/orderQuote',
      { Query: query },
      options,
    );
  }
}
