/**
 * PolarHub Module
 *
 * NestJS module for PolarHub API integration.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PolarHubService } from './polarhub.service';

// Controllers
import { AirShoppingController } from './controllers/air-shopping.controller';
import { OfferPriceController } from './controllers/offer-price.controller';
import { OrderChangeController } from './controllers/order-change.controller';
import { OrderController } from './controllers/order.controller';
import { OrderQuoteController } from './controllers/order-quote.controller';
import { OrderReshopController } from './controllers/order-reshop.controller';
import { SeatAvailabilityController } from './controllers/seat-availability.controller';
import { ServiceListController } from './controllers/service-list.controller';

@Module({
  imports: [ConfigModule],
  controllers: [
    AirShoppingController,
    OfferPriceController,
    OrderChangeController,
    OrderController,
    OrderQuoteController,
    OrderReshopController,
    SeatAvailabilityController,
    ServiceListController,
  ],
  providers: [PolarHubService],
  exports: [PolarHubService],
})
export class PolarHubModule {}
