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
