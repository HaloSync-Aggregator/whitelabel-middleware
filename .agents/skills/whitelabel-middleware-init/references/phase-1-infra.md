# Phase 1: Infrastructure Foundation

## Files to Create (4 files)

| # | File | Path |
|---|------|------|
| 1 | polarhub.config.ts | src/config/polarhub.config.ts |
| 2 | health.controller.ts | src/health.controller.ts |
| 3 | app.module.ts | src/app.module.ts |
| 4 | main.ts | src/main.ts |

## File 1: polarhub.config.ts
**Path**: `src/config/polarhub.config.ts`
````typescript
import { registerAs } from '@nestjs/config';

export const polarhubConfig = registerAs('polarhub', () => ({
  baseUrl: process.env.POLARHUB_API_BASE_URL || 'https://polarhub.sandbox.halo-platform.net',
  tenantId: process.env.POLARHUB_TENANT_ID || '',
  apiSecret: process.env.POLARHUB_API_SECRET || '',
  timeoutMs: parseInt(process.env.POLARHUB_TIMEOUT_MS || '30000', 10),
  retryCount: parseInt(process.env.POLARHUB_RETRY_COUNT || '3', 10),

  // Agency Sender Configuration
  siteCode: process.env.POLARHUB_SITE_CODE || '01',
  agencyName: process.env.POLARHUB_AGENCY_NAME,

  // Travel Agency ContactInfo (CTC_TA1)
  // This ContactInfo is ALWAYS injected into sender.travelAgency.contactInfoRefId
  agencyContactId: process.env.POLARHUB_AGENCY_CONTACT_ID || 'CTC_TA1',
  agencyContactInfo: {
    contactInfoId: process.env.POLARHUB_AGENCY_CONTACT_ID || 'CTC_TA1',
    emailAddress: process.env.POLARHUB_AGENCY_EMAIL,
    phone: {
      countryDialingCode: process.env.POLARHUB_AGENCY_PHONE_COUNTRY_CODE,
      phoneNumber: process.env.POLARHUB_AGENCY_PHONE_NUMBER,
    },
    postalAddress: {
      street: process.env.POLARHUB_AGENCY_POSTAL_STREET ? [process.env.POLARHUB_AGENCY_POSTAL_STREET] : undefined,
      postalCode: process.env.POLARHUB_AGENCY_POSTAL_CODE,
      cityName: process.env.POLARHUB_AGENCY_POSTAL_CITY,
      countryCode: process.env.POLARHUB_AGENCY_POSTAL_COUNTRY,
    },
  },
}));

export interface AgencyContactInfo {
  contactInfoId: string;
  emailAddress?: string;
  phone?: {
    countryDialingCode?: string;
    phoneNumber?: string;
  };
  postalAddress?: {
    street?: string[];
    postalCode?: string;
    cityName?: string;
    countryCode?: string;
  };
}

export interface PolarHubConfig {
  baseUrl: string;
  tenantId: string;
  apiSecret: string;
  timeoutMs: number;
  retryCount: number;
  siteCode: string;
  agencyName?: string;
  agencyContactId: string;
  agencyContactInfo: AgencyContactInfo;
}
````

## File 2: health.controller.ts
**Path**: `src/health.controller.ts`
````typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
````

## File 3: app.module.ts
**Path**: `src/app.module.ts`
````typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { polarhubConfig } from './config/polarhub.config';
import { PolarHubModule } from './lib/polarhub/polarhub.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [polarhubConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    PolarHubModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
````

## File 4: main.ts
**Path**: `src/main.ts`
````typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PolarHubExceptionFilter } from './lib/polarhub/filters/polarhub-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new PolarHubExceptionFilter());

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('PolarHub Whitelabel Middleware')
    .setDescription('NDC API Gateway for PolarHub Integration')
    .setVersion('1.0')
    .addTag('air-shopping', 'Flight search operations')
    .addTag('offer-price', 'Offer pricing operations')
    .addTag('order', 'Order management operations')
    .build();

  app.setGlobalPrefix('middleware');

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('middleware', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`PolarHub Middleware running on http://localhost:${port}`);
  console.log(`Swagger API docs at http://localhost:${port}/middleware`);
}

bootstrap();
````

## Phase 1 Completion
- [ ] 4 files created
- Report: "📦 Phase 1/7 완료 - Infrastructure Foundation (4 files)"
