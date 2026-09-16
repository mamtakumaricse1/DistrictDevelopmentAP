import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from '@ddwmd/common';
import { RequestIdInterceptor } from '@ddwmd/common';
import { GatewayHealthController } from './gateway/gateway-health.controller';
import { GatewayProxyMiddleware } from './gateway/gateway-proxy.middleware';
import { GatewayService } from './gateway/gateway.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] })],
  controllers: [GatewayHealthController],
  providers: [
    GatewayService,
    GatewayProxyMiddleware,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
  ],
})
export class GatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(GatewayProxyMiddleware).forRoutes('*');
  }
}
