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
